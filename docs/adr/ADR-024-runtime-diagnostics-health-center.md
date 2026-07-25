# ADR-024: Runtime Diagnostics and Health Center

## Status

Accepted.

## Decision

Introduce `ToolRuntimeDiagnosticsCenter` as the canonical aggregation layer for health probes and runtime snapshots. It supports critical and non-critical probes, filtering, timeouts, immutable reports, owner-scoped cleanup, bounded history, and full diagnostic bundles. Mounted tools receive `context.diagnostics`.

## Consequences

Operational health can be checked through one API without coupling callers to individual managers. Tool probes are removed automatically during unmount.

// END OF FILE
