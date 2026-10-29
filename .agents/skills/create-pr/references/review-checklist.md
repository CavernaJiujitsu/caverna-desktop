# Review checklist

- Scope: diff matches the task/spec; unrelated work remains unstaged.
- Architecture: UI, hooks and services are separate; shared has no feature imports.
- Safety: no credentials, sensitive logs, invented endpoints or client-only authorization claims.
- Behavior: loading, empty, success and error states; safe messages; cancellation and cache invalidation where applicable.
- Quality: strict types, meaningful tests, accessible names/keyboard handling, responsive UI and current docs.
- Git: remote history checked, staged diff reviewed, no force push, branch protection respected.
