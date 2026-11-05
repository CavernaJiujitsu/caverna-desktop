# API integration

`src/shared/lib/axios.ts` is the central HTTP client. `VITE_API_BASE_URL` defaults to local development and `VITE_API_TIMEOUT_MS` defaults to 10 seconds; both are validated at startup. The client requests JSON responses and accepts an `AbortSignal`. Services should pass TanStack Query's signal to Axios. The `SessionProvider` synchronizes the access token with the in-memory `access-token.ts` module; Axios adds a Bearer header per request and `clearSession` removes it. Tokens are not persisted in localStorage.

`normalizeHttpError` maps validation (400/422), unauthorized (401), forbidden (403), not found (404), server (5xx), network, timeout and cancellation into safe `AppError` kinds. It deliberately ignores backend error bodies. Consumers can present the safe message or choose context-specific copy.

Feature services own request/response DTOs and runtime parsing when needed. Query keys are domain-scoped. Queries use a 60-second stale time and retry network, timeout and server failures at most once. Mutations do not retry and invalidate affected keys on success. Components handle loading, empty and error states explicitly.

The desktop management flow uses the backend's bearer-token login response. The token is memory-only and is lost on reload by design; a user must log in again. For HttpOnly cookies, set `withCredentials`, configure exact CORS origins and a CSRF strategy together with the backend. Frontend route guards only improve UX; the API must authorize every request. Never put secrets in `VITE_*` variables.
