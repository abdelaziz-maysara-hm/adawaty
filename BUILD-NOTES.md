# Sprint 5 — Batch 22 Build Notes

Added a dependency-free validation harness for the existing runtime:

- `npm test` discovers and executes every integration test in deterministic path order.
- `npm run check` validates all JavaScript modules with the active Node.js runtime.
- `npm run validate` runs both checks and returns a non-zero exit code on any failure.
- The package is explicitly configured for ES modules and requires Node.js 20 or newer.

Apply after Sprint 5 Batch 21.

// END OF FILE
