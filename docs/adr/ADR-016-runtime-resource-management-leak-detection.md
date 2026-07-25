# ADR-016: Runtime Resource Management and Leak Detection

## Status

Accepted.

## Decision

Add `ToolRuntimeResourceManager` for explicit ownership, reference counting, quotas, owner cleanup, idle cleanup, leak detection, diagnostics and optional memory-pressure cleanup. Mounted tools receive a scoped `context.resources` API.

## Consequences

Runtime resources have observable lifetimes and are automatically cleaned when their owning tool unmounts.

// END OF FILE
