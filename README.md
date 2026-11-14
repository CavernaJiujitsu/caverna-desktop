# Caverna Desktop

## Project Overview

Caverna Desktop is the React web client for Caverna Jiu-Jitsu, a platform for managing and following practitioners' journeys. The desktop signs in through the desktop endpoint and exposes authorized management routes for contexts, schedules, memberships, platform caves/users and the workouts pilot.

## Problem & Motivation

The client needs predictable boundaries for navigation, forms, remote data and UI state before feature work begins. This bootstrap makes those boundaries executable and testable without inventing backend behavior.

## Tech Stack

React, TypeScript, Vite, React Router, TanStack Query and Devtools (development only), Tailwind CSS, selected shadcn/ui-style components, Axios, Zod, React Hook Form, Zustand (reserved for a concrete global UI need), Sonner and Lucide React. Vitest, React Testing Library, ESLint, Prettier, Husky and lint-staged support quality checks. npm owns the lockfile.

## Architecture Overview

```mermaid
flowchart LR
  UI[React UI] --> Hooks[Feature Hooks]
  Hooks --> Services[Services]
  Services --> Axios[Axios]
  Axios --> API[NestJS API]
```

The diagram is the production flow. Pages call feature hooks, hooks coordinate TanStack Query, and feature services call the centralized Axios client. The session uses the desktop bearer-token login contract and is persisted in `localStorage` with an `expiresAt` derived from the backend `expiresIn`, so a reload within the token lifetime keeps the user signed in. Login stores the desktop roles and optional `teacherId`/`caveId`; `/management` loads the authorized contexts from the backend and only stores the context confirmed by the switch endpoint. The confirmed context is persisted with the session to restore the same workspace after a reload. The JWT is never replaced during a context switch. Development-only preview routes remain available for visual QA and are never linked from the product. `app` composes features and shared resources; features depend on `shared`; `shared` depends on neither app nor features.

## Architectural Decisions

Feature ownership, query caching and fail-closed protected routes are recorded in [ADR 0001](docs/decisions/0001-feature-first-architecture.md). The neutral light/dark tokens are provisional until Caverna Figma tokens are agreed. The frontend never enforces backend authorization or duplicates domain rules.

## Project Structure

```text
src/
  app/                 providers, router and layouts
  features/            auth, management, schedules, memberships, platform, workouts and the legacy academies/classes/evaluations areas
  shared/              UI, HTTP, errors, notifications and query client
  styles/              provisional semantic tokens
  test/                test setup
docs/                 architecture and engineering guidance
specs/                template and illustrative authentication spec
```

Only directories containing actual files are present.

## Getting Started

Requires Node.js 20.19+ or 22.12+ and npm. Run:

```bash
npm ci
cp .env.example .env
npm run dev
```

Open the URL printed by Vite. `/` redirects to `/login`. A successful desktop sign-in opens `/management`, where the backend-authorized contexts are listed and the chosen context is confirmed by `POST /management/contexts/switch`. The selected context drives the navigation: platform contexts open `/platform/caves` and `/platform/users`; academy and teacher contexts open `/schedules` and `/memberships`; every context can open `/workouts`. `/password-recovery` and `/password-recovery/reset` are public. `/access-denied` and `/session-expired` show safe informational states. `/preview/*` routes exist only during development for visual QA and are never linked from the product. The Vite dev server works without `.env` using documented local defaults.

## Environment Variables

| Variable              | Default                 | Purpose                      |
| --------------------- | ----------------------- | ---------------------------- |
| `VITE_API_BASE_URL`   | `http://localhost:3000` | Public NestJS API origin     |
| `VITE_API_TIMEOUT_MS` | `10000`                 | HTTP timeout in milliseconds |

Values are validated at startup. `VITE_*` values ship to the browser and must never contain secrets. `.env` and local overrides are ignored by Git.

## Available Scripts

| Script                                    | Purpose                               |
| ----------------------------------------- | ------------------------------------- |
| `npm run dev`                             | Start Vite development server         |
| `npm run build`                           | Typecheck and build production assets |
| `npm run preview`                         | Preview production assets             |
| `npm run lint` / `npm run lint:fix`       | Check or fix lint issues              |
| `npm run format` / `npm run format:check` | Apply or check Prettier               |
| `npm run typecheck`                       | Check strict TypeScript projects      |
| `npm test` / `npm run test:run`           | Watch or run tests once               |

## API Integration Strategy

Feature services own calls and runtime validation of external responses. Hooks pass AbortSignal, use domain query keys and invalidate after mutations. The central Axios client has a public base URL, configurable timeout and safe error normalization. Login posts to `/desktop/auth/login` and unwraps the backend envelope `{ message, data, timestamp }`, validating the desktop roles and optional profile ids. Management contexts, schedules, memberships, platform administration and workouts all parse their real contracts with Zod. See [API integration](docs/api-integration.md).

## State Management Strategy

TanStack Query owns server state, freshness, retries and invalidation. React state handles local UI, and React Hook Form handles form state. Zustand is available only when a concrete cross-page UI state arises; no store is created for cached API data or toasts.

## Validation & Error Handling

Zod validates the login and password-recovery forms, schedule and membership inputs, external API responses and environment. The HTTP boundary maps known failure categories into safe user-facing errors without exposing response bodies. Sonner notifications are centralized with consistent durations and stable IDs to avoid duplicates. Forms have labeled controls, inline errors and submission feedback. A failed or empty context lookup keeps the user on the context screen with a retry action; there is no local fallback context. Global 401 redirects skip public auth routes, and 403 responses are rendered contextually instead of forcing a redirect.

## Testing & Code Quality

Vitest and React Testing Library cover component interaction, form validation, mocked HTTP behavior, desktop login/roles, server-confirmed context selection, route guards, schedule scope, strong user deletion and the service contracts. Run `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run format:check` and `npm run build` before review. Husky and lint-staged check changed files before commits. See [testing guidance](docs/testing.md).

## Spec-Driven Development Workflow

Use **Spec → Review → Implementation → Tests → Documentation → Pull Request**. The [spec template](specs/templates/feature-spec.md) captures the problem, requirements, contracts, UI states and acceptance tests. Keep small changes proportional. The [authentication example](specs/examples/authentication.md) lists open contract questions instead of making up endpoints.

## Development Conventions

Use `@/` imports, keep HTTP out of components, make features own their UI and hooks, and add shared abstractions only when they provide real reuse. Maintain semantic HTML, keyboard behavior and responsive layouts. See [conventions](docs/conventions.md) and [architecture](docs/architecture.md).

### Agent Skills

[`AGENTS.md`](AGENTS.md) routes agent work to three Agent Skills in `.agents/skills/`:

| Skill                                                      | Use it for                                                                    | Example request                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`trello-task`](.agents/skills/trello-task/SKILL.md)       | Read a card, preserve its acceptance criteria and create a traceable SDD spec | “Read the login card and explain the implementation.” |
| [`create-feature`](.agents/skills/create-feature/SKILL.md) | Implement a reviewed feature with tests and quality gates                     | “Implement the academy list from its spec.”           |
| [`create-pr`](.agents/skills/create-pr/SKILL.md)           | Review, validate, commit and open a PR to `main`                              | “Create a PR for this feature.”                       |

For a card-to-PR request, use them in that order. Each skill has entry/exit criteria, operational steps, references and a reusable output template. The Trello skill uses the environment's connector and stores no credentials. GitHub publication respects branch protection. See [skill validation and dry runs](docs/agent-skills.md).

## Roadmap

1. Align the workouts pilot contract and permission grant (`workouts:read`) with the final product scope.
2. Replace the remaining legacy academies/classes/evaluations screens as their management replacements leave pilot.
3. Decide server-side logout and token renewal with the backend; client-side persistence now lasts until the two-hour token expires.
4. Finish the detailed Figma review when the design connector is available; replace the current visual approximation with approved tokens and components.
5. Add the remaining rich management flows (attendance, belt evaluations and reports) on top of the real routes.

## Contributing

Start meaningful work with a proportionate spec, review the API and design dependencies, implement with tests, run the quality scripts and open a focused pull request using Conventional Commits. Do not commit credentials or introduce client-side authorization as a substitute for API checks.
