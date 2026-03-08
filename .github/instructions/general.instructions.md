---
description: General development guidelines — building, testing, and available tools
---

# Knowledge Boundaries

Do not assume knowledge of framework APIs, language features, or platform behavior. Always validate against official documentation, project references, or available tools (e.g., MCP servers, language servers, documentation sites) before writing code that depends on specific behavior. When uncertain, look it up — do not guess.

Use `/reference-lookup` to find authoritative patterns when working with unfamiliar APIs or frameworks.

# Build & Test

Always build and test the project before returning results to the user. The build must complete with zero errors. If errors are reported, resolve them and rebuild until clean before responding.

Use the project's existing build and test commands (e.g., `make`, `npm run build`, `dotnet build`, `cargo build`, `go build`, etc.). Do not introduce new build tools unless the project has none.

# Code Quality

- Follow existing code conventions and patterns found in the repository.
- Match the project's naming conventions, file organization, and architectural patterns.
- Write minimal, focused changes — do not refactor unrelated code.
- Add or update tests when changing behavior.
- Update documentation when changing public APIs or user-facing behavior.

# Available Skills

Choose the right workflow for the task:

| Task Size | Approach |
|-----------|----------|
| **Trivial** (typos, config changes, one-line fixes) | Implement directly — follow Code Quality guidelines above |
| **Small** (bug fixes, minor features, localized changes) | Implement directly with tests — self-review will catch issues |
| **Medium–Large** (new features, multi-file changes, design decisions) | Use `/refine-requirements` → `/tdd-implement` for the full workflow |

**Skills:**
- `/refine-requirements` — Analyze and plan work items before implementation (4 phases)
- `/tdd-implement` — Implement features using TDD after planning is complete (3 phases)
- `/reference-lookup` — Find patterns, APIs, or implementations in external codebases and documentation

# Post-Implementation Review

After completing a feature or non-trivial change, **perform a self-review** of your own changes before returning to the user:

1. Analyze the diff of all changes made during this task
2. Evaluate against the review criteria in `.github/instructions/code-review.instructions.md`
3. Classify any findings by severity (🔴 Critical, 🟠 Warning, 🟡 Suggestion, ℹ️ Note)
4. If Critical or Warning findings are found, fix them before presenting the work to the user
5. Present a brief review summary alongside the completed work

After the self-review, suggest the user run a multi-model review for deeper coverage:

> For additional coverage with multiple AI models, run the `/review` command with the models listed in `.github/config/review-models.md`.
> Then ask Copilot to synthesize the findings using the code-review-synthesis skill.
