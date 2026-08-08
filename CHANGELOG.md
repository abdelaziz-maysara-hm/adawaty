# Changelog

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
