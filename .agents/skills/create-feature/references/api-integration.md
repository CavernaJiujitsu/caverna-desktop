# API implementation checks

Read `docs/api-integration.md` and the actual NestJS contract before implementing a service. Type request and response DTOs separately when they differ. Parse external `unknown` where it matters. Use `http` from `src/shared/lib/axios.ts`, pass Query's AbortSignal, normalize errors without showing response bodies, and use domain query keys. Mutations invalidate only affected queries.

Before auth integration, confirm cookie or token transport, CORS, CSRF, session verification, expiration and logout. If those facts are missing, record them in the spec and stop dependent integration. A frontend route guard does not replace backend authorization.
