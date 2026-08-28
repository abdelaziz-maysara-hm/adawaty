# Adawaty Tool Creation Standard

## Scope

Use this checklist whenever an Adawaty tool is added, replaced, retired, or materially changed. It applies to calculators, generators, file processors, converters, and approved interactive tools.

Read `docs/ROADMAP.md` first -- it is the single source of truth for this project's current state, principles, and rules. This guide does not authorize a new architecture.

## 1. Confirm Product Fit

Before coding, confirm that the tool:

- solves a real user task and is not a duplicate of an existing or retired tool;
- can deliver a trustworthy result in the browser;
- fits the browser-first privacy policy;
- has an honest scope and known limitations;
- belongs to the current roadmap or has explicit product approval.

Search existing IDs and capabilities before choosing a name:

```bash
rg "id: 'candidate-tool-id'" src/product
rg "relevant capability" src/product/definitions docs/ROADMAP.md
```

## 2. Select an Existing Category

Choose exactly one category key from `src/product/category-labels.js`:

`health`, `finance`, `student`, `student-study`, `math`, `date-time`, `converter`, `developer`, `text`, `engineering`, `security-network`, `seo`, `color-css`, `home-lifestyle`, `islamic`, `image`, `video`, `audio`, or `pdf`.

Do not invent a category for one tool. A new category is a separate architectural/product change and must update every category consumer and its tests together.

## 3. Choose the ID and Owning Definition Module

- Use a globally unique lowercase kebab-case `id`.
- The current route slug is the same as `id`; do not add a separate slug property.
- Treat the ID as permanent after publication because it controls the URL, search metadata, sitemap entry, usage history, and inbound links.
- Check `src/product/retired-tool-ids.js`; do not reuse a retired ID without an approved migration.
- Add the definition to the existing domain file under `src/product/definitions/` whenever possible.
- Create a new definition module only when the existing files would become unclear and the new module represents a coherent domain group.

Never create or edit `tools/<id>/index.html` manually.

## 4. Reuse Existing Processing Infrastructure

Before implementing logic, inspect the applicable shared modules:

- `src/product/image-processing.js`
- `src/product/pdf-processing.js`
- `src/product/audio-processing.js`
- `src/product/video-processing.js`
- `src/product/ffmpeg-processing.js`
- `src/product/ocr-processing.js`
- neighboring definitions in the same domain

Reuse their validation, output naming, loading, progress, cancellation, cleanup, and browser compatibility behavior. Do not copy a shared helper into a new definition file.

Heavy libraries must be loaded lazily. Prefer browser APIs, existing pinned libraries, and current approved CDN/vendoring patterns.

## 5. Create the Definition

Match the neighboring definitions and use immutable objects where that module does. A typical processing definition is:

```js
const exampleTool = Object.freeze({
    id: 'example-tool',
    category: 'developer',
    icon: 'ABC',
    action: Object.freeze({
        ar: 'نفّذ العملية',
        en: 'Run operation',
    }),
    title: Object.freeze({
        ar: 'عنوان عربي واضح',
        en: 'Clear English Title',
    }),
    description: Object.freeze({
        ar: 'وصف عربي دقيق للفائدة والنتيجة.',
        en: 'An accurate English description of the benefit and result.',
    }),
    note: Object.freeze({
        ar: 'حدود الاستخدام والخصوصية باللغة العربية.',
        en: 'Usage, limitation and privacy guidance in English.',
    }),
    inputs: Object.freeze([]),
    async process(values, language) {
        return {
            value: '...',
            label: '...',
            details: '...',
        };
    },
});
```

Use `calculate(values, language)` for synchronous calculations and `process(values, language)` for transformations or asynchronous work. Use `interactive` only through the existing approved interactive-page pattern.

The current canonical schema has no separate `slug` and no consumed `tags` field. Do not add either to one tool in isolation. If tags become a requested feature, update the central schema, catalogue/search logic, generated index, generator, and tests as one coordinated change.

## 6. Define Inputs Correctly

Each input must have:

- a unique lower-camel-case `id`;
- a supported `type`;
- `label.ar` and `label.en`;
- `unit.ar` and `unit.en`, even when empty;
- realistic limits and supported attributes.

File inputs must declare truthful `accept` values and support only formats the implementation can decode. Multiple-file tools must use the existing `multiple` pattern. Validate file content where shared inspectors exist; extension or MIME alone is not sufficient for security or reliability.

Select options require stable values and Arabic/English labels. Defaults and placeholders must be valid for the handler and must not silently produce invalid zero or empty values.

## 7. Implement and Validate the Result

- Validate inputs before expensive work.
- Keep user data local unless an explicitly approved feature states otherwise.
- Return the current result contract: `value`, `label`, optional `details`, optional `download`, and optional `preview`.
- Provide the correct Blob MIME type, filename, and extension.
- Clean temporary resources in success, failure, and cancellation paths.
- Produce actionable localized user errors. Do not expose raw stack traces.
- For long-running media work, integrate with the existing progress/cancellation events rather than adding a second progress UI.

## 8. Register the Definition

If a new definition collection was created:

1. export it using the naming style of neighboring modules;
2. import it in `src/product/tool-definitions.js`;
3. spread it into the existing canonical definition composition exactly once.

Do not create another registry or a manually maintained list of public routes. The current `tool-definitions.js` collection is canonical and filters retired IDs.

## 9. Add Tests

Add or extend tests under `tests/` at the lowest useful level:

- exact-result tests for deterministic calculators and converters;
- parser and validation tests for malformed and boundary input;
- user-journey/schema coverage for the definition and inputs;
- real-file tests for image, PDF, audio, video, archive, and document processing;
- browser verification for APIs that require DOM, Canvas, Web Audio, media decoding, downloads, or CDN-loaded libraries.

For a file tool, verify properties of the output—not only that a Blob exists. Depending on the tool, check page count, dimensions, duration, container, codec compatibility, archive members, extracted text, or decoded pixels/samples.

Keep normal validation fast. Expensive compatibility matrices may run manually or on a schedule, but their results and untested formats must be reported honestly.

## 10. Regenerate Product Output

After any change to a product definition or the generation template, run:

```bash
npm run generate:product
```

This must update the existing generated outputs rather than create alternate pages. Review the generated diff and confirm:

- `/tools/<id>/index.html` exists for a normal generated tool;
- the tool appears in `/all-tools/` through the canonical definitions;
- the matching category page remains valid;
- `src/data/tool-index.json` contains the tool metadata;
- `sitemap.xml` contains the canonical route;
- retired tools were not accidentally restored;
- unrelated generated pages did not change unexpectedly.

Interactive tools may follow an existing approved manual-page exception. Do not invent a new exception without an architectural decision.

## 11. Run the Quality Gates

Run all required checks:

```bash
npm run validate
git diff --check
```

When definitions changed, generation must run before validation. Do not bypass failures.

Then verify in a browser:

- Arabic and English title, labels, action, notes, errors, and results;
- RTL and LTR layout;
- desktop and mobile navigation;
- keyboard operation and visible focus;
- valid and invalid inputs;
- actual output and download behavior;
- catalogue search, category filtering, and return navigation;
- no unexpected console errors.

## 12. SEO and Accessibility Review

Confirm that the generated page retains:

- a truthful unique title and meta description;
- canonical route and sitemap entry;
- `SoftwareApplication` and breadcrumb structured data;
- Open Graph, Twitter, and language metadata;
- semantic headings and labeled native controls;
- understandable focus, status, progress, and error behavior;
- adequate contrast and mobile usability.

Do not create generic FAQ or keyword-stuffed text solely for schema. Do not fabricate reviews, popularity, or usage statistics.

## 13. Final Review and Handoff

Before committing:

- inspect `git status` and the complete diff;
- exclude unrelated or user-owned files;
- confirm no generated page was manually edited;
- ensure all new files end and format consistently with neighboring files;
- document user-visible behavior and known limitations in the changelog or roadmap when the established workflow requires it.

The completion report must state:

- source files changed;
- generated outputs refreshed;
- tests and browser checks performed;
- supported formats and limits;
- any deferred backend, compatibility, or visual-fidelity work.

## Quick Checklist

- [ ] Read architecture, roadmap, relevant ADRs, source, scripts, and tests.
- [ ] Confirmed real user value and browser-only feasibility.
- [ ] Reused an existing category and unique non-retired ID.
- [ ] Added one canonical definition in the correct module.
- [ ] Added complete Arabic and English copy.
- [ ] Reused shared processing helpers and lazy loading.
- [ ] Added deterministic and/or real-file tests.
- [ ] Ran `npm run generate:product` when required.
- [ ] Ran `npm run validate` and `git diff --check`.
- [ ] Verified search, category, tool route, index, sitemap, navigation, languages, accessibility, and mobile behavior.
- [ ] Reviewed the final diff and excluded unrelated files.
