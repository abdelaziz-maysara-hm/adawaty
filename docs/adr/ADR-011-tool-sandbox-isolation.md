# ADR-011: Tool Sandbox and Runtime Isolation

## Status

Accepted.

## Context

Runtime-loaded tools require isolation boundaries for capabilities, services,
events, resources and cleanup. Without a shared policy, each tool can access
more application services than required and may leak subscriptions or other
resources after unmounting.

## Decision

Introduce `ToolSandboxManager` and integrate it with `ToolRuntimeHost`.

Each mounted tool receives a dedicated sandbox session containing:

- an explicit capability set;
- a filtered service facade;
- session-scoped events;
- a resource registry with deterministic disposal;
- immutable session metadata;
- optional inactivity expiration;
- bounded diagnostic telemetry.

The runtime host creates a session before mount and closes it after unmount,
including when replacement occurs.

## Consequences

Tools receive least-privilege service access, event listeners cannot cross
session boundaries, owned resources are released with the lifecycle, and
runtime diagnostics are available without exposing internal mutable state.

// END OF FILE
