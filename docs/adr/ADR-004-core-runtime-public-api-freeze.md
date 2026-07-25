# ADR-004: Freeze the Core Runtime v1.0 Public API

## Status

Accepted.

## Context

The previous core entry point exported both runtime classes and low-level
implementation helpers. This made internal refactoring risky because application
code could couple itself to normalization, cloning and middleware internals.

## Decision

`src/tools/core/index.js` is the only supported public entry point.

The stable API includes:

- runtime version and API-level constants;
- kernel and factory;
- context;
- events;
- cache;
- loader;
- validator and validation rule;
- runner;
- documented runtime error classes.

Implementation helpers remain available only to direct internal module imports
and are not covered by compatibility guarantees.

## Consequences

- The public contract is smaller and easier to maintain.
- Internal algorithms can evolve without breaking application code.
- Consumers that imported helper functions from the entry point must migrate to
  the owning public class.
- Any future breaking public change requires a new API level.

// END OF FILE
