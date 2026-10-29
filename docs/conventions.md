# Development conventions

- Use kebab-case filenames, PascalCase React components, `use`-prefixed hooks and named exports except lazy route pages.
- Keep feature-specific UI and schemas in that feature. Shared components need a proven second use or clear domain-neutral value.
- Keep HTTP in services. Hooks compose service calls and query keys. Components render states and interactions.
- Use `@/` for cross-directory imports. Avoid deep relative imports and `any`.
- Use Zod at form and untrusted-data boundaries. Do not copy backend business rules into UI schemas.
- Add semantic labels, focus behavior, keyboard access and responsive layouts. Prefer composition to wrappers that add no behavior.
- Add a proportionate spec before a meaningful feature, then review, implement, test, document and open a PR.
