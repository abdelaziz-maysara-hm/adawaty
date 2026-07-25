# ADR-014: Runtime State Persistence and Recovery

## Status

Accepted.

## Context

Runtime tools may lose user progress when they are unmounted, replaced,
reloaded or restored after navigation. Tool-specific persistence would create
inconsistent formats and lifecycle behavior.

## Decision

Introduce `ToolRuntimeStateStore` with a pluggable storage adapter.

The state system provides:

- structured-clone validation;
- immutable state records;
- per-tool and per-slot keys;
- schema versions and sequential migrations;
- record size limits;
- optional expiration;
- export and import snapshots;
- adapter-independent diagnostics;
- automatic restoration in runtime context;
- optional runtime `captureState()` during unmount.

`ToolDirectory` exposes state save, load, clear, import, export and diagnostics
without exposing adapter internals.

## Consequences

Tools can recover user state consistently across lifecycle transitions while
remaining independent of browser storage APIs. State migrations and limits are
enforced centrally.

// END OF FILE
