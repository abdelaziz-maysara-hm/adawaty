# ADR-015: Runtime Transactions

## Status

Accepted.

## Context

Runtime operations may update several resources before an error, timeout or
explicit cancellation occurs. Without coordination, each caller must implement
its own compensation logic and partial changes can remain visible.

## Decision

`ToolRuntimeTransactionManager` coordinates atomic runtime work through:

- ordered commit handlers;
- reverse-order rollback handlers;
- explicit and signal-based cancellation;
- optional timeouts;
- immutable transaction metadata;
- bounded immutable history; and
- aggregate runtime counters and active-transaction snapshots.

`ToolDirectory` exposes transaction execution and diagnostics without exposing
the manager's mutable internal state.

## Consequences

Callers can register compensating operations next to the work they protect.
Rollback handlers are best-effort and all are attempted even when one fails.
The original failure and any rollback failures remain available on the typed
transaction error and history record.

// END OF FILE
