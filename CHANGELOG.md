# Changelog

## 0.5.65 — AVIF to JPG: a genuine zero-dependency win found through research, not assumption (August 2026)

Continuing the search-demand-priority Image work.

- Researched AVIF browser support before building anything, rather than assuming both directions
  of the conversion pair are equally hard (or equally easy): AVIF **decode** has been natively
  supported by every major browser engine since roughly 2020-2023 (Chrome 85+, Firefox 93+, Safari
  16.4+) via the standard `<img>`/`createImageBitmap` pipeline. AVIF **encode**
  (`canvas.toBlob('image/avif')`) is still genuinely inconsistent across browsers as of 2026 --
  solid in Chrome, gaps in Firefox/Safari per multiple current sources.
- **This asymmetry meant one direction was a genuine zero-dependency quick win**: confirmed the
  existing `decodeImage()`/`renderImage()` helpers already used throughout `image-processing.js`
  have no format-specific gating (just checks `file.type.startsWith('image/')`, then uses the
  standard `<img>` decode path) -- meaning AVIF *input* already works through entirely existing,
  already-tested infrastructure, no new library needed.
- Shipped `avif-to-jpg-converter` (`src/product/definitions/avif-converter-tool.js`) as a
  dedicated tool (matching the existing `heic-to-jpg-converter` pattern, not folded into the
  shared generic `image-format-converter`, to avoid touching a helper many other tools depend on).
  Deliberately did **not** build `jpg-to-avif` alongside it, given the encode-side browser support
  gaps -- same "the two directions of a conversion pair aren't equally easy" lesson already
  applied to SVG-to-PNG/PNG-to-SVG in the original classification.
- Verified: `npm run validate` passes all 7 suites (519 tools total, 585 unique tool ids across
  86 definition files); confirmed the new page renders with the correct Arabic title.

---
## 0.5.64 — HEIC to PNG: a correction found while starting the batch, and the first tool shipped without full sandbox verification (August 2026)

Picked HEIC-to-JPG as the highest-search-demand remaining Image gap (iPhone's default photo
format, a very common compatibility pain point) per the site owner's request to prioritize search
volume.

- **Correction found immediately via `npm run list:tools -- heic`**: `heic-to-jpg` was
  miscategorized as "needs investigation" in the 0.5.62 classification -- it was already live as
  `heic-to-jpg-converter` in `document-media-tools.js`, using `heic2any` (a real CDN dependency
  already shipped, previously unnoticed in the classification pass). Exactly the failure mode
  `list-tool-ids.mjs` was built to catch, and it did.
- **A genuine sandbox limitation, not a documentation error this time**: investigated both major
  HEIC libraries (`heic2any`, the newer `heic-to`) to add the missing `heic-to-png` alongside the
  existing JPG converter. Downloaded a real HEIC file from libheif's own GitHub repo, verified it
  as authentic via `file`, and independently decoded it with ImageMagick/libheif as ground truth
  (1280x854). Both libraries hit a hard wall in Node: `heic-to` throws `Worker is not defined`,
  `heic2any` throws `window is not defined` -- both genuinely require browser-only
  `Worker`/`Blob`-URL APIs with no viable Node polyfill (confirmed by trying `worker_threads.Worker`
  directly, which fails differently since it expects file paths, not `blob:` URLs).
- **Disclosed this limitation directly and got an explicit decision from the site owner**: ship
  `heic-to-png-converter` using the same already-proven-in-production `heic2any` engine as the
  existing JPG converter (reusing its exact `loadHeic2Any()` helper, no second dependency), with
  the owner testing it personally in a real browser rather than blocking on a sandbox constraint.
  This is the first tool in this session shipped without the usual full independent-tool
  verification -- explicitly flagged as such, not silently skipped.
- New tool: `heic-to-png-converter` in `document-media-tools.js` (same file as the existing
  `heic-to-jpg-converter`, for consistency and to share the one HEIC engine).
- Corrected the 0.5.62 classification in `docs/ROADMAP.md` to remove the false "needs
  investigation" status for HEIC and document the full finding for future reference.
- Verified: `npm run validate` passes all 7 suites (518 tools total, 584 unique tool ids across
  85 definition files); confirmed the new page renders with the correct Arabic title. **Pixel-
  level decode correctness for `heic-to-png-converter` specifically has not been independently
  verified and awaits the site owner's real-browser test.**

---
## 0.5.63 — All 11 Image "quick win" tools shipped, including a new genuine read+write EXIF library (August 2026)

Implements the full "quick wins" list from the 0.5.62 Image classification.

- **`view-exif` and `edit-exif`**: added `piexifjs` (v1.0.6), the first new dependency since
  `pdf-encrypt-lite` (0.5.59) -- verified thoroughly before use, since most EXIF libraries are
  read-only and this project specifically needed genuine write support. Tested a full real round
  trip before writing any tool code: wrote new EXIF fields to a real JPEG, read them back
  correctly, confirmed the output still opens correctly in two independent tools (Pillow,
  ImageMagick), confirmed `remove()` works. Also caught and explained a subtlety while testing GPS
  coordinate math: `piexifjs` silently truncates non-integer rational numerators when *writing*
  (e.g. `39.84` seconds becomes `39`) -- confirmed this doesn't affect the shipped tools since
  `edit-exif` only writes make/model/software (never GPS) and `view-exif` only *reads* GPS from
  real camera-written data (which already uses proper integer rationals). All EXIF tag constants
  used (`ImageIFD.Make`, `ExifIFD.FocalLength`, `GPSIFD.GPSLatitude`, etc.) were verified to
  actually exist in the real library before use, not assumed from documentation.
- **Reused and tested other algorithms before wiring in**: dominant-color extraction (pixel
  binning into coarse RGB buckets, caught and fixed a real off-by-one clamping bug during testing
  where quantizing 255 could overflow to 256), the grid/contact-sheet/photo-strip layout math
  (reusing the same cover-crop function verified in 0.5.58's `social-media-image-resizer`), and
  image-signature validation (real magic-byte checking, not just trusting the file extension or
  claimed MIME type).
- 11 new tools, organized into 3 new files:
  - `src/product/definitions/image-exif-tools.js`: `view-exif`, `edit-exif`.
  - `src/product/definitions/image-analysis-extra-tools.js`: `dominant-color`, `image-size`
    (dimensions/file size/aspect ratio/format in one report), `compression-analysis` (re-encodes
    at 4 quality levels and reports the size/savings tradeoff at each), `image-validator`
    (magic-byte signature check), `text-watermark`.
  - `src/product/definitions/image-layout-tools.js`: `grid-maker`, `image-contact-sheet` (grid
    with filenames labeled below each cell -- renamed from the catalogue's plain `contact-sheet`
    to avoid confusion with the pre-existing, unrelated `video-contact-sheet-generator`),
    `photo-strip` (vertical photobooth-style strip, 2-6 images), and `image-slider` (built as a
    static labeled side-by-side "before/after" composite image rather than a true interactive
    drag-slider, since the current tool-page renderer only supports static upload-then-download
    tools -- the same UI-paradigm limit noted for live-microphone and PDF-form tools earlier).
- All 3 new files registered in `tool-definitions.js`.
- Verified: `npm run validate` passes all 7 suites cleanly **on the first run** (517 tools total,
  583 unique tool ids across 85 definition files) -- no fix-forward needed, unlike several earlier
  batches, attributed directly to testing every non-trivial algorithm (EXIF round trip, dominant-
  color binning, magic-byte signatures) against real data before writing any tool-definition code.

---
## 0.5.62 — Full Image catalogue classification: 200 items sorted by tier and priority (August 2026)

Planning/documentation only, no code changes. Same treatment as the PDF classification (0.5.61),
applied to the Image section (Parts 3-4, 200 items).

- Cross-checked against the real live tool list; found 40 catalogue items already covered,
  several as parameter variants of one shipped tool rather than separate tools (e.g. resize-by-
  width/height/percentage all fold into the existing `image-resizer`).
- **Important finding, different from PDF**: Image is far more AI-dependent than its explicit
  "AI "-prefixed count (6) suggests. Most of its AI-dependent operations don't say "AI" in the
  name at all -- `remove-background`, `face-swap`, `anime-style`, `skin-smoother`, etc. are all
  genuinely AI/ML-dependent despite plain-sounding names, unlike PDF where AI operations were
  almost all explicitly prefixed. Went through all 200 items individually rather than trusting the
  "AI "-prefix count as a category-dependency signal. Result: **65 of 200 items are AI-dependent**
  (background removal/replacement -- confirmed the single most globally-requested image tool per
  earlier competitor research, genuinely blocked on AI infrastructure -- plus nearly every face-
  related and "image to art style" tool).
- Classified the remaining items: **11 quick wins** (text watermark, a combined EXIF viewer/
  editor absorbing 7 near-duplicate single-field catalogue entries, grid/contact-sheet/photo-strip
  layouts, before/after comparison slider, dominant color, size/compression analysis, file
  validation), **18 needing feasibility investigation first** (HEIC/AVIF/RAW format support all
  need real dedicated decoders with uncertain browser coverage; PNG-to-SVG vector tracing is a
  fundamentally harder problem than its SVG-to-PNG pair despite being listed together; smart-crop/
  auto-rotate/perspective-correction/deskew all imply "smart" detection that may or may not need
  AI per-item; histogram/sharpness/blur/noise detectors are feasible pure pixel-math but need
  testing against real sample images before shipping arbitrary-feeling numbers), **4 hard removal
  operations** (same reasoning as PDF: removing existing content reliably is harder than adding
  new content), and **62 niche/low-priority items** (individual color-adjustment sliders already
  covered by the existing combined adjuster, filter presets likely better as one picker than 10
  separate pages, more platform-preset variants better added to the existing resizer's list than
  shipped separately, and the 6-item batch-wrapper family).
- No product code changed. Verified `npm run validate` still passes all 7 suites (506 tools,
  unaffected by a documentation-only change).

---
## 0.5.61 — Full PDF catalogue classification: 200 items sorted by tier and priority (August 2026)

Planning/documentation only, no code changes. Per the site owner's request, went through the
complete 200-item PDF section (Parts 1-2) of `docs/tools-master-database.txt` systematically,
rather than just checking for gaps as new ideas come up, so future PDF work can be picked in
priority order without re-auditing from scratch each time.

- Cross-checked every catalogue item against the real live tool list (not just slug matching,
  since catalogue naming and shipped naming often differ -- e.g. the catalogue's separate
  `pdf-to-jpg`/`pdf-to-png`/`pdf-to-webp`/`pdf-to-gif` entries are all already covered by one
  generic `pdf-to-images-converter`).
- Classified into 7 buckets, documented in full in `docs/ROADMAP.md`:
  - **Already built (35)**: merge, split, compress, PDF↔Word, PDF↔images, text extraction, page
    operations, watermark, password protect, sign, OCR, and more.
  - **Quick wins, genuinely simple Tier A (23)**: TXT/Markdown/CSV↔PDF, insert blank page/image/
    text, header/footer, redact, search-in-PDF, grayscale/B&W/invert colors, and more -- listed
    in priority order for the next PDF batch.
  - **Needs a real feasibility check before starting (27)**: grouped by *why* each needs
    investigation -- table/document-structure detection for Office format conversions, testing
    against genuinely corrupted files for repair/recover, a UX design decision for
    coordinate-based annotation tools (same pattern as `pdf-sign` but less natural per-item), and
    direct verification of `pdf-lib`'s bookmark/outline APIs given how wrong the encryption
    documentation turned out to be (0.5.58).
  - **Hard removal operations (4)**: removing an existing watermark/logo/background/image is
    fundamentally harder than adding one (needs reliable content detection first) -- not attempted
    for now rather than shipping something that silently fails.
  - **Not feasible with the current stack (10)**: unlock/decrypt/remove-password (confirmed
    0.5.58), form filling (confirmed 0.5.60), and everything needing real PKI/certificate
    infrastructure for legally-meaningful signatures.
  - **AI-dependent, deferred (15)**: summarize/explain/chat/extract/translate/Q&A style tools.
  - **Niche or low real-world priority (85)**: exotic format conversions, font tooling, PDF/A
    standards compliance, print-layout tools, in-browser viewers, and the 10-item batch-wrapper
    family.
- No product code changed. Verified `npm run validate` still passes all 7 suites (506 tools,
  unaffected by a documentation-only change).

---
## 0.5.60 — PDF Signature Placer, Meme Generator; PDF form-filling confirmed architecturally infeasible right now (August 2026)

Continuing the PDF/Image high-demand push.

- Checked `npm run list:tools` for pdf-sign/pdf-signature/pdf-form and sticker/meme/pixelat/
  censor/blur-face/color-palette first. `photo-censor` (blur/pixelate) already existed under a
  name the earlier keyword search missed -- good catch, avoided a duplicate.
- **`pdf-form` (auto-detect and fill a PDF's existing form fields) investigated and found
  architecturally infeasible right now**: confirmed `pdf-lib`'s `getForm()` API genuinely exists
  and works for form filling, but the site's tool-page renderer only supports a *static*,
  pre-defined `inputs` array declared at tool-definition time -- there's no mechanism anywhere in
  `tool-page.js` to generate input fields dynamically based on an uploaded file's actual content
  (i.e., the specific fields a given PDF happens to contain). This is the same class of gap
  identified for live-microphone audio tools (0.5.53's Wave 2 note): a real infrastructure
  decision, not a routine tool to add. Recorded in `docs/ROADMAP.md`.
- **`pdf-sign` shipped instead** (a feasible, static-input-friendly alternative solving the same
  underlying need): places a signature *image* (handwritten or any prepared signature graphic) at
  a chosen page, size, and corner/center position -- reusing the exact `page.drawImage()` pattern
  already used for `video-watermark`/similar tools. Verified with `pdf-lib`'s real image-embedding
  API against a genuine test PDF, confirmed with `pypdf` (an independent tool) that the output has
  the correct page count and dimensions before shipping.
- **`meme-generator` shipped**: classic white-text-with-black-outline top/bottom captions on any
  image, using the canvas's own real `measureText()` for word wrapping (not an estimate) --
  matches the established pattern already used in `roadmap-batch-1.js`'s code-to-image tool for
  canvas text rendering.
- New files: `src/product/definitions/pdf-sign-tool.js`,
  `src/product/definitions/meme-generator-tool.js`, both registered in `tool-definitions.js`.
- Verified: `npm run validate` passes all 7 suites (506 tools total, 572 unique tool ids across
  82 definition files); confirmed both new pages render with correct Arabic titles.

---
## 0.5.59 — PDF Password Protector: a new dependency, added only after real end-to-end verification (August 2026)

Follow-up to the 0.5.58 finding that `pdf-lib` alone can't handle PDF encryption. Per the site
owner's explicit request to specifically prioritize this (high real-world search demand), added
real password-protection -- the first genuinely new external dependency added in this whole
session's work (everything before this reused libraries already present: `pdf-lib`, `pdfjs-dist`,
`jszip`).

- **Verified before writing any tool code, at every layer, against real independent tools --
  not documentation, not the library's own claims**:
  1. Installed `@pdfsmaller/pdf-encrypt-lite` (a ~7KB library built specifically to pair with
     `pdf-lib` for RC4-128 encryption) and generated a real unencrypted test PDF.
  2. Encrypted it with the library, then verified the *output* with `qpdf` (a completely
     independent, unrelated PDF tool) -- confirmed it genuinely requires a password to open,
     correctly rejects a wrong password, and correctly opens with the right one.
  3. Extracted the decrypted text with `pypdf` (a third, independent tool) and confirmed the
     original content survived byte-for-byte intact through the full encrypt/decrypt round trip.
  4. **Tested the exact combined pipeline the real tool uses** (load through `pdf-lib` first to
     normalize the PDF structure, `.save()`, then encrypt the result) end-to-end, again verified
     with `qpdf` and `pypdf` independently -- not just each library tested in isolation.
- Added `loadPdfEncrypt()` to `src/product/pdf-processing.js`, following the exact same
  lazy-load-with-caching pattern as the existing `loadPdfLib()`/`loadPdfJs()`, loaded from jsDelivr
  the same way every other CDN dependency in this project already is. Documented directly in the
  code comment why this library exists separately from `pdf-lib` (the 0.5.58 finding) and that it
  only adds encryption, not decryption -- removing an existing password remains unsolved.
- New tool: `pdf-protect` -- adds a password to a PDF so any standard reader requires it to open
  the file. Minimum 4-character password requirement; clear warning that a forgotten password is
  unrecoverable (the library doesn't retain or expose it anywhere).
- New file: `src/product/definitions/pdf-protect-tool.js`, registered in `tool-definitions.js`.
- Verified: `npm run validate` passes all 7 suites (504 tools total, 570 unique tool ids across
  80 definition files); confirmed the new page renders with the correct Arabic title.
- **Still not solved**: `pdf-unlock` (removing an existing password). This new library only
  encrypts; `pdf-lib` still can't decrypt (per 0.5.58's finding). Would need a genuine PDF
  decryption library, a separate investigation.

---
## 0.5.58 — PDF/Image gap audit: 3 new Image tools, and a real pdf-lib limitation found before it caused a broken tool (August 2026)

Continuing the pre-launch high-demand-coverage push into the two traditionally highest-traffic
categories for a general tool site (PDF: 26 tools, Image: 22-23, both proportionally small next
to Developer's 132).

- **PDF audit finding, important**: checked `npm run list:tools` for password/protect/unlock/
  encrypt, pdf-to-excel, pdf-sign, pdf-form, and pdf-to-powerpoint -- all confirmed missing.
  Password protect/unlock is one of the single most commonly searched PDF operations globally, so
  investigated building it. **Verified directly, rather than trusting documentation**: generated
  a real password-encrypted PDF with `qpdf`, then tested `pdf-lib` v1.17.1 (the exact version this
  project uses) against it. Despite blog posts claiming pdf-lib "supports working with user
  passwords for decryption," `PDFDocument.load(bytes, { password: '...' })` **does not actually
  decrypt at all** in this version -- it throws the same "document is encrypted" error regardless
  of whether a correct, incorrect, or no password is supplied. Confirmed this isn't a mistake on
  my end by testing both a correct and an incorrect password against the same real encrypted file.
  **Conclusion**: PDF protect/unlock is not safely buildable with the current stack without adding
  a real encryption library (a small dedicated one exists, e.g. `@pdfsmaller/pdf-encrypt-lite`,
  ~7KB) -- this is a deliberate infrastructure decision to make once, not something to slip into a
  routine batch. Recorded in `docs/ROADMAP.md` so a future session doesn't repeat the same
  documentation-trusting mistake or silently ship a broken "protect PDF" tool that doesn't
  actually protect anything.
- **Image audit findings**: `image-to-base64`, `base64-to-image`, and social-media preset sizing
  all confirmed missing via `npm run list:tools`.
- 3 new tools, reusing the existing `renderImage` canvas helper (zero new dependencies):
  - `image-to-base64` — encodes an image as a `data:` URL text file, ready to paste into CSS/HTML/
    JSON.
  - `base64-to-image` — decodes Base64 text (with or without the `data:` prefix) back into a
    downloadable image file.
  - `social-media-image-resizer` — crops and resizes to 8 exact platform preset dimensions
    (Instagram square/portrait/story, Facebook cover/post, X post, LinkedIn cover, YouTube
    thumbnail) using a center "cover crop" so the image is never stretched or distorted. The
    cover-crop math (choosing which axis to crop based on comparing source vs target aspect
    ratio) was unit-tested with three real cases (wide-into-square, tall-into-square, exact match)
    before being wired into the tool.
- New file: `src/product/definitions/image-extra-tools.js`, registered in `tool-definitions.js`.
- Confirmed `atob`/`btoa` work identically in the Node test harness and the browser before relying
  on them for `base64-to-image`.
- Caught the same class of issue as `jwt-inspector` (0.5.48) before it could fail in CI: the first
  `base64-to-image` placeholder ended in a literal `...` ellipsis rather than valid Base64, failing
  the automated sample-execution test. Fixed by using a real, minimal, valid 1x1 PNG's Base64
  encoding as the placeholder instead.
- Proactively recomputed and updated the tool-count assertions before running validate.
- Verified: `npm run validate` passes all 7 suites (503 tools total, 569 unique tool ids across
  79 definition files); confirmed all 3 new pages render with correct Arabic titles.

---
## 0.5.57 — BMI/percentage/discount/tip calculators: added, and a deliberate reversal of a past retirement decision (August 2026)

Pre-launch push to cover the highest real-world search-demand tools, guided by the site owner's
explicit request: "if these calculators genuinely have high search demand, build them; if not,
they'd just be unnecessary bloat."

- Checked category distribution first: Developer (132 tools) is proportionally large relative to
  its typical per-tool search volume, while PDF (26) and Image (22-23) -- traditionally among the
  highest-traffic categories for any tool site -- are comparatively smaller. This is background
  context for future prioritization, not something changed in this entry.
- **`bmi-calculator` added** -- confirmed missing via `npm run list:tools` (only niche variants
  like `ponderal-index-calculator` existed, not the standard globally-known BMI formula).
- **Found and resolved a real conflict, not silently**: `percentage-calculator`,
  `discount-calculator`, and `tip-calculator` all already existed as *code* (the latter fully
  live-quality in `finance.js`) but were silently excluded from the actual site via
  `retired-tool-ids.js` -- a deliberate curation decision the site owner made himself on
  2026-07-30 ("Retired 86 low-value arithmetic, direct-formula, and media-metadata calculators"),
  enforced by an explicit regression test asserting `percentage-calculator` and
  `discount-calculator` must stay `null`. Surfaced this conflict directly to the owner rather than
  silently picking a side, since it was his own prior decision being potentially reversed.
- **Researched before deciding**, rather than guessing: web search confirmed "percentage
  calculator" is the flagship/hub tool on essentially every competing calculator site, and
  "discount calculator" / "tip calculator" are commonly offered as separate, distinctly-titled
  pages by the same competitors (not folded into just one general page) -- real evidence of
  distinct standalone search intent for each, not just three low-value near-duplicates of one
  general tool.
- **Decision, made explicitly by the owner**: un-retire all three. Removed their ids from
  `retired-tool-ids.js`. `tip-calculator`'s existing `finance.js` implementation needed no changes.
  Added `percentage-calculator` (3 modes: X% of a number, what-percent-is-X-of-Y, percent change
  between two numbers) and `discount-calculator` (final price + amount saved) in a new
  `src/product/definitions/high-demand-calculators.js`.
- **Updated the regression test rather than leaving it stale or silently deleting it**: replaced
  the two `assert.equal(..., null)` lines in `tests/product/tools.integration.mjs` with assertions
  that these three tools are live, with an inline comment explaining the full history (why they
  were retired, why they're back, and how to re-retire them if this decision is revisited later).
- **Caught a real, useful signal while fixing this**: `tests/product/tools.integration.mjs`
  already contained a hardcoded expectation for `bmi-calculator`'s exact output
  (`value: '22.9'`, `label: 'Healthy weight'` for a 70kg/175cm input) -- meaning `bmi-calculator`
  was anticipated and specifically planned for at some point before this session, just never
  built. My first implementation used `'Normal weight'`; corrected it to match the pre-existing
  expected wording exactly instead of just changing the test to match my own choice.
- All calculator algorithms (BMI classification thresholds, all 3 percentage modes, discount
  amount/final price) were unit-tested with real numeric cases before being wired into tool
  definitions, then pre-executed with real placeholder values before touching
  `tool-definitions.js`.
- Verified: `npm run validate` passes all 7 suites (**500 tools exactly**, 566 unique tool ids
  across 78 definition files); confirmed all 4 tool pages (`bmi-calculator`,
  `percentage-calculator`, `discount-calculator`, `tip-calculator`) render live with correct
  Arabic and English content.

---
## 0.5.56 — 4 new Text Tools: Caesar cipher, acronym generator, line numbers, word wrap (August 2026)

- Checked `npm run list:tools` broadly (case-convert, word-count, character-count, text-encrypt,
  text-hash, text-sort, duplicate-line, morse, caesar, rot13, acronym, text-repeat, line-number,
  text-wrap, syllable, pig-latin) before picking anything. Confirmed `text-case-converter`,
  `word-counter`, `hash-generator` (MD5/SHA), `rot13-encoder-decoder`, and
  `duplicate-line-remover` all already exist -- `rot13` specifically confirmed a general
  configurable-shift `caesar-cipher` is still genuinely distinct (rot13 is just the fixed
  shift-13 special case).
- 4 new tools, zero new dependencies, pure string manipulation:
  - `caesar-cipher` — configurable-shift substitution cipher (encrypt with a shift, decrypt with
    its negative), clearly labeled as educational/puzzle-use only, not real security.
  - `acronym-generator` — first letter of each word in a phrase.
  - `line-number-adder` — prefixes every line with a sequential, zero-padded number and a chosen
    separator.
  - `text-word-wrapper` — breaks long lines at a chosen width without cutting words mid-word.
- All 4 algorithms were unit-tested with real cases before being wired into tool definitions
  (cipher encrypt/decrypt round-trip, acronym extraction, correct zero-padded numbering,
  word-wrap line breaking), then every tool's `calculate()` was pre-executed with its own real
  input values (text, number, and select types) before touching `tool-definitions.js` at all.
- New file: `src/product/definitions/text-extra-tools.js`, registered in `tool-definitions.js`.
- Proactively recomputed and updated the tool-count assertions before running validate.
- Verified: `npm run validate` passes all 7 suites (497 tools total, 563 unique tool ids across
  77 definition files); confirmed all 4 new pages render with correct Arabic titles.

---
## 0.5.55 — 4 new Video Tools: rotate, crop, merge, watermark (August 2026)

- Checked `npm run list:tools` for rotate/crop/merge/concat/watermark/reverse/loop/brightness/
  contrast/mute first, both with and without a `video-` prefix (image/PDF/audio equivalents exist
  for several of these -- e.g. `image-rotate-flip`, `pdf-merge`, `image-watermark-tool` -- but no
  video-specific version of any of them did).
- **Verified every ffmpeg filter command against real ffmpeg before writing any tool code**,
  since ffmpeg.wasm command syntax can't be meaningfully unit-tested any other way and this
  project doesn't have ffmpeg.wasm available for direct testing in this environment: generated an
  actual 320x240 test video with audio, then ran each planned command through the sandbox's
  system `ffmpeg` binary and confirmed the real output dimensions/duration matched expectations
  (`transpose=1`/`transpose=2` for 90° rotation confirmed the dimensions swap correctly,
  `hflip,vflip` for 180°, `crop=w:h:x:y` produced exactly the requested crop size, image `overlay`
  watermarking preserved the base video's dimensions).
- **Caught a real edge case during this testing, before it could surface in production**: the
  first concat/merge approach (`[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1`) failed outright when one
  test input lacked an audio track -- a realistic scenario for arbitrary user-uploaded clips.
  Switched `video-merge` to a video-only concat (`[0:v][1:v]concat=n=2:v=1:a=0`, output flagged
  `-an`), verified this works identically regardless of whether either input has audio, and
  documented the silent-output behavior clearly in the tool's own description/note rather than
  risking unpredictable failures for some input combinations.
- Also ran the *exact* command strings my tool's argument-building code would generate (extracted
  by running the actual JS logic, not retyped by hand) through real ffmpeg end-to-end for the
  rotate and watermark cases, confirming the generated commands work exactly as written before
  registering anything.
- 4 new tools, using the existing `processMediaFiles` ffmpeg.wasm wrapper (no new dependencies):
  - `video-rotate` — 90° clockwise, 90° counter-clockwise, or 180°.
  - `video-crop` — width/height/x/y rectangular crop.
  - `video-merge` — joins two clips in order; silent output by design (see edge case above).
  - `video-watermark` — overlays an image at a chosen corner or center.
- New file: `src/product/definitions/video-extra-tools.js`, registered in `tool-definitions.js`.
- Verified: `npm run validate` passes all 7 suites (493 tools total, 559 unique tool ids across
  76 definition files); confirmed all 4 new pages render with correct Arabic titles.

---
## 0.5.54 — Audio Wave 3 (Filters): equalizer, compressor, limiter, noise gate (August 2026)

- Continued the Audio Tools build order (Wave 3: Filters, previously "not started" in the
  roadmap). Checked `npm run list:tools` for equalizer/compressor/noise-gate/limiter/bass/treble/
  expander/"pass filter" first -- all genuinely missing (only unrelated false-positive matches
  like `csv-delimiter-converter` for "limiter").
- **Real Web Audio filter nodes (`BiquadFilterNode`, `DynamicsCompressorNode`) don't exist in
  Node** (confirmed directly: `typeof BiquadFilterNode` is `undefined` in the test environment),
  so all 4 tools are implemented as pure sample-math functions operating on raw `Float32Array`
  data, consistent with how the rest of `audio-processing.js` already works (no `AudioContext`
  dependency anywhere in that file).
- Extended `src/product/audio-processing.js` with:
  - `designShelfFilterCoefficients` / `applyBiquadFilter` — a manually implemented biquad filter
    using the standard RBJ Audio EQ Cookbook formulas (the same math the browser's native
    `BiquadFilterNode` uses internally), applied to low-shelf (bass) and high-shelf (treble)
    bands for `applyEqualizer`.
  - `applyDynamicsProcessing` — a downward compressor (reduces gain above a threshold by a
    ratio); a limiter is the same function called with a near-hard ratio (20:1).
  - `applyNoiseGate` — silences samples below a threshold.
- **Rigorously tested before writing any tool code**: generated real 100Hz and 8000Hz sine waves
  and confirmed a +12dB bass boost amplifies the 100Hz signal by \u2248 3.6x (\u2248 +11dB, matches
  the theoretical shelf-filter response) while leaving the 8000Hz signal's RMS completely
  unaffected (1.00x) -- proving the filter is genuinely frequency-selective, not just a blanket
  gain change. Compressor and noise gate were verified against hand-calculated expected output
  for specific sample values before integration. Re-ran every test against the actual exported
  module functions (not just the throwaway prototype) to confirm the real code matches.
- 4 new tools, zero new dependencies:
  - `audio-equalizer` — independent bass/treble gain in dB.
  - `audio-compressor-dynamics` — configurable threshold/ratio/makeup-gain compressor.
  - `audio-limiter` — a compressor preconfigured with a near-hard ratio, framed around a single
    "ceiling" control for the common peak-limiting use case.
  - `audio-noise-gate` — silences quiet background noise below a threshold.
- New file: `src/product/definitions/audio-filter-tools.js`, registered in `tool-definitions.js`.
- Verified: `npm run validate` passes all 7 suites (489 tools total, 555 unique tool ids across
  75 definition files); confirmed all 4 new pages render with correct Arabic titles.

---
## 0.5.53 — Developer Tools batch 6: JS formatter, GUID generator, XML compare, CSS validator (August 2026)

- First batch built using the new `npm run list:tools` as the mandatory first step (0.5.52).
  Checked "compare", "formatter", "beautif", "obfuscat", "guid", "diff", "javascript", "xpath",
  "xsd", "validator", and "css" against the real 547-tool list before picking anything -- caught
  that `sql-formatter` already exists (good to know for later), confirmed `text-diff-checker` is
  generic line-by-line text diff (not structure-aware, so a dedicated `xml-compare` is genuinely
  distinct, matching how `json-diff` already coexists with it), and confirmed
  `javascript-minifier` exists but no JS formatter/beautifier does.
- 4 new tools, zero new dependencies:
  - `javascript-formatter` — indentation-based JS formatter. Only breaks lines after `{`, `}`,
    and `;`, deliberately keeping parentheses inline; a first attempt that also broke on every
    `(` produced awkward output for function calls and parameter lists, caught and fixed during
    testing before the tool was written.
  - `guid-generator` — the classic braced, uppercase `{XXXXXXXX-XXXX-...}` GUID display format,
    explicitly distinguished in its own description from the existing `uuid-generator` (same
    underlying standard, different conventional display format) rather than being a silent
    duplicate of it.
  - `xml-compare` — structural comparison of two XML documents, reusing the same recursive-descent
    parser approach as `xml-to-json-converter` (0.5.51) plus the same diff algorithm as
    `json-diff`, so cosmetic whitespace differences don't get reported as content changes.
  - `css-validator` — basic CSS syntax check (balanced braces, every declaration has a colon).
- All 4 algorithms were unit-tested with real cases before being wired into tool definitions,
  and every tool's `calculate()` was pre-executed with its own real placeholder values (simulating
  the automated test harness) before touching `tool-definitions.js` at all.
- New file: `src/product/definitions/dev-tools-batch6.js`, registered in `tool-definitions.js`.
- Proactively recomputed and updated the tool-count assertions before running validate.
- Verified: `npm run validate` passes all 7 suites (485 tools total, 551 unique tool ids across
  74 definition files); confirmed all 4 new pages render with correct Arabic titles.

---
## 0.5.52 — New tool: `npm run list:tools`, a reliable pre-check to stop duplicate tools for good (August 2026)

Process infrastructure, no product-facing tool changes.

- **Root cause of the two duplicate incidents in 0.5.47/0.5.49/0.5.51**: pre-check searches were
  plain-text `grep` for the pattern `id: '...'`. Two definitions files
  (`web-transform-tools.js`, `web-content-tools.js`) build their tools through a `tool(id, icon,
  title, ...)` helper function that takes the id as a positional argument, not an `id: '...'`
  object key — so a text search for that pattern can never find a tool defined there, no matter
  how the search terms are chosen. This is exactly how `html-to-markdown-converter` slipped past
  a dedicated audit in 0.5.51 (caught only because the id-uniqueness *test* runs the real code,
  not a text search).
- **The fix**: added `scripts/list-tool-ids.mjs`, exposed as `npm run list:tools` (optionally
  `npm run list:tools -- <keyword>` to filter). It imports every definitions module exactly the
  way `tool-definitions.js` does and reads the real `id` + Arabic/English title + description off
  each tool object at runtime — immune to internal coding-style differences between files, since
  it reads the final constructed object, not the source text that built it.
- Verified it actually finds the tool the old grep missed: `npm run list:tools -- markdown` now
  correctly lists `html-to-markdown-converter` from `web-transform-tools.js` alongside the other
  4 markdown-related tools.
- Documented this as a **mandatory first step** before writing any new tool in
  `docs/ROADMAP.md`'s Developer Tools section, with the concrete failure mode spelled out so a
  future session (or a future me) doesn't quietly drift back to grep-only checking.
- Verified: `npm run validate` still passes all 7 suites (481 tools, unaffected — this adds a
  new script and an npm alias only, no product code changed).

---
## 0.5.51 — Developer Tools batch 5: XML↔JSON, XML validator, CSS prefixer (August 2026)

- Before writing any code, ran one comprehensive audit pass (not the previous piecemeal
  per-tool grepping) across every existing tool id in every family being touched this batch --
  XML, YAML, HTML, CSS, and JS -- checking ids *and* descriptions for functional overlap in a
  single pass, per the lesson from 0.5.49. Confirmed the YAML tool family is still completely
  empty (deferred separately, needs a real parser, more involved than a single batch).
- Also pre-executed each new tool's `calculate()` with its own real placeholder values (simulating
  what the automated test harness does) before registering anything in `tool-definitions.js`, to
  catch logic errors before regeneration rather than after.
- **The id-uniqueness guard (added in 0.5.47) caught a real collision before anything was
  pushed**: the initially-written `html-to-markdown-converter` turned out to already exist in
  `web-transform-tools.js` -- and that original version is more complete (also converts images,
  which mine didn't). `npm run validate` failed immediately with a clear message naming both
  files, exactly as the guard was designed to do. Removed my duplicate and its exclusive helper
  function, kept the original as the only live version. This is the guard working as intended,
  not a new mistake -- it prevented one.
- 3 new tools that survived the audit and the collision check, zero new dependencies:
  - `xml-to-json-converter` — a from-scratch recursive-descent XML parser (element structure and
    text content; attributes intentionally not modeled) converting to a JSON object, with repeated
    sibling tags automatically becoming arrays. Complements the existing `json-to-xml-converter`
    (the reverse direction).
  - `xml-validator` — checks XML well-formedness via a tag-matching stack (open/close pairing,
    single root element, no unclosed tags) using a Node-safe manual parser, not the browser-only
    `DOMParser`.
  - `css-prefixer` — adds vendor prefixes (`-webkit-`, `-moz-`, `-ms-`) for a known set of
    commonly-prefixed CSS properties.
- All three algorithms (XML→JSON structural conversion including repeated-tag-as-array behavior,
  the well-formedness checker across valid/mismatched/unclosed/empty cases, and vendor-prefix
  generation) were unit-tested with real data before being wired into tool definitions.
- New file: `src/product/definitions/dev-tools-batch5.js`, registered in `tool-definitions.js`.
- Proactively recomputed and updated the tool-count assertions before running validate.
- Verified: `npm run validate` passes all 7 suites (481 tools total, 547 unique tool ids across
  73 definition files); confirmed all 3 new pages render correctly and the original
  `html-to-markdown-converter` is unaffected.

---
## 0.5.50 — Developer Tools batch 4: dummy-data generators (August 2026)

- Continued Developer Tools (Part 9), applying the expanded lesson from 0.5.49: checked both
  exact tool ids and description text for functional overlap before starting. Also discovered
  `css-clip-path-generator` and `html-entity-encoder-decoder` (both previously logged as "still
  open" in the roadmap) already exist -- likely added by an earlier unrelated PR -- and corrected
  the roadmap's open-items list accordingly instead of risking a fourth duplicate.
- 3 new tools, zero new dependencies, sharing one realistic-looking fake-record generator:
  - `dummy-json-generator` — a JSON array of dummy records (name, email, age, active flag).
  - `dummy-csv-generator` — the same dummy records as a CSV table.
  - `dummy-sql-generator` — the same dummy records as ready `INSERT INTO` statements, with table
    name validated against SQL-identifier rules and a clear warning against running them on a real
    production database.
- New file: `src/product/definitions/dummy-data-tools.js`, registered in `tool-definitions.js`.
  Confirmed distinct from the existing `csv-to-sql-insert` (a converter of *existing* CSV data,
  not a from-scratch generator like this one).
- Unit-tested the shared record generator and both CSV/SQL formatters with real output before
  wiring them into tool definitions (unique ids, valid-looking emails, correct CSV/SQL escaping).
- Proactively recomputed and updated the tool-count assertions before running validate.
- Verified: `npm run validate` passes all 7 suites (478 tools total, 544 unique tool ids across
  72 definition files); confirmed all 3 new pages render with correct Arabic titles.

---
## 0.5.49 — Cleanup: removed 3 functionally-duplicate tools found while checking for the next batch (August 2026)

Found while auditing existing coverage before starting a new batch, not a regression from this
entry's own changes.

- **The problem**: the id-uniqueness guard added in 0.5.47 only catches exact `id` string
  collisions. It can't catch a *different* problem: two tools with different ids doing the exact
  same job. Three of mine turned out to duplicate existing tools this way:
  - `json-to-csv` (0.5.45) duplicated the already-existing `json-to-csv-converter`
    (`data-developer.js`) -- identical functionality, different slug.
  - `csv-to-json` (0.5.45) duplicated the already-existing `csv-to-json-converter`
    (`data-developer.js`) -- same.
  - `json-sort` (0.5.46) duplicated the already-existing `json-key-sorter` (`web-developer.js`) --
    same recursive alphabetical key-sort behavior, explicitly documented the same way in both.
  My exact-id grep check before each batch didn't catch these because the ids genuinely didn't
  match (`json-sort` vs `json-key-sorter`) -- only the underlying functionality did.
- **The fix**: removed all 3 duplicate tools and their now-unused exclusive helper functions from
  `src/product/definitions/json-tools-extra.js`, keeping the original, already-shipped versions as
  the only live ones. `json-diff`, `json-merge`, and `json-string-escaper` were checked again and
  confirmed to have no functional equivalent anywhere in the codebase -- they remain.
- **Net correction across the last 3 batches**: 10 genuinely new tools shipped, not 13 as
  previously logged (`json-diff`, `css-gradient-generator`, `json-merge`, `json-string-escaper`,
  `xml-minifier`, `nanoid-generator`, `jwt-encoder`, `jwt-inspector`, `regex-generator`,
  `api-key-generator`).
- **Lesson for future batches, added to the process**: an exact-id grep isn't enough on its own.
  Before building a tool, also skim for an existing tool with a *similar* purpose under a
  differently-styled slug (`-converter` / `-tool` suffixes, synonyms like `sort` vs `sorter`,
  `merge` vs `combiner`) -- check the tool's `description` text for the same core verb + noun
  pairing, not just the id string. Recorded in `docs/ROADMAP.md`.
- Proactively recomputed and updated the tool-count assertions in
  `tests/product/tool-user-journeys.integration.mjs` before running validate.
- Verified: `npm run validate` passes all 7 suites (475 tools total, down from 478; 541 unique
  tool ids across 71 definition files); confirmed the 3 restored original tools render correctly
  and my 3 genuinely-unique JSON tools are unaffected.

---
## 0.5.48 — Developer Tools batch 3: JWT encode/verify, regex presets, API key generator (August 2026)

- Continued Developer Tools (Part 9), applying the process fix from 0.5.47: grepped existing tool
  ids near a `category:` field before starting, confirming all 4 new ids were genuinely unused.
- 4 new tools, zero new dependencies (uses the browser's built-in Web Crypto API):
  - `jwt-encoder` — builds and signs an HS256 JWT from a JSON payload and a shared secret.
  - `jwt-inspector` — decodes a JWT's header and payload, optionally verifies its HS256 signature
    against a provided secret, and reports expiry status. Complements the existing `jwt-decoder`
    (which explicitly does not verify signatures) rather than duplicating it.
  - `regex-generator` — returns ready, tested regex patterns for common cases (email, URL,
    Egyptian phone number, IPv4, hex color, strong password) instead of writing one from scratch.
  - `api-key-generator` — generates a styled test API key (prefix + cryptographically random
    string via `crypto.getRandomValues`), explicitly labeled as test-only, not a real credential.
- Before writing any tool code, verified `crypto.subtle`'s HMAC-SHA256 sign/verify works
  identically in the Node test harness and the browser, then unit-tested a full JWT sign-and-verify
  round trip (including a wrong-secret rejection case) with real data before wiring it into tool
  definitions.
- New file: `src/product/definitions/dev-tools-batch3.js`, registered in `tool-definitions.js`.
- Caught and fixed one real issue before it became a repeat of a past mistake: the initial
  `jwt-inspector` placeholder used a literal `...` ellipsis instead of a real 3-part token,
  which failed the automated test harness's sample-value execution (the same class of problem
  `jwt-decoder` had already solved with a real 3-part placeholder token) — fixed by reusing that
  same working pattern instead of adding a separate test override.
- Proactively recomputed and updated the three hardcoded tool-count assertions in
  `tests/product/tool-user-journeys.integration.mjs` before running validate.
- Verified: `npm run validate` passes all 7 suites (478 tools total, 544 unique tool ids across 71
  definition files per the duplicate-id guard); confirmed all 4 new pages render with correct
  Arabic titles.

---
## 0.5.47 — Fix: 3 silently duplicated tool ids from the last two batches + a permanent guard (August 2026)

Bug found and fixed before continuing further work, not introduced by this entry's changes.

- **The bug**: `css-box-shadow-generator`, `css-border-radius-generator` (added in 0.5.45) and
  `random-string-generator` (added in 0.5.46) each duplicated a tool `id` that already existed --
  the first two in `color-css.js`, the third in `data-developer.js`. Because
  `tool-definitions.js` merges every definitions file into one object via plain object spread, a
  duplicate id doesn't error or warn anywhere -- it silently discards whichever definition was
  spread first. Since the new files were imported *after* the originals, my versions silently won,
  meaning the original (already-live, already-tested) tools were quietly replaced with different
  ones under the same URL. `npm run validate` never caught this because nothing checked for
  cross-file id collisions.
- **The fix**: removed the 3 duplicate definitions, keeping the original, already-shipped versions
  as the live ones. `css-gradient-generator` (batch 1) and `nanoid-generator` (batch 2) were
  genuinely new ids with no collision and are unaffected. Net result of the last two batches is
  therefore **9 new tools**, not 12: `json-diff`, `json-to-csv`, `csv-to-json`,
  `css-gradient-generator`, `json-merge`, `json-sort`, `json-string-escaper`, `xml-minifier`,
  `nanoid-generator`.
- **The permanent guard**: added `tests/product/tool-id-uniqueness.integration.mjs`, now part of
  `npm run validate`. It parses the real import list from `tool-definitions.js`, imports all 70
  definitions modules directly (bypassing the merge that hides collisions), and asserts no tool id
  is defined in more than one file. Verified it actually catches this exact bug class by
  deliberately reintroducing a duplicate id and confirming the test fails with a clear message
  naming both files, before restoring and confirming it passes clean.
- Cleaned up now-unused helper functions (`selectInput` in both affected files) left over after
  removing the duplicate tool definitions.
- Verified: `npm run validate` now passes **7** suites (up from 6), 474 tools total, confirmed the
  3 restored original tool pages render their correct original content.

---
## 0.5.46 — Developer Tools batch 2: JSON merge/sort/escape, XML minifier, ID generators (August 2026)

- Continued the Developer Tools category (Part 9). 6 more client-side tools, zero new
  dependencies:
  - `json-merge` — deep-merges two JSON objects (nested objects merge recursively, arrays
    concatenate, primitives take the second value).
  - `json-sort` — recursively sorts every object's keys alphabetically at every nesting level.
  - `json-string-escaper` — escapes plain text into a valid embeddable JSON string value, or
    unescapes one back to plain text.
  - `xml-minifier` — strips whitespace between tags without touching actual text content.
  - `nanoid-generator` / `random-string-generator` — cryptographically random ID/string
    generators (`crypto.getRandomValues`), with a configurable length and, for the string
    generator, a choice of character set.
- Added `src/product/definitions/xml-and-id-tools.js`, registered in `tool-definitions.js`;
  extended the existing `json-tools-extra.js` with the three new JSON operations and a shared
  `selectInput` helper.
- All core algorithms (deep merge, recursive key sort, escape/unescape round-trip, XML whitespace
  stripping, random-ID uniqueness and alphabet-membership) were unit-tested directly with real
  cases before being wired into tool definitions.
- Learned from last batch's DOM-trick bug: deliberately avoided any DOM-only API in this batch
  (confirmed `crypto.getRandomValues` works identically in the Node test harness and the browser
  before using it) — `npm run validate` passed cleanly on the first run this time, no fix-forward
  needed.
- Proactively recomputed and updated the three hardcoded tool-count assertions in
  `tests/product/tool-user-journeys.integration.mjs` *before* running validate, instead of
  reacting to a failure.
- Verified: `npm run validate` passes all 6 suites (474 tools total); confirmed all 6 new pages
  render with correct Arabic titles.

---
## 0.5.45 — Developer Tools: JSON diff/CSV conversion, CSS generators (August 2026)

- Started filling the Developer Tools category (Part 9 of the master catalogue, ~100 tools,
  previously untouched). Checked existing coverage first (13 of the 100 catalogue slugs already
  existed, several more under equivalent alternate names like `base64-encoder-decoder` and
  `url-encoder-decoder`) before picking genuine gaps to fill.
- Added 6 new client-side developer tools, all pure JS with zero new dependencies:
  - `json-diff` — recursively compares two JSON texts and lists every value added, removed, or
    changed, including nested fields and array indices.
  - `json-to-csv` / `csv-to-json` — convert between a JSON array of objects and a CSV table, with
    correct handling of quoted values containing commas or embedded quotes.
  - `css-gradient-generator`, `css-box-shadow-generator`, `css-border-radius-generator` — form-
    based CSS snippet generators (angle/colors, offset/blur/spread/color/inset, per-corner radii
    with automatic shorthand collapse when all corners match).
- New files: `src/product/definitions/json-tools-extra.js`,
  `src/product/definitions/css-generator-tools.js`, both registered in `tool-definitions.js`.
- The JSON diff and CSV parsing algorithms, plus the CSS output builders, were unit-tested
  directly with real cases (nested/array diffs, quoted-comma CSV round-trips, corner-radius
  shorthand collapse) before being wired into tool definitions.
- **Caught and fixed a real bug before it shipped**: the first color-validation implementation
  used a DOM-only trick (`new Option().style.color`), which crashed the automated test suite with
  `Option is not defined` since that suite runs each tool's logic in Node, not a browser. Replaced
  it with a dependency-free regex-based validator (hex/rgb/hsl in both comma and modern
  space-separated syntax, plus named-color keywords), tested against 16 real valid/invalid cases
  before re-running the suite.
- Updated three hardcoded tool-count assertions in
  `tests/product/tool-user-journeys.integration.mjs` to match the new totals. Note: the pre-existing
  numbers had already drifted slightly from an earlier unrelated change (PR #90) before this batch
  even started -- not something introduced here, just caught and corrected while touching this file.
- Verified: `npm run validate` passes all 6 suites (469 tools total); confirmed all 6 new pages
  render with correct Arabic titles.

---
## 0.5.44 — Monetization & cost strategy: "Totally Free," ad-funded (August 2026)

Planning/documentation update, no code changes. Recorded a deliberate product decision in
`docs/ROADMAP.md` following a detailed cost/revenue analysis of the full ~2,300+ tool catalogue:

- **Adawaty stays completely free for every user on every tool** — no Pro tier, no paid credits.
  Funded by ads instead of subscriptions, as a competitive differentiator against paywalled
  competitor tool sites.
- Introduced a **six-tier cost classification** (🟢 A Browser-only ≈$0/unlimited, 🔵 B simple
  backend, 🟣 C cheap AI text, 🟡 D medium AI/OCR/STT, 🟠 E heavy AI image/audio, 🔴 F AI video/GPU)
  as a second lens alongside the existing Phase 1–5 build-order scope, specifically to plan for
  the tools that won't be free to run once built.
- Documented the economic target once tiers B–F exist (blended AI+backend cost per 1,000
  pageviews needs to stay well under ad RPM, not eat it) and the concrete levers to hit it:
  cheapest-provider routing, preferring in-browser WASM/WebGPU execution over server calls where
  possible, hard per-tier daily quotas invisible to normal usage, SEO-structured tool pages to
  lift pageviews-per-visitor, and fast temp-file deletion to keep storage cost negligible.
- **No change to current priorities**: everything shipped so far is Tier A (browser-only, ≈$0,
  unlimited) by construction, which is exactly why the client-side-first build-out continues
  unchanged. Tiers B–F are recorded as a real, planned part of the roadmap that needs a dedicated
  infrastructure/budget conversation before the first one is built — not something to slip in
  incrementally once an AI tool "seems easy to just add."
- Confirmed `docs/tools-master-database.txt` (the ~2,300+ tool source catalogue) is already
  up to date with no changes needed.

---
## 0.5.43 — Audio Wave 2 (file-based half): waveform viewer, silence detector (August 2026)

- Added 2 new client-side audio analysis tools, both fitting the existing "upload → process →
  download/report" tool pattern with no new dependencies or infrastructure:
  - `audio-waveform-viewer` — renders a file's full waveform as a downloadable PNG image (min/max
    amplitude per pixel column, drawn to canvas, exported via the existing `canvasToBlob` helper).
  - `audio-silence-detector` — reports silent or near-silent stretches as timestamped text
    (adjustable sensitivity threshold and minimum gap duration); detection-only, never modifies
    the file, no download.
- Both core algorithms (waveform peak extraction, silence-gap detection with a too-short-gap
  filter) were unit-tested directly with real synthetic sample data before being wired into tool
  definitions.
- New file: `src/product/definitions/audio-analysis-tools.js`, registered into
  `src/product/tool-definitions.js`.
- **Scope note for the rest of Wave 2** (Voice Recorder, Mic Test, Level Meter): these need a live
  microphone UI (`getUserMedia` + `MediaRecorder`/`AnalyserNode` driving a real-time start/stop/
  meter interface) that the current tool-page renderer does not support at all — it only renders
  static forms submitted once. Building these needs that interactive-tool infrastructure decided
  and built first; recorded as an open architecture question in `docs/ROADMAP.md` rather than
  rushed. Spectrum/Frequency Analyzer deferred separately pending a correctly-implemented offline
  FFT/spectrogram approach.
- Audio Tools category now covers **13 tools** total (up from 11).
- Verified: `npm run validate` passes all 6 suites (465 tools total after regenerating every
  page); confirmed both new pages render with correct Arabic titles.

---
## 0.5.42 — Audio Editing wave 1: reverse, cut, split, merge, loop, speed (August 2026)

- Adopted a **~2,300+ tool master catalogue** (`docs/tools-master-database.txt`, 22 categories) as
  the long-term product backlog, and recorded a scope decision in `docs/ROADMAP.md`: work proceeds
  in phases (client-side now / needs review / deferred-backend / deferred-AI / future business
  suite) to stay aligned with the existing no-backend, no-AI, fully-in-browser positioning.
- Added 6 new client-side audio tools, all pure Web Audio API (`decodeAudioData` + `AudioBuffer`
  math, WAV export, zero new dependencies):
  - `audio-reverser` — plays a recording backwards.
  - `audio-cutter` — removes a selected segment and joins what remains (the inverse of trimming).
  - `audio-splitter` — splits a recording into two parts at a chosen point, downloaded as one ZIP.
  - `audio-merger` — joins two or more files (multi-file input) into one continuous recording, in
    the order selected.
  - `audio-looper` — repeats a recording a chosen number of times.
  - `audio-speed-changer` — speeds up or slows down playback (pitch shifts along with speed, since
    this uses simple resampling rather than a pitch-preserving time-stretch).
- Extended `src/product/audio-processing.js` with the underlying sample-level helpers
  (`reverseAudioBuffer`, `concatAudioBuffers`, `changeAudioSpeed`, `loopAudioBuffer`,
  `cutAudioBuffer`), unit-tested directly with real numeric cases (reverse order, multi-file
  concat including mixed mono/stereo channel counts, 2x-speed length halving, 3x loop repetition)
  before wiring them into tool definitions.
- Audio Tools category now covers **11 tools** total (up from 5): the 6 above plus the
  previously-shipped Trim, Volume Adjust, Fade In/Out, Stereo→Mono, and the full Format Converter.
- This completes Wave 1 (Editing + Volume) of the Audio build order in `docs/ROADMAP.md`; Wave 2
  (Recording, via `MediaRecorder` + `AnalyserNode`) is next.
- Verified: `npm run validate` passes all 6 suites (463 tools total after regenerating every
  page); confirmed each new tool's page renders with the correct Arabic title and correct
  category/subcategory placement.

---
## 0.5.41 — Localized navigation and site identity (August 2026)

- Fixed the shared navigation so its labels immediately follow the selected Arabic or English language on every catalogue and tool page.
- Added a parser-blocking language bootstrap before styles to prevent Arabic content flashing during English navigation.
- Localized the visible brand and accessible home label.
- Added a dedicated lightweight Adawaty SVG favicon across the home, catalogue, categories, tools and 404 page.
- Added regression coverage for language bootstrapping, navigation state and favicon paths.

---
## 0.5.40 — Image average & dominant color picker (July 2026)

- Added browser-local `image-average-color-picker`:
  - Average HEX + RGB from the full image (opaque pixels only).
  - Dominant palette (1–12 colors) via fast quantized sampling on a downscaled canvas.
  - Fully private: no upload, no new dependencies.
- Published tool page under `/tools/image-average-color-picker/`.
- Marked the ROADMAP item complete; next image gaps remain extractor/eyedropper/censor/SVG generators.
- Bumped package version to `0.5.40`.

---

## 0.5.39 — Pure client-side policy; retire server tools (July 2026)

### Policy
- Product catalogue is **browser-only** until a stable, disclosed server stack exists.
- Server-side PDF→Word Pro (`pdf2docx` / Vercel API path) is **retired from the public product** (page was already 404; residual bytecode cache removed).
- ROADMAP stage-3 (server/AI) tools stay deferred and must not ship in the main catalogue without explicit disclosure.

### Documentation
- Expanded `docs/ROADMAP.md` with competitive parity targets inspired by all-in-one toolboxes (10015.io, iLovePDF-style gaps) that remain feasible fully in-browser.
- Cleared outdated «Pro server ✅» matrix rows; marked Pro path as removed.
- Bumped package version to `0.5.39`.

### Cleanup
- Removed leftover `api/__pycache__/pdf-to-word.cpython-312.pyc`.

### Next recommended work (from ROADMAP)
- UX: richer `/all-tools/` search/filters; unified progress UI for heavy tools.
- Tools: `pdf-page-crop`, `pdf-blank-page-remover`, `image-average-color-picker`, `cron-expression-parser`, CSS generators gap-fill.

---

## 0.5.38 — Documentation, license & contribution foundation (July 2026)

### Done in this release
- Added **MIT License** (`LICENSE`).
- Added **CONTRIBUTING.md** with local setup, generate/validate workflow, and contribution principles.
- Updated **README.md**: correct live site URL (Vercel), contribution pointer, license section, and clearer overview.
- Cleaned encoding artifacts in historical CHANGELOG headings.
- Bumped package version to `0.5.38` and set `"license": "MIT"` in `package.json`.
- Updated `docs/ROADMAP.md` with UX/infrastructure priorities and last-update note so future contributors can continue without re-analysis.

### Analysis summary (for future work)
- Live site: https://adawaty-five.vercel.app/
- Curated catalogue: ~437 high-value tools across 19 categories (after retiring low-value calculators).
- Strengths: true client-side privacy for most tools, bilingual AR/EN, automated page generation, solid validation pipeline, conversion matrix coverage (audio / video / image / PDF / CSV↔Excel).

### Recommended next improvements (priority order)

#### High priority (UX & core)
- [ ] Enrich `/all-tools/` with real-time search, category filters, and tags (processing vs calculator).
- [ ] Unified progress / loading UI for FFmpeg, OCR, and large PDF/image jobs.
- [ ] Better bilingual error messages and empty states.
- [ ] Implement `pdf-page-crop` and `pdf-blank-page-remover`.

#### Medium priority
- [ ] Simple Service Worker / PWA support for offline use of popular tools.
- [ ] `cron-expression-parser`, `json-schema-validator`, `image-average-color-picker`.
- [ ] Improve homepage search with instant suggestions.

#### Lower priority / future
- [ ] Word → PDF (client-side quality limits noted in ROADMAP).
- [ ] AVIF support when browser coverage improves.
- [ ] PDF password protect/remove (blocked by current pdf-lib limitations).
- [ ] Optional server tools (background remover, AI upscaler) remain isolated with clear disclosure.

### Notes for contributors
- After any definition change: always run `npm run generate:product` then `npm run validate` before commit.
- ROADMAP remains the single source of truth for next tools.

---

## 0.5.37 — Arabic catalogue encoding fix

- Replaced corrupted dynamic Arabic catalogue copy with encoding-safe Unicode strings.
- Bumped catalogue asset URLs to invalidate cached scripts after deployment.

## 0.5.36 — Navigation and catalogue quality

- Added persistent category navigation to every catalogue and tool page, including a mobile-friendly horizontal navigation row.
- Retired 86 low-value arithmetic, direct-formula, and media-metadata calculators while preserving scientific, health, finance, conversion, and processing tools.
- Reduced the bright homepage call-to-action contrast with a calmer dark gradient and accessible brand action.
- Regenerated the public catalogue, category pages, tool pages, and sitemap from the curated 437-tool registry.

## Sprint 7 and earlier

See git history for Sprint 7 batches and earlier release notes.
