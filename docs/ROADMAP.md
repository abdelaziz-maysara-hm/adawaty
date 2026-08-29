# Adawaty Roadmap

**This is the single source of truth for this project.** It reflects the actual current state of
the codebase, not a plan from months ago. If something here disagrees with the live code, the
live code is right and this file is stale -- fix this file, not the other way around.

Last rebuilt from scratch (replacing an outdated version last touched at `0.5.40`, itself over 100
releases behind the actual codebase): version **0.5.147**.

---

## What this project is

Adawaty (`adawaty.tools`) is a free, bilingual (Arabic/English) online-tools platform -- the same
category as iLovePDF, TinyWow, or 10015.io -- built around one non-negotiable principle:

> **Client-side first.** A tool runs entirely in the visitor's browser unless there is a genuine,
> unavoidable technical reason it cannot (a data source that must be fetched live, like currency
> rates; or a model too large to ever download reasonably in a browser). Anything that does need a
> server must be an explicit, disclosed, opt-in choice the visitor makes themselves -- never a
> silent default.

This principle has been tested against real alternatives repeatedly throughout this project's
history (Cloudflare-suggested server-side AI, third-party backend proposals) and has held up: video
processing (ffmpeg.wasm), AI background removal (ONNX models), and even AI text summarization/
grammar correction (WebLLM) all turned out to be genuinely possible entirely client-side, with no
server and no per-use cost.

## Current state, by the numbers

- **628 tools**, generated as static pages, spanning 19 categories:

  | Category | Count | Category | Count |
  |---|---|---|---|
  | developer | 135 | date-time | 17 |
  | image | 76 | color-css | 16 |
  | math | 65 | student | 14 |
  | text | 45 | home-lifestyle | 10 |
  | pdf | 42 | islamic | 10 |
  | converter | 32 | engineering | 6 |
  | finance | 31 | student-study | 4 |
  | audio | 30 | | |
  | video | 29 | | |
  | security-network | 24 | | |
  | seo | 22 | | |
  | health | 20 | | |

- **7 interactive (AI/workspace) tools**, each its own hand-authored page outside the generator:
  `background-remover`, `replace-background`, `text-summarizer`, `grammar-checker`,
  `photo-editor`, `website-builder`, `mic-test`.
- **28 automated test suites** (`npm run validate`), covering product registration, real
  cryptographic/mathematical correctness (not just "doesn't throw"), SEO fundamentals, and the
  deployment-critical safety design of the merged Worker.

## Infrastructure (as of 0.5.147)

- **Hosting**: a single Cloudflare project (`adawaty`), deployed automatically from every push to
  `main` on GitHub (Cloudflare's own Git integration, not a manual step).
- **`wrangler.jsonc`** (repo root) configures both static-asset serving (`assets.directory: "."`)
  and a custom Worker script (`worker-entry.js`) for `/api/*` routes only
  (`assets.run_worker_first: ["/api/*"]`). This scoping is the whole safety guarantee: a bug in
  `/api/*` logic cannot affect normal page serving, by construction, not just by care --
  see `worker-entry.js`'s own comments and `tests/product/worker-entry.integration.mjs`.
- **`/api/currency-rates`**: proxies a free public exchange-rate API server-to-server (sidesteps an
  unresolved CORS question with the upstream), cached at Cloudflare's edge for 1 hour.
- **`/api/summarize`**: the *opt-in only* cloud summarization path for `text-summarizer`, backed by
  Cloudflare Workers AI. The client-side WebLLM path is always the default; this is never called
  without an explicit visitor action and confirmation.
- **A parallel, intentionally-kept GitHub Pages deployment** (via `.github/workflows/deploy.yml`)
  runs on every push too, as a free, zero-effort fallback -- not currently pointed to by DNS, but
  ready if Cloudflare ever needs to be bypassed in an emergency.
- **Cache-busting**: every JS/CSS asset referenced from a generated or hand-authored page carries a
  `?v=...` query string. Tool/category/roundup pages and `main.css`/`product.css` use a real
  SHA-256 content hash computed at build time (`scripts/generate-product-pages.mjs`); the 7
  interactive tool pages use hand-maintained short version tags (e.g. `?v=br4`) that **must be
  bumped by hand** whenever their own JS/CSS changes -- see the "Rules" section below for why this
  keeps mattering.

## Principles (binding, not suggestions)

These aren't aspirational -- they were each earned by a real bug or a real decision documented in
`CHANGELOG.md`, and violating them has caused live, user-reported breakage before.

1. **Client-side first, always attempt it before assuming a server is needed.** Search for prior
   art before concluding something "needs a backend" -- background removal and text-generation AI
   both turned out to be wrong assumptions the first time they came up.
2. **No silent server calls, ever.** Any tool or mode that sends user data off-device must be an
   explicit opt-in with visible disclosure of what's sent and where, confirmed once per visit
   before first use -- see `text-summarizer`'s cloud mode for the reference implementation.
3. **Verify claims with real tests, not review.** A model's SHA256 hash, a crypto primitive's
   output, an ONNX model's structural validity, a rate-limit's exact number -- these get checked
   against an independent source (official test vectors, a second language's standard library,
   actual inference on real data), not assumed correct because the code "looks right." Several
   real bugs in this project were caught exactly this way; several others slipped through *because*
   this step was skipped or done with the wrong tool (e.g. verifying a browser-only CORS
   requirement using curl, which doesn't enforce CORS at all -- see 0.5.147).
4. **Every new tool needs a permanent regression test that would have caught its own bugs.**
   Writing the test and then deliberately breaking the code to confirm the test fails, then
   restoring it, is the standard here -- not optional polish.
5. **Cache-busting version strings must change whenever the file's real content changes.** This has
   broken live features multiple times when forgotten (0.5.133, 0.5.141, 0.5.146) -- always
   regenerate and spot-check the actual version string in the generated HTML before considering a
   JS/CSS change done, and if the file is one of the 7 hand-authored interactive pages, bump its
   `?v=` tag by hand.
6. **Never assume a tool or feature is missing without checking the actual registered tool list
   first.** This project has, more than once, nearly duplicated work that already existed under a
   different ID than expected (`aes-encryption-tool` vs. a newly-built `aes-encryption`;
   `hash-generator` already existing when a rebuild was about to start). Check
   `getToolDefinition()`/`listToolDefinitions()` against the actual codebase, not just a plan
   document, before starting new work.
7. **Verified in a sandbox is not verified in a browser.** Node, curl, and Python don't enforce
   CORS, don't have `WebGPU`, and don't have `caches.default` -- several real bugs shipped past
   thorough non-browser verification specifically because of this gap (0.5.132's `wasmPaths`
   saga, 0.5.147's CORS bug). Disclose this limitation explicitly whenever a fix can't be
   confirmed with a real browser, and treat "needs a live smoke test" as a real, tracked next step,
   not a formality.
8. **This is a solo project by design.** No contribution workflow, no plugin/capability runtime,
   no speculative extensibility layer -- the previous `docs/adr/` folder describing exactly that
   kind of architecture was archived (`docs/archive/adr/`) because none of it was ever actually
   built or needed. If a future session is tempted to build "infrastructure for other
   contributors," that's a signal to stop and confirm it's actually wanted first.

## What's genuinely open right now

Ordered by how directly each is tied to something already in motion, not by arbitrary priority.

### SEO / indexing (actively being worked on)
- Google Search Console showed 342 pages "Discovered - currently not indexed" (0.5.146's fix
  target). The root cause found -- zero static internal links to any tool page, all
  category/all-tools browsing was JS-rendered only -- is fixed. **Not yet confirmed**: whether
  Search Console's indexed-page count actually improves over the following weeks; this needs
  periodic re-checking, not a one-time fix-and-forget.
- Site traffic is currently very low (roughly a dozen to a few dozen active users/week per GA4,
  and declining week-over-week as of the last check) -- worth a dedicated investigation into
  *why*, separate from the indexing fix, once there's been enough time post-fix to distinguish a
  real trend from small-sample noise.

### Monetization (deliberately paused)
- Currently AdSense only. Alternative/additional ad networks (Media.net, Ezoic) were researched
  and are viable options **once traffic grows meaningfully** -- at current traffic levels, no ad
  network (including AdSense) will produce meaningful revenue, and pursuing alternatives now would
  be effort spent on the wrong bottleneck. Revisit only after traffic is meaningfully higher.

### Security & Encoding tools (partially explored)
- A gap analysis against `docs/tools-master-database.txt` found ~92 planned-but-unbuilt tool IDs in
  this category. Investigation found real, existing coverage under *different* IDs than the plan
  assumed (`hash-generator` covers the MD5/SHA1/SHA256/SHA384/SHA512 group already;
  `security-encoding-extra-tools.js` already covers `hmac-generator`, `base32-encoder-decoder`,
  `crc32-calculator`, `otp-generator`, `pin-generator`, `aes-encryption-tool`, `bcrypt-generator`,
  `pbkdf2-generator`, `rsa-key-generator`, `aes-key-generator`) -- meaning the real remaining gap is
  smaller than the raw ~92 number suggests, but hasn't been re-audited against the actual current
  registry since this was discovered. **Next step, if resumed**: re-run the gap analysis against
  `listToolDefinitions()` directly (not the old master-database file, which uses IDs that don't
  match what actually got built), and only then decide what's genuinely still missing.
- Remaining categories from the original plan not yet investigated for real search demand:
  certificate/PEM tooling, JWT sub-tools beyond `jwt-inspector`, OAuth/PKCE tooling, SSH key
  tooling. Do the same "research real competitor demand first" step already applied to
  `hash-generator`/`aes-encryption-tool`/`currency-converter`/`grammar-checker` before building
  any of these -- several early guesses in this category turned out to already exist or not be
  worth building as separate tools.

### Performance (mobile Core Web Vitals -- fixed, 0.5.149)
- A live PageSpeed Insights report found a 42/100 mobile performance score (98/100 desktop) with
  the root cause being ~1.7 MB of combined JS loaded per tool page (all 628 tools' code) to render
  one tool. Fixed via a build-time per-tool manifest + scoped dynamic `import()` in
  `tool-page.js` -- a typical page now loads its own tool's definitions file only (e.g. `pdf-merge`
  went from ~1.7 MB to 12 KB). See `tests/product/dynamic-tool-definition-loading.integration.mjs`.
- **Not yet re-measured**: re-run PageSpeed Insights on the same URL post-deploy to confirm the
  mobile score actually improved as expected, and check whether `main.css`/`product.css`'s
  render-blocking-request and unused-CSS findings (smaller, secondary findings from the same
  report) are worth a follow-up pass.
- While fixing this, 4 previously-hidden duplicate tool ids were found and resolved
  (`percentage-calculator`, `discount-calculator`, `age-calculator`, `bmi-calculator`) -- worth
  keeping in mind that `tool-definitions.js` may still be worth a periodic audit for other
  inline-vs-file duplication, though the known inline-definition escape hatch that caused this is
  now closed (all tools live in real files under `definitions/`).

### Interactive-tool quality
- `replace-background`/`background-remover`'s "People" mode was just fixed for a real CORS bug
  (0.5.147) but has **not yet been confirmed working in a real browser** -- needs a live smoke
  test before being considered fully resolved.
- `photo-editor` and `website-builder` have not been reviewed or extended in a long time relative
  to the rest of this project's pace; no known open bugs, but also no recent deliberate check-in.

### Cleanup still pending
- `cloudflare-worker/` (the old, now-unused standalone Worker project) was deleted from the repo in
  0.5.140; the actual Cloudflare project of the same name/purpose (`adawaty-workers`) was separately
  deleted by the project owner directly in the Cloudflare dashboard. Confirm no other stray
  Cloudflare projects/resources remain from earlier experimentation (a `temp-github-fetcher` Worker
  and `temp-github-cache` KV namespace were flagged as leftover from an earlier session and may
  still need manual deletion in the dashboard).

---

## How to use this file

- **Before starting new work**: read the "Principles" section above, then check this file's "What's
  genuinely open" section for context on why something is or isn't already done.
- **When finishing a unit of work**: update this file's relevant section in the same commit/session
  as the change, the same way `CHANGELOG.md` gets a new entry -- don't let this file drift out of
  date the way the previous version did for 107 releases.
- **When genuinely unsure whether something already exists**: check the actual code
  (`getToolDefinition()`, `grep` the definitions directory, look at `tools/` on disk) before
  assuming this file's "open" list is complete or before starting to build something that might
  already exist under a different name.

// END OF FILE
