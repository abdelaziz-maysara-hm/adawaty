# ADR-018: Runtime Event Bus and Messaging

## Status

Accepted.

## Decision

Introduce `ToolRuntimeEventBus` as the canonical runtime messaging layer.

The event bus provides:

- named and wildcard subscriptions;
- ordered delivery through listener priorities;
- one-time and owner-scoped listeners;
- automatic owner cleanup during tool unmount;
- asynchronous publication and deferred delivery;
- middleware, filtering and cancellation;
- replayable events;
- request/response correlation;
- trace and correlation identifiers;
- bounded history and dead-letter diagnostics;
- pending-event backpressure protection.

Mounted tools receive a scoped `context.events` API.

## Consequences

Tools can communicate without direct coupling. Runtime messaging becomes
observable, testable and consistently cleaned up with the tool lifecycle.

// END OF FILE
