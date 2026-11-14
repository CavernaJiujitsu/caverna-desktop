# Feature: platform users filters and pagination controls

Source task: user report on `/platform/users` (desktop). The backend contract is verified in `../backend/src/modules/platform/users`.

## Problem and objective

The platform users screen only exposes a text search and a fixed page size of 10. With larger directories the operator cannot narrow the list by profile, cannot choose how many accounts to show per page and has no quick way to jump across pages. In the reported environment the list contained 7 accounts, so the next-page button was correctly disabled, which looked like a broken pagination control.

Observable outcome: an authorized platform administrator can combine a name/e-mail search with a profile filter, choose 10/25/50/100 accounts per page or load the whole matching directory, and navigate forward/backward through the result set with an accurate total.

## Scope and non-scope

- In:
  - Profile filter (`STUDENT`, `TEACHER`, `CAVE_ADMIN`, `ADMIN`) sent to the backend.
  - Page size selector (10, 25, 50, 100) and a `Todos` mode that loads every matching page.
  - First/previous/next/last pagination controls with the current page and total in the footer.
  - Reset to page 1 whenever a filter changes.
  - Backend `role` query parameter on `GET /api/v1/platform/users`, including it in pagination links.
  - Service, hook and page tests covering the new query and controls.
- Out:
  - New user creation endpoints, bulk actions or CSV export.
  - Changes to authorization rules or the platform guard.
  - Redesigning the users screen beyond the filter/pagination area.
  - Persisting filters in the URL or local storage.

## Requirements

- Functional:
  1. The search form keeps filtering by name or e-mail and applies on submit.
  2. The profile select filters the server-side query; `Todos os perfis` sends no role.
  3. The page-size select offers 10, 25, 50 and 100 and applies immediately.
  4. `Todos` loads every page for the active search/profile combination in chunks of 100 and shows the complete count without page controls.
  5. Changing search, profile or page size resets the current page to 1 and clears the selected detail.
  6. The footer reports the current page, total pages and total accounts, and the first/previous/next/last controls are enabled only when the target page exists.
  7. The empty state distinguishes an unfiltered empty directory from a filtered search with no matches.
  8. Deleting the only account on a page moves the view to the previous page.
- Non-functional:
  - Native labelled selects, visible focus, keyboard operation and `aria-live` for the result summary.
  - The `Todos` mode fetches pages sequentially to avoid a burst of parallel requests.
  - No `any`, no direct Axios calls from the page and no client-side mirror of remote state.

## Contracts and types

- Confirmed current contract: `GET /api/v1/platform/users?page,limit,search` returns `{ data, _meta: { page, totalPage, total }, _links }`; `limit` is capped at 100.
- New backward-compatible query parameter: `role` accepts `STUDENT | TEACHER | CAVE_ADMIN | ADMIN`, is optional and combines with `search`.
- The backend includes `role` in `_links` so pagination stays consistent.
- `PlatformUsersQuery` becomes `{ page, limit, search?, role? }`; `listAll` uses the same filters without `page`/`limit`.

## Interface and error states

- Loading: existing loading state while the first page or the full directory is fetched.
- Empty: "Nenhum usuário ainda" when no filter is active; "Nenhum usuário encontrado" when search/profile filter excludes everything.
- Success: filter card, list, result summary and pagination footer.
- Error: existing forbidden/network/server messages with retry; `Todos` uses the same error boundary as the list.
- Validation: `role` is constrained by the select; the backend rejects unknown values with 400.

## Acceptance criteria

- [ ] Search and profile filters can be combined and the API receives both values.
- [ ] Page size changes query `limit` and reset the page to 1.
- [ ] `Todos` shows every matching account across backend pages.
- [ ] First/previous/next/last controls reflect `_meta.page` and `_meta.totalPage`.
- [ ] The result summary announces page, total pages and total accounts.
- [ ] A deletion that empties a page moves the view to the previous page.
- [ ] Backend, service, page tests and quality gates pass.

## Test plan

- Backend unit: service forwards `role`, includes it in `_links`; controller forwards the DTO.
- Desktop service: `list` sends `search`/`role`/`limit`; `listAll` concatenates pages and preserves the total.
- Desktop page: filter changes reset the page, pagination buttons call the hook with the next/previous page, `Todos` uses the all-users hook, empty states and deletion remain covered.
- Mock boundaries: `http` for services, feature hooks for the page. No real API calls in automated tests.
- Quality gates: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`; backend `bunx tsc --noEmit` and focused Jest specs.

## Dependencies and decisions

- The backend change is required because the API rejects unknown query parameters (`forbidNonWhitelisted`); filtering only the current page on the client would produce incorrect totals.
- `Todos` deliberately reuses the paginated endpoint instead of raising the global `limit` cap, keeping the API contract stable.
- The screen remains useful with a small directory: the next/previous controls correctly stay disabled when `totalPage` is 1.
