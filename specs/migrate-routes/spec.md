# Feature: migrate desktop routes to the authorized management API

> Session persistence was added after this delivery in [`specs/session-persistence/spec.md`](../session-persistence/spec.md); the memory-only decision below reflects the original scope.

Source: desktop integration prompt (route table supplied by the product owner). Backend contracts verified in `../backend/src` (IAM, management contexts, training schedules, platform, memberships and desktop workouts modules).

## Problem and objective

The desktop still signs in through the practitioner login and uses the old `/caves`, `/users` and `/teachers` management routes. The backend now exposes desktop-specific and management-scoped routes with roles, cave scope and admin management. The desktop must consume those contracts, discover real management contexts and expose the corresponding screens.

Observable outcome: TEACHER, CAVE_ADMIN and ADMIN accounts sign in through `/api/v1/desktop/auth/login`, see only their authorized contexts and can operate schedules, platform administration, cave memberships and the desktop workouts pilot. A STUDENT-only account receives the backend 403 and stays on the login screen with a safe message.

## Scope and non-scope

- In:
  - Desktop login, roles/teacherId/caveId session data and 403 handling.
  - Public password recovery request and reset screens.
  - Server-validated management contexts and context-based navigation.
  - Recurring schedule list/create/detail/update (single/all)/deactivate.
  - Platform caves list/detail/suspend/activate/units and cave-admin management.
  - Platform users paginated list/detail/delete with strong confirmation.
  - Student and teacher membership link/unlink/list and membership history reactivation/deactivation.
  - `GET /desktop/workouts` pilot screen.
  - Tests, spec and documentation updates.
- Out of:
  - Backend changes, authorization rules or new endpoints.
  - Session persistence/renewal, logout endpoint, refresh token.
  - Redesign or Figma token work.
  - Removing legacy routes that still back existing features (classes, evaluations, practititioners, teachers, academies CRUD).

## Requirements

- Functional:
  1. Login posts to `/api/v1/desktop/auth/login`, validates `roles` and optional `teacherId`/`caveId`/`practitionerId`, stores them in the in-memory session and opens `/management`.
  2. A 401/403/429 login failure is shown inline; a 403 does not redirect to another page.
  3. Password recovery request and reset call the public endpoints and render success, validation and expired-token states.
  4. `/management` loads `GET /management/contexts`; selection posts `{ contextId }` to `POST /management/contexts/switch` and only stores the confirmed context locally. The JWT is never replaced.
  5. Context navigation is built from the confirmed context role: platform, academy or teacher.
  6. Recurring schedules support list, create, detail/edit with `scope: single | all`, and deactivate.
  7. Platform caves support list, detail, suspend, activate, unit listing and cave-admin list/create/remove.
  8. Platform users support paginated search, detail and deletion guarded by typing the account e-mail.
  9. Memberships support linking/unlinking students and teachers to units, listing unit members and reactivating/deactivating historical links.
  10. The workouts pilot requires a session and renders loading, empty and error states.
- Non-functional:
  - Feature-first boundaries; services own HTTP and Zod parsing; hooks own TanStack Query keys/invalidation.
  - Route guards improve UX only; every API call remains authorized by the backend.
  - Context changes clear scoped query caches so data from another cave is not shown.
  - Semantic, keyboard-accessible forms with explicit labels and error announcements.
  - Tokens remain memory-only.

## Contracts and types

All success responses use the backend envelope `{ message?, data, timestamp? }`; paginated payloads are `{ data, _meta: { page, totalPage, total }, _links }`.

- `POST /api/v1/desktop/auth/login` → `{ accessToken, tokenType: "Bearer", expiresIn, userId, roles: ("STUDENT"|"TEACHER"|"CAVE_ADMIN"|"ADMIN")[], practitionerId?, teacherId?, caveId? }`.
- `POST /api/v1/auth/password-recovery/request` body `{ email }` → `data: null`, generic message; no account disclosure.
- `POST /api/v1/auth/password-recovery/reset` body `{ token, password(min 8) }` → `data: null`; invalid/expired token is 401.
- `GET /api/v1/management/contexts` → `{ id, role: "platform"|"academy"|"teacher", label, detail? }[]` (base response unwrapped).
- `POST /api/v1/management/contexts/switch` body `{ contextId }` → same context DTO; 403 when not owned by the user.
- `GET/POST /api/v1/training/schedules`, `GET/PATCH/DELETE /api/v1/training/schedules/:id` → schedule entity `{ id, caveUnitId, teacherId, title, startsAt, endsAt, dayOfWeek (0-6), startDate, endDate, capacity, active, caveUnit?, teacher? }`. PATCH accepts partial fields plus `scope`; response `{ scope, updated, schedules }`.
- `GET /api/v1/platform/caves`, `GET /api/v1/platform/caves/:id`, `PATCH .../suspend`, `PATCH .../activate`, `GET .../units` → cave entity with units; units contain `id,name,address,neighborhood,latitude,longitude`.
- `GET/POST /api/v1/platform/caves/:caveId/admins`, `DELETE .../:adminId` → `{ id, userId, name, email, caveId }`. POST accepts either `{ name, email, password }` or `{ userId }`.
- `GET /api/v1/platform/users` query `page,limit,search` → paginated safe users `{ id,name,email,role,createdAt,updatedAt }`; `GET/DELETE /api/v1/platform/users/:id`.
- `POST /api/v1/memberships/students/cave-units` body `{ practitionerId, caveUnitId }`; `DELETE .../:practitionerId/:caveUnitId`; `GET .../:caveUnitId/practitioners` → links with `practitioner.user`.
- `POST /api/v1/memberships/teachers/cave-units` body `{ teacherId, caveUnitId }`; `DELETE .../:teacherId/:caveUnitId`; `GET .../:caveUnitId/teachers` → links with `teacher.user`.
- `GET /api/v1/memberships/history/practitioners/:practitionerId`; `GET /api/v1/memberships/history/cave-units/:caveUnitId/practitioners` → links with `active`, `joinedAt`, `caveUnit`; `PATCH .../reactivate` and `.../deactivate`.
- `GET /api/v1/desktop/workouts` → `{ actorId, practitionerId?, caveId?, items: [{ id,name,type,startsAt,endsAt,capacity }] }`.

Unknowns: the workouts permission grant (`workouts:read`) is configured outside the login response; the screen surfaces 403 instead of inferring it.

## Interface and error states

- Login: validation, credentials (401), no desktop access (403), rate limit (429), network/timeout, loading, success.
- Contexts: loading, empty (no context authorized), forbidden (stale/invalid), retry.
- Schedules: loading, empty, create/edit validation, single/all explanation, deactivate confirmation, 403/404 errors.
- Platform caves: loading, empty, forbidden for out-of-scope cave admin, suspend/activate confirmation, admins loading/empty/error.
- Users: loading, empty search, pagination, detail loading/not found, delete requires exact e-mail and shows backend 403/409 safely.
- Memberships: loading, empty unit, linked/unlinked feedback, history active/inactive, reactivation/deactivation errors.
- Workouts: loading, empty, forbidden.

## Acceptance criteria

- [x] Desktop login uses `/desktop/auth/login`, stores roles and optional teacherId/caveId, never assumes practitionerId.
- [x] STUDENT-only login shows a 403 message without leaving the login page.
- [x] Password recovery request and reset work from public routes.
- [x] `/management` lists only server contexts; selection is confirmed by the switch endpoint; no local fallback exists.
- [x] Unauthorized role routes redirect to the access-denied page; the API remains authoritative.
- [x] Schedules list/create/detail/update single or all/deactivate are wired.
- [x] Platform caves list/detail/suspend/activate/units/admins are wired.
- [x] Platform users list/detail/delete with strong confirmation are wired.
- [x] Student/teacher memberships and history reactivation/deactivation are wired.
- [x] Workouts pilot is wired.
- [x] Lint, typecheck, tests and build pass. Format check passes for files changed by this feature; unrelated pre-existing files still fail it.

## Test plan

- Service unit tests: envelope parsing, endpoints/verbs/bodies, optional session fields, pagination, 403 mapping.
- Component tests: login success/403, context selection success/forbidden/empty, strong delete confirmation, schedule scope.
- Mock boundaries: `http`, feature hooks and the router.
- Quality gates: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run format:check`, `npm run build`.

## Dependencies and decisions

- Backend route ownership verified in the sibling `backend` repository at implementation time.
- The context switch response is the only source of truth for the selected context; no `X-Management-Context` header is invented because the backend does not read one.
- Global 401 auto-redirect excludes public auth routes; 403 no longer auto-redirects so pages can render contextual safe errors.
- The old academies/classes/evaluations routes stay until their replacements are out of pilot.
