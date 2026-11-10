# Caverna Desktop agent instructions

Inspect the repository and task before editing. Use the applicable skills in `.agents/skills/`: `trello-task` for Trello intake, `create-feature` for implementation, and `create-pr` for review and publication. Read only the references relevant to the current work.

Before each increment and before publishing, fetch `dev` and the working branch, compare commits/open PRs with GitHub and record the base. Integrate remote changes without overwriting other work. The team flow confirmed for this task targets `dev`; `main` remains release-only, despite older generic templates.

When mentioning a Trello card in chat, include its number and literal title. State whether work fixes a bug/gap in an existing card or implements a pending card. The PO authorizes reopening verified problems; explain evidence, distinguish review from integration, and explicitly report when the whole card can be marked complete. Keep the user's designated Notion history updated with simple chronological descriptions when connected. Never claim a board/page action without a successful tool result.

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
