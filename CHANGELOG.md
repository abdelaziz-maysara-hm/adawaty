# Changelog

## Sprint 6 — Batch 2

- Added discount, VAT, loan, compound-interest and date-difference calculators.
- Expanded the product catalogue from three to eight working tools.
- Added deterministic finance formulas and calculation coverage.
- Added canonical pages and sitemap discovery for every new tool.

## Sprint 6 — Batch 1

- Replaced the status-only homepage with the first usable product catalogue.
- Added a shared bilingual rendering and calculation layer for product tools.
- Launched BMI, percentage and age calculators.
- Added responsive calculator UI, canonical URLs and sitemap entries.
- Added calculation and page-contract integration coverage.

## Sprint 5 — Batch 23

- Added a responsive Arabic and English project-status homepage.
- Added a language preference that works without a build step.
- Added an automated GitHub Pages deployment gated by full validation.
- Added integration coverage for the page entry point and deployment workflow.

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
