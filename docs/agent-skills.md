# Agent Skills validation and dry runs

The three `SKILL.md` files use YAML frontmatter with `name` and `description`. They were checked with the Codex `skill-creator` `quick_validate.py` validator. Relative reference and asset paths are checked against actual files. The environment exposes Trello read/search tools and GitHub read/write/PR tools; the skills use tool discovery instead of naming an unavailable command. The repository stores no Trello or GitHub credentials.

## Dry run 1: feature from a spec

Input: “Implement the academy list from its reviewed spec.” Expected route: `create-feature` reads `AGENTS.md`, architecture, the spec and existing shared components; checks the API contract; plans page/hook/service/schema boundaries; tests visible loading, empty, success and error behavior; runs lint, typecheck, tests and build. If the API contract is missing, it records the question instead of inventing an endpoint. No files were changed during this dry run.

## Dry run 2: prepare a PR

Input: “Create a PR for the academy feature.” Expected route: `create-pr` inspects status/diff/history, excludes unrelated files, runs gates, reviews security and accessibility, commits on a descriptive branch, pushes without force and opens a PR to `main` with real evidence. It stops on branch protection or conflicting remote history. No PR was created during this dry run.

## Dry run 3: interpret a Trello card

Input: “Read the login card and tell me how it will be implemented.” Expected route: `trello-task` searches the board through the Trello connector, asks if more than one card matches, reads available fields, distinguishes card facts from technical inference, preserves source criteria and creates an analysis/spec. It does not modify code or the card. The board was reachable through the connector; no card contents are claimed in this dry run.

## Runtime placement

The skills live in `.agents/skills/` and `AGENTS.md` routes requests to them. This session's sandbox overlays `.agents/` as read-only, so the files were prepared in a writable staging directory and moved into the repository's `.agents/skills/` during the Git publication step. The committed path is the agent discovery path.
