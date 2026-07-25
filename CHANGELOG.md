# Sprint 5 — Batch 3 Changelog

## Indexed search

- Added `ToolSearchIndex`.
- Added revision-aware lazy rebuilding.
- Added weighted ranking across IDs, localized names, categories, tags,
  keywords and descriptions.
- Added Arabic diacritic and tatweel normalization.
- Added structured filters for categories, tags, languages, status and
  featured tools.
- Excluded deprecated tools by default.
- Added matched-field diagnostics.
- Added autocomplete suggestions.
- Added explicit index clearing and automatic refresh after registry changes.

## Public API

- Exported `ToolSearchIndex`.
- Exported `normalizeSearchText`.

## Verification

- Added bilingual ranking, filters, deprecated visibility, suggestions,
  normalization and revision invalidation integration coverage.

// END OF FILE
