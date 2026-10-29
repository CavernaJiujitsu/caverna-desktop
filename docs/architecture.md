# Architecture

The application uses feature-first modules. `app` composes providers, routes and layouts. A feature owns its pages, components, schemas, hooks and services. `shared` contains domain-neutral UI and infrastructure and must never import features or app. Cross-feature use goes through a deliberate public contract, not another feature's internals.

Data flow: React page → feature hook → service → centralized Axios → NestJS API. TanStack Query owns remote cache and asynchronous state. React owns local component state; React Hook Form owns form state. Zustand is installed for a future concrete global UI need and is not used as a remote cache. There is no store until that need appears.

The current academy service is an **in-memory demo adapter**. It has no Caverna endpoint and is reset on reload. `/preview/academies` exposes this demo. `/login` and `/preview/management` provide UI-only management entry and context examples: they do not send credentials, create sessions or authorize access. Protected routes fail closed pending a verified management authentication and context contract. The backend remains the authority for domain rules and authorization.

The neutral color tokens support light/dark mode. They are provisional pending Caverna Figma tokens.
