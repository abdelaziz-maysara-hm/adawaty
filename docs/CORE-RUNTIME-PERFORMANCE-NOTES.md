# Core Runtime v1.0 Performance Notes

## Event system

- Listener matching plans are cached between subscription changes.
- Listener-plan caches are invalidated when listeners are added or removed.
- Event history is trimmed in one bounded operation.
- `waitFor()` releases timers, abort listeners and subscriptions after every
  settlement path.

## Cache

- Cache events are allocated only when cache listeners exist.
- Cache event names are validated against a reused module-level set.
- Capacity remains bounded through LRU eviction.
- Expiration and disposal paths release retained entries.

## Lifecycle

- The kernel provides deterministic asynchronous disposal.
- Runner ownership is explicit.
- Repeated disposal is safe.
- Event listeners and cache resources are released during shutdown.

## Expected operating profile

The runtime is designed for browser-side tool execution with many small,
independent tools. It favors bounded memory, lazy loading and predictable
lifecycle cleanup over persistent global state.

// END OF FILE
