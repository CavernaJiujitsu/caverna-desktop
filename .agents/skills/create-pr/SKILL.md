---
name: create-pr
description: Review, validate, commit, publish and open a focused GitHub pull request for Caverna Desktop changes. Use when asked to send work for review or create a PR; do not merge it.
---

# Create PR

**Entry:** A defined change set to publish. Read root `AGENTS.md`, [review checklist](references/review-checklist.md) and [commit conventions](references/conventional-commits.md). Ensure GitHub access and target repository are known.

1. Inspect `git status`, `git branch --show-current`, `git diff`, staged diff, `git log -5 --oneline`, remote and upstream. Preserve pre-existing changes and remote history. Do not stage unrelated files.
2. Review architecture boundaries, security, DTO/error handling, accessibility, tests and docs. Use the checklist; compiling alone is insufficient. Check the diff for credentials and generated artifacts.
3. Run `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`. Fix relevant failures. A draft PR with documented limitations requires explicit user authorization when gates fail.
4. Use a descriptive branch such as `feat/CAV-123-academy-list` only when the task ID is real; otherwise `feat/academy-list`. Commit with Conventional Commits. Never force push or bypass branch protection.
5. Push the source branch and open a PR to `main` using the GitHub integration or `gh`, filling [the PR template](assets/pull-request-template.md). Include real Trello URL and screenshots only if they exist. Do not invent CI results.
6. Confirm the actual PR URL, source/target branches, commit hash, tests and review risks. Do not merge automatically.

**Exit:** A reviewable PR exists, or a concrete access/conflict blocker and locally prepared change are reported. Stop on conflicting remote history rather than rewriting it.

Example: “Create a PR for the academy list” → inspect and review the diff, run gates, commit on a feature branch, push and open a PR to `main`.
