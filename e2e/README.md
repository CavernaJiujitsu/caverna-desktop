# Browser E2E (Playwright)

End-to-end journeys for the desktop client against the **real local stack**:
Vite on `http://127.0.0.1:5173` and the NestJS API on `http://localhost:3000`.
The browser suite complements Vitest: it proves the screens against the actual
API contracts, including the C1 teacher payload and the C2 active-link roster.

## Prerequisites

- API running on `:3000` with the seed accounts (password `seed-dev`):
  `admin@caverna.com`, `admin.caverna@caverna.com`, `mestre.semente@caverna.com`.
- `npx playwright install chromium` (once per machine).
- Never run the backend suite, Docker or migrations from here.

Each spec creates its own data through the API (students with a unique e-mail,
future classes, enrollments and validations). Nothing is deleted: the local
database is shared and is never cleaned by this suite. Only correct seed
passwords are used, because the API rate limit is per IP.

## Running

```bash
npm run e2e          # headless, starts or reuses the Vite dev server
npm run e2e:headed   # same journeys with a visible browser
```

Playwright starts `npm run dev` itself (`webServer` in
`e2e/playwright.config.ts`) and reuses a server already on `:5173`. The API is
not started by the suite.

Useful overrides:

| Variable      | Default                        | Purpose                               |
| ------------- | ------------------------------ | ------------------------------------- |
| `E2E_API_URL` | `http://localhost:3000/api/v1` | API base used by specs                |
| `CI`          | unset                          | Retries once and fails on `test.only` |

Artifacts (trace, screenshot, video) land in `e2e/.artifacts/` and `e2e/test-results/`,
both ignored by Git. The suite runs with `workers: 1` because the journeys share
the same seed accounts and local API.

## Journeys

| Spec                     | Proves                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01-session.spec.ts`     | Login by role; context switch keeps the session; each context only sees its routes.                                                                                      |
| `02-trainings.spec.ts`   | Academy lists a training, expands the active roster and a range over 31 days is limited (not rejected); platform sees trainings and roster without management shortcuts. |
| `03-students.spec.ts`    | Platform lists every student without a cave filter and searches by name and e-mail.                                                                                      |
| `04-attendance.spec.ts`  | The class teacher opens the attendance panel and checks in a student enrolled through the API.                                                                           |
| `05-evaluations.spec.ts` | The class teacher approves a scheduled validation after the student's check-in.                                                                                          |

The API helpers in `e2e/support/api.ts` create the input data and verify the
outcome of each journey (enrollment `CONFIRMED`, validation `APPROVED`), so the
assertions do not trust the UI alone. Route filters are filled with the class
date; rows are found by time and capacity to stay unambiguous.
