# ADR-003: Performance and Memory Hardening

## Status

Accepted.

## Context

The canonical tool runtime performs frequent event dispatch and cache operations.
Long-lived browser sessions also require deterministic listener cleanup.

## Decision

- Cache matching event-listener plans and invalidate them whenever subscriptions change.
- Ensure `waitFor()` removes its timeout, abort listener and event subscription after every settlement path.
- Trim event history in one operation instead of repeatedly shifting the array.
- Avoid allocating cache event objects when no cache listeners exist.
- Reuse a single validated cache-event type set.

## Consequences

- Repeated event dispatch avoids rescanning and sorting unchanged listener collections.
- Completed, timed-out and aborted waits no longer retain abort listeners.
- Event-history trimming has lower copying overhead.
- Normal cache reads and writes have a smaller allocation footprint when diagnostics are unused.
- Public APIs remain backward compatible.

// END OF FILE
