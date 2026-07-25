# ADR-008: Unified Tool Directory Service

## Status

Accepted.

## Context

The registry, category catalogue and search index are intentionally separate
modules, but application code needs one stable orchestration API. Initialization
must also avoid partially mutating live registries when one definition fails.

## Decision

`ToolDirectory` coordinates:

- category and tool registration;
- Vite-compatible manifest discovery;
- catalogue and navigation access;
- indexed search and suggestions;
- immutable snapshots;
- orphan and empty-category diagnostics;
- deterministic clearing.

Initialization performs preflight validation and duplicate checks before any
live registry is mutated.

## Consequences

- Pages and bootstrap code depend on one application-facing service.
- Lower-level registries remain independently usable and testable.
- Invalid batches fail before partial registration occurs.
- Diagnostics are available without coupling them to UI components.

// END OF FILE
