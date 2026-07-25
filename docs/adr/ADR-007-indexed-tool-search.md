# ADR-007: Revision-Aware Indexed Tool Search

## Status

Accepted.

## Context

The catalogue requires fast Arabic and English search, structured filters and
autocomplete without rebuilding searchable text for every keystroke.

## Decision

`ToolSearchIndex` builds immutable search documents from `ToolRegistry`.

The index:

- rebuilds only when the registry revision changes;
- normalizes Arabic diacritics and tatweel;
- scores IDs, names, categories, tags, keywords and descriptions differently;
- supports category, tag, language, status and featured filters;
- excludes deprecated tools by default;
- returns matched-field diagnostics;
- provides autocomplete suggestions.

## Consequences

- Search remains deterministic and independent of UI components.
- Registry changes invalidate the index automatically.
- Tool ranking can evolve without changing manifest or catalogue contracts.
- Search result metadata can support highlighting and analytics later.

// END OF FILE
