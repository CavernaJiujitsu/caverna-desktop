# Feature architecture decisions

Locate the feature in `src/features/<domain>/`. Keep page composition in `pages`, domain UI in `components`, Query hooks and domain keys in `hooks`, HTTP access in `services`, and boundary validation in `schemas`. Create only directories with concrete files. `app/router` owns route composition; `shared` is domain-neutral.

Before coding, inspect similar paths with `rg --files src/features src/shared`. A feature may import shared code. Do not import another feature's private module; expose a small public contract only when cross-feature use is real. Keep the NestJS API as the authority for business rules and authorization.
