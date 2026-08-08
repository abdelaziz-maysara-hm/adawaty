# Changelog

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
