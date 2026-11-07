# Architecture

The application uses feature-first modules. `app` composes providers, routes and layouts. A feature owns its pages, components, schemas, hooks and services. `shared` contains domain-neutral UI and infrastructure and must never import features or app. Cross-feature use goes through a deliberate public contract, not another feature's internals.

Data flow: React page → feature hook → service → centralized Axios → NestJS API. TanStack Query owns remote cache and asynchronous state. React owns local component state; React Hook Form owns form state. Zustand is installed for a future concrete global UI need and is not used as a remote cache. There is no store until that need appears.

The authenticated routes are `/academies`, `/classes` and `/evaluations`. After login the app opens `/academies`; every protected route requires an in-memory session and a selected management context. The backend currently exposes a practitioner login contract (`POST /api/v1/auth/login`) but no management-context endpoints (#98), so login installs a labeled local fallback context when the context lookup fails; this grants no backend permission and must be replaced once #98 ships. `/management` lists authorized contexts when available. `/preview/academies` and `/preview/management/*` are development-only visual QA routes, registered only when `import.meta.env.DEV` is true and never linked from the product. The backend remains the authority for domain rules and authorization.

The neutral color tokens support light/dark mode. They are provisional pending Caverna Figma tokens.
