# ADR-026: Repeatable Validation Harness

## Status

Accepted.

## Context

The repository contains integration tests for the core and tool runtime, but the
empty package manifest prevents Node.js from resolving the ES modules. It also
provides no single command that contributors or continuous integration can use
to reproduce the validation described by previous build notes.

## Decision

Adawaty declares ES module semantics in `package.json` and provides
dependency-free Node.js scripts that:

1. discover and run every `.mjs` integration test under `tests`;
2. check JavaScript syntax under `src`, `scripts` and `tests`; and
3. expose both checks through `npm run validate`.

Tests run sequentially in deterministic path order so their console output and
failures remain easy to associate with a specific file.

## Consequences

- A clean checkout can validate the runtime without installing dependencies.
- Validation failures produce a non-zero process status suitable for CI.
- Future test files are included automatically when placed under `tests`.
- Node.js 20 or newer is the supported validation runtime.

// END OF FILE
