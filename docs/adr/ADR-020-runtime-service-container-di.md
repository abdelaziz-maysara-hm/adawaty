# ADR-020: Runtime Service Container and Dependency Injection

## Status
Accepted.

## Decision
Introduce `ToolRuntimeServiceContainer` as the canonical dependency injection and service lifecycle layer. It supports singleton, scoped and transient lifetimes, value and factory services, aliases, required and optional dependencies, circular dependency detection, scopes, disposal hooks, dependency graphs and resolution diagnostics. Mounted tools receive an isolated service scope through `context.services`.

## Consequences
Runtime services are centrally registered and resolved without direct module coupling. Tool instances receive deterministic scoped services and scope disposal follows the unmount lifecycle.

// END OF FILE
