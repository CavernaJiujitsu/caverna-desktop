---
name: trello-task
description: Read and analyze a Caverna Trello card, then produce a traceable frontend SDD spec or hand it to implementation. Use for Trello task lookup, analysis, acceptance criteria and card-driven features; analysis-only requests must not edit code.
---

# Trello task

**Board:** https://trello.com/b/Pezc5Kac/projeto-jiu-jitsu. **Entry:** A card URL, ID, name, list or search filter. Use the available Trello connector; discover it through the environment's tool inventory. Do not store credentials in the repository. If no connector is available, report that fact and request the card content or connection.

1. Locate the card using the provided identifier. If multiple cards match, ask which one; do not guess. Read title, description, checklists, labels, owner, relevant comments, attachments, dependencies and status when available. Follow [task analysis](references/task-analysis.md).
2. Separate card facts from technical inferences. Determine whether work belongs to frontend, backend or infrastructure. Do not implement backend changes here. Identify missing API contracts, business decisions and design dependencies.
3. Preserve the card's original criteria and translate them into a proportionate SDD spec using [task template](assets/task-spec-template.md) and [criteria guidance](references/acceptance-criteria.md). Link **Trello card → spec → implementation → tests → PR** with actual URLs/paths as they become available.
4. If the request is analysis only, return card identity, technical summary, criteria, dependencies, proposed implementation/tests and blockers; do not edit code. If implementation is requested and requirements are sufficient, follow `create-feature` after the spec. If a PR is requested, follow `create-pr` after quality gates.
5. Do not move the card, check boxes or comment unless explicitly authorized. If authorized, link the real PR and report objective progress. Writing code alone does not complete a Trello task.

**Exit:** A sourced, traceable analysis/spec or a clear connector/contract blocker. Do not claim card contents you could not read.

Example: “Read the login card and explain implementation” → locate the card, capture its exact criteria, identify unknown auth contracts and return a spec without editing code.
