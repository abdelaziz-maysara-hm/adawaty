# ADR-002 — Unified Error and Lifecycle Model

## Status

Accepted.

## Decision

All public runtime failures derive from `ToolError` and expose stable `code`, `metadata`, `recoverable`, and `cause` fields.

`ToolKernel` is the lifecycle owner for runners, loader, validator, context, cache namespace, and event namespace. Synchronous `dispose()` remains backward compatible, while `disposeAsync()` is the authoritative deterministic shutdown API.

Diagnostic event-listener failures must not replace the original tool execution error.

## Consequences

- Consumers can classify failures without parsing human-readable messages.
- Shutdown can be awaited in tests, navigation transitions, and hot-reload flows.
- Repeated disposal calls are idempotent.
- Existing synchronous callers remain compatible.

// END OF FILE
