# ADR-012: Runtime Observability and Circuit Breaker

## Status

Accepted.

## Context

Dynamic loading and runtime execution can repeatedly fail because of invalid
modules, environmental problems, or tool defects. Retrying every request
without health tracking causes repeated work and degrades the complete
application.

## Decision

Introduce `ToolRuntimeMonitor`.

The monitor provides:

- per-tool success and failure counters;
- consecutive-failure tracking;
- rolling failure windows;
- duration metrics;
- bounded immutable history;
- health snapshots;
- closed, open and half-open circuit states;
- configurable thresholds and cooldowns;
- explicit reset support;
- optional external reporting.

The runtime loader and lifecycle host execute protected operations through the
monitor. `ToolDirectory` exposes health, history and reset APIs.

## Consequences

Repeatedly failing tools are temporarily isolated, healthy tools continue to
operate, and the application can present accurate runtime diagnostics without
coupling UI code to loader or lifecycle internals.

// END OF FILE
