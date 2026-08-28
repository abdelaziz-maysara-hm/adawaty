# ADR-006: Category Registry and Catalogue Facade

## Status
Accepted.

## Decision
Categories use immutable manifests. `CategoryRegistry` owns category metadata and revisions. `ToolCatalogue` combines tool and category registries, caches by revision, excludes empty and hidden categories by default, and reports orphan tools.

## Consequences
Category pages and navigation share one source of truth, catalogue rebuilding occurs only after changes, and missing category definitions are detectable before rendering.

// END OF FILE
