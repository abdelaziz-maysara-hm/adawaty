# ADR-025 — Runtime Telemetry & Metrics Platform

## Status

Accepted.

## Decision

Provide one runtime-owned telemetry service for counters, gauges, distributions, timers and correlated traces. Tool instances receive an owner-scoped immutable facade, and owned metrics are automatically removed during unmount.

## Consequences

Metrics use deterministic label keys, histories are bounded, snapshots are immutable, and tracing can represent parent/child spans without external dependencies.

// END OF FILE
