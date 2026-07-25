# Changelog

## Sprint 5 — Batch 22

- Restored a valid ES module package configuration.
- Restored the missing runtime transaction manager referenced by the public API
  and `ToolDirectory`.
- Repaired truncated class boundaries that prevented ten existing modules from
  parsing.
- Added a deterministic integration-test runner for every `.mjs` test under `tests`.
- Added a repository-wide JavaScript syntax check for source, scripts and tests.
- Added a single `npm run validate` command for repeatable local and CI verification.

## Sprint 5 — Batch 21

- Added runtime counters, gauges, histograms, summaries and timers.
- Added correlated traces and spans with error and duration tracking.
- Added owner-scoped RuntimeHost telemetry context and automatic unmount cleanup.
- Added ToolDirectory telemetry APIs and diagnostics source integration.

// END OF FILE
