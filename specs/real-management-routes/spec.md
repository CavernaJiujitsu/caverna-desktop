# Feature: real authenticated management routes

> Superseded by [`specs/migrate-routes/spec.md`](../migrate-routes/spec.md). The local fallback context and practitioner login described below were replaced by the desktop login and server-confirmed contexts.

## Context and problem

The desktop management screens for academies, classes and evaluations were wired to the API but only reachable through `/preview/*`. The login page linked to a local context preview, and `/academies`, `/classes` and `/evaluations` were either empty protected routes or preview-only. Users could sign in but had no real product path to the data.

The backend login contract is also a practitioner login envelope, while the desktop still expected a local `{ accessToken, user }` payload. Management context endpoints do not exist on the backend yet (#98).

## Objective

After a successful login, open a functional authenticated screen and reach academies, classes and evaluations through the management navigation, without preview links.

## Scope and non-scope

- In scope:
  - Fix the login contract to unwrap `{ message, data, timestamp }`.
  - Store `userId` and `practitionerId` in the session.
  - Navigate to `/academies` after login.
  - Promote `/classes` and `/evaluations` to protected real routes.
  - Point the management shell and access-denied page to real routes.
  - Keep preview routes available only in development.
  - Add a documented local fallback context while the context API is missing.
- Out of scope:
  - Backend authorization or management context endpoints (#98).
  - Session persistence, renewal or logout endpoints.
  - New management screens for students, teachers or units.
  - Visual redesign or Figma token alignment.

## Functional requirements

1. A successful login validates the backend envelope, stores the bearer token, user id, practitioner id and a selected context, then opens `/academies`.
2. When the context lookup fails or returns no contexts, login uses a labeled local fallback context so the authenticated screens remain usable.
3. `/academies`, `/classes` and `/evaluations` require a session and a selected context. A missing session redirects to `/login`; a missing context redirects to `/management`.
4. The management shell links to the three real routes and marks the active one.
5. `/management` selects a context locally; a failed context switch request does not block navigation.
6. `/preview/*` routes are registered only when `import.meta.env.DEV` is true and are never linked from the product.
7. The login page no longer exposes a preview link.

## Non-functional requirements

- Protected navigation uses React Router redirects, not `navigate()` during render.
- The local fallback is clearly labeled and documented as temporary; it grants no backend permission.
- UI remains keyboard accessible and preserves existing loading, empty and error states.
- Tokens remain memory-only.

## Data contracts

- `POST /api/v1/auth/login` returns:
  ```json
  {
    "message": "Login realizado com sucesso",
    "data": {
      "accessToken": "jwt",
      "tokenType": "Bearer",
      "expiresIn": 7200,
      "userId": "uuid",
      "practitionerId": "uuid"
    },
    "timestamp": "ISO-8601"
  }
  ```
  Validated with Zod in `auth.schema.ts` and unwrapped by `auth.service.ts`.
- `GET /api/v1/management/contexts` and `POST /api/v1/management/contexts/switch` remain **pending on the backend (#98)**. The service parses a success envelope, callers treat failure as recoverable, and login installs `buildLocalFallbackContext(userId)`.

## Interface states

- Login: validation error, credential error, rate limiting, network error, loading and success.
- Context lookup: success, empty or unavailable; unavailable/empty activates the local fallback.
- Protected routes: session missing → login; context missing → context selection; otherwise render the page.
- Academies, classes and evaluations keep their existing loading, empty and error states.

## Acceptance criteria

- [x] Login parses the backend envelope and rejects unexpected payloads.
- [x] Successful login reaches `/academies` and the bearer token is available to HTTP requests.
- [x] `/classes` and `/evaluations` are real protected routes.
- [x] The management shell and access-denied page use real routes.
- [x] The login page has no preview link.
- [x] Preview routes are development-only.
- [x] Unavailable management contexts do not block the authenticated screens.

## Test strategy

- Unit: auth service envelope parsing, rate-limit mapping and fallback context builder.
- Component: login page navigation/fallback, context selection navigation and graceful switch failure, academies error state inside the management shell.
- Mock boundaries: `http` and feature hooks.
- Quality gates: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run format:check` and `npm run build`.

## Dependencies and technical decisions

- Backend #98 must provide authorized contexts and per-operation authorization. Until then the local fallback is a UX bridge, not an authorization mechanism.
- The practitioner login contract (#78/#94) is reused as-is; teacher/platform role discovery is not available in the token.
- The desktop keeps the session in memory; page reload requires a new login.
