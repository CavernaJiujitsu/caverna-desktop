# Component decisions

Search `src/shared/components` and nearby feature components before creating one. Keep a component in its feature when its language or interaction is domain-specific. Promote to shared when reuse is real and the API is stable; avoid wrappers that only forward props.

Use explicit prop types, semantic labels, meaningful focus, keyboard interaction, disabled/loading feedback and responsive layout. Render data/interaction in components; move nontrivial asynchronous logic to hooks. Use shadcn/ui primitives where appropriate without changing a shared primitive solely for one feature.
