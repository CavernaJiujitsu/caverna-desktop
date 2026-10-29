# Caverna Desktop agent instructions

Inspect the repository and task before editing. Use the applicable skills in `.agents/skills/`: `trello-task` for Trello intake, `create-feature` for implementation, and `create-pr` for review and publication. Read only the references relevant to the current work.

## Architecture

- Keep feature-first boundaries: `app` composes, features depend on `shared`, and `shared` never imports features or app.
- UI renders, hooks coordinate TanStack Query, services call centralized Axios. Backend owns business rules and authorization.
- Use Zod for forms and untrusted data. Use Zustand only for real global UI state; never mirror Query cache or Sonner toasts.
- Reuse components after checking existing code; avoid speculative abstractions and duplicate API contracts.

## Delivery

- Write a proportionate spec before relevant feature work; record unknown API contracts instead of inventing them.
- Use strict TypeScript, clear names, semantic accessible UI and focused tests. Avoid `any` and unrelated edits.
- Run lint, typecheck, tests and build; report failures accurately. Keep docs aligned with actual code and review for secrets.
- Use descriptive branches, Conventional Commits and focused PRs. After the authorized bootstrap, treat `main` as protected workflow: no direct push, force push or automatic merge. Never bypass GitHub branch protection.
- Do not claim tool actions without evidence. Communicate concrete access or contract blockers.
