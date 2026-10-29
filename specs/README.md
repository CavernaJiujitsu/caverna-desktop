# Spec-driven development

Use **Spec → Review → Implementation → Tests → Documentation → Pull Request** for meaningful features. Start from [the template](templates/feature-spec.md). A teammate reviews the API contract, acceptance criteria and open decisions before implementation. Keep small changes proportional: a brief issue or PR description may be enough when no new contract or behavior is introduced. Specs describe intent; tests and code remain the source of implemented behavior.

The [authentication example](examples/authentication.md) is deliberately incomplete until the NestJS team confirms its contract.
