# ADR-019: Runtime Hooks and Extension Framework

## Status

Accepted.

## Decision

Introduce a canonical hook manager and extension registry.

`ToolRuntimeHookManager` provides before, after and around hooks with
priorities, conditions, one-time execution, timeouts, wildcard matching,
owner-based cleanup and bounded diagnostics.

`ToolRuntimeExtensionRegistry` provides dependency-aware extension
registration, discovery and lifecycle management.

Mounted tools receive a scoped `context.hooks` API, and extensions receive
owner-scoped hook registration helpers.

## Consequences

Runtime behavior can be extended without modifying core modules. Hook and
extension ownership is explicit, lifecycle cleanup is deterministic, and
extension dependencies are validated before startup.

// END OF FILE
