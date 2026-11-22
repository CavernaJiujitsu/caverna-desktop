# Feature: desktop session persistence across reloads

## Context and problem

The desktop keeps the access token and user roles only in React state. Reloading any page (or reopening the tab) drops the session and forces a new login, even though the backend token is still valid. The login response already provides `expiresIn`, but the app discards it.

The backend currently exposes only bearer-token login (`POST /api/v1/desktop/auth/login`) with a two-hour token. There is no refresh-token, session-verification or logout endpoint in the sibling backend (`../backend`), so the client cannot renew a session silently.

## Objective

After signing in, a page reload restores the valid session and the last confirmed management context, keeping the user on the protected screen until the token expires. Expired, corrupted or unavailable storage falls back safely to the login flow.

## Scope and non-scope

- In scope:
  - Persist the authenticated session in `localStorage` with a versioned payload.
  - Derive and store `expiresAt` from the backend `expiresIn`.
  - Persist the backend-confirmed management context.
  - Hydrate `SessionProvider` and the Axios access token before protected routes render.
  - Discard expired, malformed or unsupported payloads.
  - Clear persisted data on logout and on session expiration.
  - Unit and component tests plus documentation updates.
- Out of scope:
  - Refresh tokens, silent renewal, sliding expiration or "remember me" choice.
  - Backend logout/revocation endpoint and server-side session invalidation.
  - HttpOnly cookie transport, CSRF strategy or CORS changes.
  - Changes to login, context, roles or authorization contracts.
  - Redesign or new screens.

## Functional requirements

1. A successful login stores the session with `expiresAt = Date.now() + expiresIn * 1000`.
2. On application start, a stored session whose `expiresAt` is in the future restores `session`, `selectedContext` and the in-memory access token used by Axios.
3. Reloading a protected route with a restored session and an allowed context keeps the user on that route; a restored session without a context opens `/management`.
4. A stored session at or past `expiresAt` is discarded and the user must sign in again.
5. Corrupt JSON, schema-invalid payloads, unknown versions or unavailable storage behave as "no session" and never crash the app.
6. `clearSession`, used by logout and the session-expired page, removes the in-memory token and the persisted payload.
7. Selecting, switching or clearing the management context updates the persisted payload without replacing the session.
8. A new login replaces any previous stored payload; the previous context is not reused.
9. Only the session data already returned by the login endpoint is stored; no additional secrets, passwords or API error bodies are persisted.

## Non-functional requirements

- `localStorage` is the chosen transport so a reload and a browser/tab restart within the token lifetime keep the session. This exposes the bearer token to XSS; the CSP and dependency hygiene remain part of the deployment security baseline. A cookie-based transport requires backend changes and is out of scope.
- The stored payload is validated with Zod at the untrusted storage boundary.
- The storage module is domain-neutral and lives in `src/shared/session/`; features do not read storage directly.
- Route guards remain a UX layer only; the backend continues to authorize every request.
- No visual change; accessibility of existing screens is preserved.

## Data contracts

- Login response (unchanged, verified in `../backend/src/modules/iam/auth`):
  ```json
  {
    "message": "Login realizado com sucesso",
    "data": {
      "accessToken": "jwt",
      "tokenType": "Bearer",
      "expiresIn": 7200,
      "userId": "uuid",
      "roles": ["TEACHER"],
      "practitionerId": "uuid?",
      "teacherId": "uuid?",
      "caveId": "uuid?"
    },
    "timestamp": "ISO-8601"
  }
  ```
  `accessToken` is stored with `expiresAt` computed in milliseconds.
- Persisted payload under `caverna.desktop.session`:
  ```json
  {
    "version": 1,
    "session": {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "Name or null"
      },
      "accessToken": "jwt",
      "roles": ["TEACHER"],
      "practitionerId": "uuid?",
      "teacherId": "uuid?",
      "caveId": "uuid?",
      "expiresAt": 1760000000000
    },
    "selectedContext": {
      "id": "academy:cave-1",
      "role": "academy",
      "label": "Academy",
      "detail": "All units"
    }
  }
  ```
  `selectedContext` may be `null`.
- Unknowns: token revocation, refresh and server-side logout are not available; after `expiresAt` the user must authenticate again.

## Interface states

- Reload with valid payload: authenticated screen renders with restored session and context.
- Reload with expired payload: storage is cleared and the login route is required.
- Reload with corrupt/invalid/unsupported payload: same as expired, without an error screen.
- Logout or global 401: memory and storage are cleared; the session-expired screen is unchanged.
- Storage write failure (quota or disabled storage): login continues in memory for the current tab; persistence is best-effort and no error is shown.

## Acceptance criteria

- [x] A successful login writes the versioned payload with `expiresAt` derived from `expiresIn`.
- [x] Remounting the provider restores the session, roles, profile ids and Axios bearer token from storage.
- [x] A restored selected context allows direct access to its protected route after reload.
- [x] Expired, corrupt, invalid and unknown-version payloads are removed and yield no session.
- [x] Logout and the session-expired flow remove the persisted payload.
- [x] Context selection changes update the persisted context without changing the token.
- [x] Storage failures do not break login or render.
- [x] Lint, typecheck, tests, format check for changed files and build pass.

## Test strategy

- Unit (`session-storage.test.ts`): round trip, expiry, corrupt JSON, schema mismatch, unsupported version and storage exceptions.
- Component (`session-context.test.tsx`): hydrate on mount, token synchronization, logout clearing, selected-context persistence.
- Feature (`login-page.test.tsx`): login persists a valid payload.
- Mock boundaries: `localStorage`, `http` and the router; no real API calls.
- Quality gates: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`, plus `npm run format:check` on changed files.

## Dependencies and technical decisions

- Backend login contract and two-hour lifetime verified in `../backend/src/modules/iam/auth/auth.service.ts`; no refresh endpoint exists.
- `localStorage` is intentional for reload and browser-restart continuity; `sessionStorage` would only survive reloads. The bearer token remains exposed to XSS in either case because the backend does not issue HttpOnly cookies.
- The selected context is UI state confirmed by `POST /management/contexts/switch`; persisting it only restores the last authorized selection and never grants authorization.
- A future HttpOnly-cookie/refresh migration should replace this module without changing feature code.
