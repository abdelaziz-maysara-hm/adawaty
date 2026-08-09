# Adawaty AI Development Standard

## Purpose

This document is the authoritative working standard for AI assistants and automated coding agents contributing to Adawaty. It supplements `README.md`, `docs/ROADMAP.md`, and the accepted decisions in `docs/adr/`. When guidance conflicts, preserve the existing implementation and accepted ADRs, then ask for an explicit product decision before changing architecture.

Adawaty is a bilingual, browser-first tools platform. Privacy is a product feature: public catalogue tools process user data locally unless the product owner explicitly approves a clearly disclosed server-backed feature.

## Required Reading and Change Discipline

Before changing product code, read the following in full:

1. `README.md`
2. `docs/ROADMAP.md`
3. every applicable file in `docs/adr/`
4. the relevant modules in `src/product/`
5. the relevant definition file in `src/product/definitions/`
6. the applicable scripts in `scripts/`
7. the tests covering the affected area

Before implementation, state which source files will change and why. Keep the diff limited to the requested feature. Do not rewrite unrelated code, modify user-owned uncommitted files, or perform repository-wide refactoring without explicit approval.

## Architecture Rules

- Preserve the existing folder structure and module boundaries.
- Do not rename or move directories.
- Do not create a parallel tool registry, catalogue, localization system, renderer, generator, search index, or runtime.
- Extend the current implementation through `src/product/tool-definitions.js`, the existing definition modules, shared processing helpers, and the current generator.
- Treat `src/tools/core/index.js` as the stable public runtime entry point described by ADR-004. Do not expose internal helpers through it casually.
- Preserve lazy loading, lifecycle ownership, isolation, diagnostics, and other accepted runtime contracts described by the ADRs.
- Never edit generated catalogue or tool pages manually. Generated output includes `tools/<tool-id>/index.html`, `categories/<category>/index.html`, `all-tools/index.html`, `src/data/tool-index.json`, and `sitemap.xml`.
- Change source definitions or `scripts/generate-product-pages.mjs`, then regenerate output.
- Do not introduce a UI framework. Use native JavaScript, existing components, helpers, CSS variables, and localization behavior.
- Do not add a backend path to the public catalogue unless the product owner explicitly requests it and approves upload disclosure, limits, privacy behavior, and operational requirements.

## Current Tool Schema

The canonical public product definitions are collected by `src/product/tool-definitions.js`. A normal tool definition follows the established shape:

```js
const exampleTool = Object.freeze({
    id: 'example-tool',
    category: 'developer',
    icon: 'ABC',
    title: Object.freeze({ ar: '...', en: '...' }),
    description: Object.freeze({ ar: '...', en: '...' }),
    note: Object.freeze({ ar: '...', en: '...' }),
    inputs: Object.freeze([]),
    action: Object.freeze({ ar: '...', en: '...' }),
    calculate(values, language) {},
    // or: async process(values, language) {}
});
```

Required in the current schema:

- `id`: globally unique, lowercase kebab-case, stable after publication.
- `category`: one existing key from `src/product/category-labels.js`.
- `icon`: short and safe for the existing card and page UI.
- `title.ar` and `title.en`.
- `description.ar` and `description.en`.
- `note.ar` and `note.en`.
- `inputs`: the existing input descriptor format, even when empty.
- one executable path: `calculate`, `process`, or an approved `interactive` implementation.

Processing tools normally include localized `action` copy. Calculator definitions without an explicit action currently use the shared fallback supplied by `tool-page.js`; follow the neighboring definitions in the same module.

The route slug is currently derived directly from `id`; there is no separate `slug` property. Do not add a second slug field to an individual tool.

The current product-definition schema does not expose a canonical `tags` property, and the public catalogue search currently indexes titles and descriptions. Do not add unused per-tool tags ad hoc. A future tags feature must be introduced centrally across validation, `tool-definitions.js`, catalogue search/filtering, generated metadata, search index output, tests, and migration rules in one coordinated change.

## Input and Output Rules

- Reuse the input descriptor fields already rendered by `src/product/tool-page.js`: `id`, `type`, localized `label`, localized `unit`, and supported attributes such as `min`, `max`, `step`, `placeholder`, `accept`, `multiple`, `required`, `value`, `rows`, and select `options`.
- Input IDs must be unique inside the tool and use lower camelCase, matching the values consumed by the handler.
- Validate invalid, missing, unsupported, and unsafe inputs before expensive processing.
- Return the established result shape: `value`, `label`, optional `details`, optional `download`, and optional `preview`.
- Download results must provide a real `Blob` and a safe, descriptive filename with the correct extension and MIME type.
- File-processing tools must keep files on the device and state this accurately. Never claim local processing if a file is uploaded.
- Heavy processing must use the shared progress and cancellation mechanisms when available.

## Category Rules

The canonical categories are the keys in `src/product/category-labels.js`:

`health`, `finance`, `student`, `student-study`, `math`, `date-time`, `converter`, `developer`, `text`, `engineering`, `security-network`, `seo`, `color-css`, `home-lifestyle`, `islamic`, `image`, `video`, `audio`, and `pdf`.

- Reuse an existing category whenever it accurately describes the tool.
- Do not create aliases, spelling variants, or duplicate categories.
- Do not rename categories or move existing tools unless explicitly requested.
- A new category requires a product-level decision and coordinated updates to labels, generator metadata, navigation, search, tests, and generated output.
- Regeneration must leave category counts and category pages consistent with active definitions and `retired-tool-ids.js`.

## Naming Rules

- Tool IDs and routes: lowercase kebab-case, for example `video-format-converter`.
- JavaScript variables and functions: lower camelCase.
- Definition collections: follow the existing `<domain>Definitions` or `<domain>ToolDefinitions` convention in the owning module.
- Files: lowercase kebab-case and grouped by the established domain, not one new file per trivial tool.
- Do not reuse retired IDs without an explicit migration decision.
- Prefer specific, user-searchable names. Avoid claims such as “best”, “perfect”, or “AI” unless the implementation supports them.

## Translation Rules

- Every user-visible product string must have accurate Arabic and English copy.
- Preserve the current `{ ar, en }` object format and the shared language selection behavior.
- Do not transliterate when a natural translation exists.
- Keep units, punctuation, numeric meaning, warnings, errors, action labels, filenames, and accessibility labels understandable in both languages.
- Store files as UTF-8 and verify Arabic in a browser; do not “repair” correct UTF-8 based only on mojibake displayed by a terminal.
- Never concatenate unsafe user content into HTML. Prefer DOM text APIs and the existing escaping helpers.

## Generation Rules

- Source definitions are the source of truth; generated HTML is not.
- Register a new definition collection through the existing imports and composition in `src/product/tool-definitions.js`.
- Run `npm run generate:product` after changes to definitions or the generator.
- The generator must continue to create tool pages, category pages, the all-tools page, `src/data/tool-index.json`, and `sitemap.xml` using the existing route structure.
- Generated pages must retain localization bootstrap, canonical metadata, structured data, navigation, accessibility hooks, analytics/advertising policy, and shared assets already emitted by the generator.
- Review generated diffs for unexpected deletions, duplicate routes, stale retired tools, and unrelated churn.

## Validation Rules

Before a change is considered complete:

1. run `npm run generate:product` when generation inputs changed;
2. run `npm run validate`;
3. run `git diff --check`;
4. confirm IDs are unique and every category exists;
5. confirm the tool appears in the catalogue, its category, `src/data/tool-index.json`, and `sitemap.xml`;
6. confirm navigation and language switching still work;
7. inspect the diff and exclude unrelated user files.

Do not weaken or delete a failing test merely to make validation green. Fix the source defect or document a genuine environment limitation.

## Performance Rules

- Prefer browser APIs and native JavaScript.
- Reuse existing processing modules and utilities instead of duplicating algorithms.
- Avoid new dependencies unless the browser cannot provide a reliable implementation and the value clearly exceeds the cost.
- Lazy-load heavy libraries only when the user invokes the relevant tool.
- Pin external library versions and reuse approved CDN origins and same-origin vendoring patterns.
- Avoid loading the complete definition bundle on pages that only need lightweight metadata; preserve the generated `src/data/tool-index.json` pattern.
- Bound memory use, revoke object URLs, close browser resources, delete FFmpeg virtual files, and provide cancellation for long jobs where the existing runtime supports it.
- Test representative mobile-sized files and communicate realistic client-side limits.

## SEO Rules

- Preserve one stable, crawlable route per generated tool: `/tools/<id>/`.
- Titles and descriptions must be useful, truthful, distinct, and localized.
- Preserve canonical links, `SoftwareApplication` structured data, breadcrumbs, Open Graph, Twitter metadata, language metadata, and sitemap generation.
- Do not create thin duplicate pages for synonyms or language variants without an approved routing strategy.
- Do not add fabricated popularity, ratings, reviews, usage counts, or FAQ content.
- Changes to SEO templates belong in the generator, never in hundreds of generated pages.

## Accessibility Rules

- Use semantic HTML and native controls before custom widgets.
- Every input needs an associated localized label and clear validation constraints.
- Interactive controls must be keyboard operable and have visible focus states.
- Do not communicate state by color alone.
- Preserve `aria-live`, status, progress, error, and focus-management behavior in the existing tool page.
- Decorative icons must not create noisy accessible names; meaningful controls require localized accessible labels.
- Verify RTL and LTR layout, mobile behavior, zoom, contrast, and reduced-motion expectations when relevant.

## Testing Rules

- Add deterministic tests for every new calculation, parser, transformation, validator, or processing contract.
- Cover a valid case, boundary conditions, invalid input, and localized error behavior where applicable.
- File tools require representative real-file fixtures or browser-level verification of the produced file, not only filename/MIME assertions.
- Verify important output properties such as page count, dimensions, duration, container/codec compatibility, archive entries, or decoded content.
- Keep fast deterministic tests in the normal `npm run validate` path.
- Place expensive browser/media compatibility tests in an explicit or scheduled suite when running them on every commit would be disproportionate.
- A new `.mjs` test under `tests/` is discovered automatically by the existing sequential test runner.
- Never claim a tool is fully verified when only schema or smoke tests ran; record manual compatibility gaps honestly.

## Completion Checklist for AI Agents

- Existing architecture and relevant ADRs were read first.
- Planned files were named before editing.
- Only source-of-truth files were changed.
- No parallel registry, renderer, generator, or category was introduced.
- Arabic and English copy are complete.
- Privacy claims match actual data flow.
- Generation and validation pass.
- Generated output, search, categories, sitemap, navigation, and mobile behavior remain intact.
- The final report lists changed files, validation performed, and any remaining limitation without overstating completion.
