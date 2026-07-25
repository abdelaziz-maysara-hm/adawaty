# ADR-009: Runtime Tool Loading

## Status

Accepted.

## Context

Tool manifests expose asynchronous loader functions, but the catalogue layer
needs one reliable runtime service for lazy imports, concurrent requests,
timeouts, retries, cache invalidation and operational diagnostics.

## Decision

Introduce `RuntimeToolLoader` as the application-facing runtime loader.

It provides:

- lazy loading through each validated manifest loader;
- one in-flight promise per tool to prevent duplicate imports;
- explicit immutable load records;
- configurable timeout and retry policies;
- lifecycle hooks for before-load, after-load and errors;
- abort-signal support;
- partial-success bulk preloading;
- cache invalidation and operational snapshots;
- normalized `ToolLoadError` instances with stable error codes.

`ToolDirectory` owns one loader instance and exposes loading methods through its
stable facade.

## Consequences

Tool modules remain unloaded until required. Concurrent consumers share one
operation, failures are consistently classified, and UI code no longer needs
to implement loading policies independently.

// END OF FILE
