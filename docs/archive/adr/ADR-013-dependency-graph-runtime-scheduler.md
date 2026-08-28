# ADR-013: Dependency Graph and Runtime Scheduler

## Status

Accepted.

## Context

Tools may depend on shared runtime modules or other tools. Loading them without
dependency resolution can produce incorrect ordering, duplicate work, cycles,
or excessive concurrent loading.

## Decision

Introduce `ToolDependencyGraph` and `ToolRuntimeScheduler`.

The dependency graph provides dependency registration, validation, deterministic
topological ordering, circular dependency detection and parallel-safe levels.

The scheduler provides bounded concurrency, priorities, in-flight
deduplication, idle scheduling, warm-up and immutable diagnostics.

`ToolDirectory` owns and exposes both components.

## Consequences

Dependencies load before dependants, unrelated dependencies can load in
parallel, and invalid graphs fail before runtime execution.

// END OF FILE
