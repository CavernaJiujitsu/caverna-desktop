# API integration

`src/shared/lib/axios.ts` is the central HTTP client. `VITE_API_BASE_URL` defaults to local development and `VITE_API_TIMEOUT_MS` defaults to 10 seconds; both are validated at startup. The client requests JSON responses and accepts an `AbortSignal`. Services should pass TanStack Query's signal to Axios. The `SessionProvider` synchronizes the access token with the in-memory `access-token.ts` module; Axios adds a Bearer header per request and `clearSession` removes it. The session (token, roles, profile ids, `expiresAt` and the confirmed context) is also persisted in `localStorage` under a versioned key so a reload within the token lifetime keeps the user signed in. The payload is validated with Zod on read and discarded when expired, corrupt or from an unsupported version.

`normalizeHttpError` maps validation (400/422), unauthorized (401), forbidden (403), rate limiting (429), not found (404), server (5xx), network, timeout and cancellation into safe `AppError` kinds. When the API returns the contracted top-level string `message`, the UI may present that string; a 403 always becomes the generic `Sem permissão.` message. Consumers never render arbitrary response fields.

Feature services own request/response DTOs and runtime parsing when needed. Query keys are domain-scoped. Queries use a 60-second stale time and retry network, timeout and server failures at most once. Mutations do not retry and invalidate affected keys on success. Components handle loading, empty and error states explicitly.

Unit management uses `GET/POST /api/v1/caves/:id/units`,
`GET/PATCH/DELETE /api/v1/caves/:id/units/:unitId`. The list query uses the
backend pagination and search parameters; its paged response is read from
`data.data`. Unit archive uses the logical DELETE action, and reactivation uses
`PATCH { active: true }`. A cave-admin request scope comes only from the
confirmed academy management context. A platform administrator selects a cave
from the authorized cave list; the selected id is checked against that list
before requesting its units. Neither path treats a free-form cave id as
authorization. The desktop currently has no map component and student-only
accounts remain outside its authentication policy, so unit discovery by
proximity is not part of this desktop flow.

`GET /api/v1/platform/users` accepts `page`, `limit` (max 100), `search` by name/e-mail and `role` (`STUDENT`, `TEACHER`, `CAVE_ADMIN`, `ADMIN`). The users screen sends the search and profile filters to the backend and offers a `Todos` page-size option that concatenates the remaining pages in chunks of 100.

The desktop flow uses the backend's desktop bearer-token login response. `POST /api/v1/desktop/auth/login` returns `{ message, data: { accessToken, tokenType, expiresIn, userId, roles, practitionerId?, teacherId?, caveId? }, timestamp }`; the auth service validates and unwraps `data`, and the session stores the roles and optional profile ids without assuming `practitionerId`. Only TEACHER, CAVE_ADMIN and ADMIN accounts may enter; a STUDENT-only account receives the backend 403 and stays on the login screen with a safe message. Login computes `expiresAt` from `expiresIn` and persists the session in `localStorage`; the provider restores it and the Axios token on reload. The backend token lasts two hours and exposes no refresh or revocation endpoint, so after `expiresAt`, on logout or on a global 401 the user must authenticate again. `localStorage` exposes the bearer token to XSS; an HttpOnly-cookie migration requires backend changes.

`GET /api/v1/management/contexts` returns the authorized contexts and `POST /api/v1/management/contexts/switch` with `{ contextId }` confirms the selection. The confirmed response is the only source of truth; no `X-Management-Context` header is sent because the backend does not read one. Context switching is local UI state and never replaces the JWT.

Password recovery uses the public `POST /api/v1/auth/password-recovery/request` and `POST /api/v1/auth/password-recovery/reset` endpoints; recovery 401s are rendered inline and excluded from the global session-expired redirect. For HttpOnly cookies, set `withCredentials`, configure exact CORS origins and a CSRF strategy together with the backend. Frontend route guards only improve UX; the API must authorize every request. Never put secrets in `VITE_*` variables.
