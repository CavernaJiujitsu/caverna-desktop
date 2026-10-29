# ADR 0001: Feature-first frontend architecture

**Status:** Accepted for bootstrap

## Context

The web client will grow across authentication, dashboard and academies while consuming an independent NestJS API. A flat component folder would obscure feature ownership and encourage UI-to-HTTP coupling.

## Decision

Organize business-facing code by feature. `app` composes, features depend on `shared`, and `shared` is domain-neutral. Each feature separates pages/components, query hooks, services and schemas. Use TanStack Query for server state and React Hook Form for forms.

## Alternatives considered

- A global layer-first hierarchy: simple initially, but feature changes spread across distant directories.
- A generic repository/factory architecture: adds indirection without a current need.

## Consequences

Feature work stays cohesive and can be reviewed with its spec. Shared abstractions require judgment to avoid premature generalization. Cross-feature contracts must be explicit. Authentication and real API DTOs remain future decisions, so protected routes fail closed.
