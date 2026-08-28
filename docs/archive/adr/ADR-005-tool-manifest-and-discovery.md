# ADR-005: Tool Manifest and Discovery Contract

## Status

Accepted.

## Context

Sprint 5 requires tools to be discoverable without editing a central list for
every new implementation. Tool metadata must also be valid, immutable and
usable by bilingual catalogue, search and category features.

## Decision

Every tool provides a manifest containing:

- stable lowercase kebab-case ID;
- localized name and description;
- category;
- lazy loader;
- language support;
- tags and keywords;
- route, status, version, icon and display order.

`ToolRegistry.discover()` accepts module maps compatible with eager
`import.meta.glob()` results. The registry validates and freezes every manifest,
then maintains category and tag indexes.

## Consequences

- New tools can be discovered from their manifest modules.
- Invalid metadata fails during registration instead of failing in the UI.
- Search and category layers share one canonical source of metadata.
- Registry revisions allow dependent caches to invalidate deterministically.

// END OF FILE
