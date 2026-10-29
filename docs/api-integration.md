# API integration

`src/shared/lib/axios.ts` is the central HTTP client. `VITE_API_BASE_URL` defaults to local development and `VITE_API_TIMEOUT_MS` defaults to 10 seconds; both are validated at startup. The client requests JSON responses and accepts an `AbortSignal`. Services should pass TanStack Query's signal to Axios. No authentication interceptor is installed because its contract is unknown.

`normalizeHttpError` maps validation (400/422), unauthorized (401), forbidden (403), not found (404), server (5xx), network, timeout and cancellation into safe `AppError` kinds. It deliberately ignores backend error bodies. Consumers can present the safe message or choose context-specific copy.

Feature services own request/response DTOs and runtime parsing when needed. Query keys are domain-scoped. Queries use a 60-second stale time and retry network, timeout and server failures at most once. Mutations do not retry and invalidate affected keys on success. Components handle loading, empty and error states explicitly.

Authentication remains blocked until the NestJS team confirms endpoints, DTOs and session transport. For HttpOnly cookies, set `withCredentials`, configure exact CORS origins and a CSRF strategy together with the backend. For tokens, review storage and lifecycle instead of defaulting to localStorage. Frontend route guards only improve UX; the API must authorize every request. Never put secrets in `VITE_*` variables.
