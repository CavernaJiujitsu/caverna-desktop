# Testing

Run `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run format:check` and `npm run build` before review. `npm test` starts Vitest watch mode.

Component tests use React Testing Library and user events. The suite covers keyboard interaction, Zod form validation, a mocked Axios adapter and safe server-error normalization, desktop login roles and 403 handling, session persistence and expiry, server-confirmed context selection, route-guard roles, schedule single/all scope, strong user deletion confirmation and service contracts for the new management routes. Tests make no network requests to the NestJS API. Add contract-level tests when backend DTOs change; avoid tests that merely repeat component implementation.

Husky runs lint-staged before commit on changed TypeScript, JavaScript, CSS, JSON, Markdown and HTML files. CI should run the full checks independently.
