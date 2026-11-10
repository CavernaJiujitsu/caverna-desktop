# Architecture

The application uses feature-first modules. `app` composes providers, routes and layouts. A feature owns its pages, components, schemas, hooks and services. `shared` contains domain-neutral UI and infrastructure and must never import features or app. Cross-feature use goes through a deliberate public contract, not another feature's internals.

Data flow: React page → feature hook → service → centralized Axios → NestJS API. TanStack Query owns remote cache and asynchronous state. React owns local component state; React Hook Form owns form state. Zustand is installed for a future concrete global UI need and is not used as a remote cache. There is no store until that need appears.

The authenticated routes are `/academies`, `/classes` and `/evaluations`. Shared login also accepts management accounts without a practitioner and opens `/management` for an explicit server-validated choice. The context list belongs to Query cache by user ID; SessionProvider keeps identity and selected context. No fallback or automatic selection is created. Context changes remove previous scoped queries; logout/account changes clear all cache and both credentials. Tokens remain memory-only.

Axios sends current Bearer and X-Management-Context on scoped operations; login has neither, and context list/switch has only Bearer. App-level handlers coordinate cleanup/navigation and ignore stale responses from another token/context. Backend PR #22 defines the confirmed contract; see `specs/98-real-management-contexts/spec.md` and `docs/api-integration.md`.

Academy UI loads the selected cave; teacher class queries retain the assigned unit and use the protected unit lookup plus own teacher ID. Only platform reads the global teacher collection. Academy route/menu exclude teacher role for UX. Client filters/guards do not replace server policies, which remain pending on legacy routes.

`/preview/academies` and `/preview/management/*` remain development-only visual QA routes, registered only when `import.meta.env.DEV` is true and never linked from the product. The backend remains the authority for domain rules and authorization.

The neutral color tokens support light/dark mode. They are provisional pending Caverna Figma tokens.
