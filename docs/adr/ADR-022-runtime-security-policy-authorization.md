# ADR-022: Runtime Security Policy and Authorization Engine

## Status
Accepted.

## Decision
Introduce a central default-deny authorization engine with explicit allow and deny policies. Explicit deny rules take precedence. Policies may target actions, resources, subjects, roles, tools, extensions, environments and conditional attributes. Mounted tools receive a scoped `context.security` facade.

## Consequences
Authorization decisions are centralized, immutable, explainable and auditable. Runtime components can apply consistent security rules without embedding policy logic.

// END OF FILE
