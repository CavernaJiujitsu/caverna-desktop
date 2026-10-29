---
name: create-feature
description: Implement a Caverna Desktop feature or screen from approved requirements using SDD, feature-first boundaries, tests, and quality gates. Use for frontend feature implementation; use trello-task first when requirements live on Trello.
---

# Create feature

**Entry:** Requested frontend behavior with enough requirements to define observable acceptance criteria. Read root `AGENTS.md`, `docs/architecture.md`, `docs/conventions.md`, the relevant feature and [feature architecture](references/feature-architecture.md). Inspect similar components before editing.

1. **Understand:** identify the feature, user outcome, existing contracts, reusable UI, dependencies and risks. For API work read [integration guidance](references/api-integration.md). Do not infer missing auth or domain contracts.
2. **Specify:** create/update a proportionate spec in `specs/` using [the template](assets/feature-spec-template.md). Include problem, scope, functional and non-functional requirements, DTOs, interface and error states, acceptance criteria, test strategy and open decisions. Review ambiguous business/auth/API decisions with the owner before dependent implementation.
3. **Design:** choose only needed pages, components, hooks, services, schemas, types, keys, routes and tests. Read [component guidelines](references/component-guidelines.md) before promoting UI to shared.
4. **Implement:** use Page → feature hook → TanStack Query → service → Axios → backend for remote data. Parse untrusted responses when appropriate; pass AbortSignal; invalidate affected keys after mutations. Use RHF and Zod for forms, `notify` for toasts, and explicit loading/empty/error/success states. Keep semantic keyboard-accessible responsive UI.
5. **Verify:** test observable success, validation and failure paths using mocked boundaries. Follow [testing checklist](references/testing-checklist.md). Run `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`; fix introduced issues and state any unresolved checks.
6. **Deliver:** summarize files, decisions, tests, quality results, acceptance criteria and remaining dependencies. Commit only if requested or an active workflow explicitly calls for it.

**Exit:** Spec and implementation agree; relevant checks pass or a concrete blocker is reported. Never invent production endpoints, use `any` to silence errors, call Axios from UI, mirror server state in Zustand, or modify unrelated features.

Example: “Implement the academy list from its reviewed spec” → inspect the spec/API contract, implement the feature slices, test states and report gate results.
