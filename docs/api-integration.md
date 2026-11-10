# API integration

`src/shared/lib/axios.ts` is the central HTTP client. `VITE_API_BASE_URL` defaults to local development and `VITE_API_TIMEOUT_MS` defaults to 10 seconds; both are validated at startup. The client requests JSON responses and accepts an `AbortSignal`. Services should pass TanStack Query's signal to Axios. The `SessionProvider` synchronizes the access token with the in-memory `access-token.ts` module; Axios adds a Bearer header per request and `clearSession` removes it. Tokens are not persisted in localStorage.

`normalizeHttpError` maps validation (400/422), unauthorized (401), forbidden (403), rate limiting (429), not found (404), server (5xx), network, timeout and cancellation into safe `AppError` kinds. It deliberately ignores backend error bodies. Consumers can present the safe message or choose context-specific copy.

Feature services own request/response DTOs and runtime parsing when needed. Query keys are domain-scoped. Queries use a 60-second stale time and retry network, timeout and server failures at most once. Mutations do not retry and invalidate affected keys on success. Components handle loading, empty and error states explicitly.

Shared login returns `{ message, data: { accessToken, tokenType, expiresIn, userId, practitionerId? }, timestamp }`. The optional practitionerId is absent for authorized accounts without a student profile. The token stays in memory and is lost on reload. Public login never inherits previous Authorization/context headers, including explicitly supplied stale defaults.

Backend PR #22 defines GET `/api/v1/management/contexts` and POST `/api/v1/management/contexts/switch` with `{ contextId }`. ID is a UUID; role is platform/academy/teacher. Academy requires caveId; teacher requires caveId, caveUnitId and teacherId. Zod validates fields by role and switch must return the chosen ID. Empty, failed and refused responses never generate local permissions. Every choice is server-confirmed before opening the destination. List requests receive AbortSignal and use Query cache by identity.

Scoped operations send X-Management-Context and Bearer; list/switch omit the old selector. The backend revalidates current grants. Teacher unit metadata uses GET `/api/v1/management/caves/:caveId/units/:unitId`; only platform calls global `/teachers`. Academy metadata uses public GET `/caves/:id`, and teacher class lists include the assigned unit. Remaining legacy policies are still required; client filters are not server isolation.

SessionProvider clears credentials/cache on logout and previous data on context change. Current authenticated 401 clears session before navigation; a scoped 403 clears the selected context. Public login errors stay on the form; list/switch 403 stays recoverable on the selector. Old-account 401/403 and old-context 403 do not disrupt current identity/selection. Explicit Bearer is used instead of cookies (`withCredentials: false`). Never put secrets in `VITE_*` variables.
