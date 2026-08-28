# ADR-017: Plugin Runtime Capabilities

## Status

Accepted.

## Decision

Introduce a versioned capability registry and revocable permission tokens. Tools negotiate required and optional capabilities before mount, receive a restricted service facade, and expose capability discovery through a scoped runtime API.

## Consequences

Host services are injected only when explicitly granted. Tokens are auditable, expirable and revoked automatically on unmount.

// END OF FILE
