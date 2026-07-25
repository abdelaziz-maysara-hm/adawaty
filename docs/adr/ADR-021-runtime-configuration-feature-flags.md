# ADR-021: Runtime Configuration and Feature Flags

## Status

Accepted.

## Decision

Introduce canonical runtime configuration and feature flag services. Configuration is layered across defaults, environment, runtime and tool-specific overrides, with immutable snapshots and schema validation. Feature flags support boolean and variant values, prerequisites, deterministic percentage rollouts, contextual rules and scoped overrides.

Mounted tools receive read-only `context.config` and `context.features` facades.

## Consequences

Runtime behavior can be changed without editing tool implementations, while configuration precedence and flag evaluation remain deterministic and observable.

// END OF FILE
