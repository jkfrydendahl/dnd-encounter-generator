# Copilot Project Template

A language-agnostic GitHub Copilot framework template you can drop into any development project. Provides structured workflows for requirements planning, TDD implementation, multi-model code review, and commit conventions — all tool-agnostic and customizable.

## Quick Start

Copy the Copilot configuration files into your project:

```bash
# Clone this template
git clone https://github.com/jkfrydendahl/copilot-project-template.git

# Copy into your project (adjust path)
cp copilot-project-template/.copilot-commit-message-instructions.md your-project/
cp -r copilot-project-template/.github your-project/

# Optional: copy Docker test runner
cp -r copilot-project-template/docker your-project/
```

Or use this repo as a [GitHub template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template) when creating new repositories.

### After Copying

1. **Check for existing Copilot config** — If your project already has `.github/copilot-instructions.md`, merge the router content rather than overwriting it.
2. **Configure reference sources** — Edit `.github/skills/reference-lookup/references/sources.md` with your project's reference repos, docs, and API specs. The file ships with examples only.
3. **Configure test runner** — Edit `.github/config/test-runner.md` with your project's test commands. Switch to Docker mode if using containerized tests.
4. **Review model configuration** — Check `.github/config/review-models.md` and update the AI models if newer ones are available.
5. **Add language-specific instructions** (optional) — Create files like `typescript.instructions.md` or `python.instructions.md` in `.github/instructions/` for language-specific guidelines.

## What's Included

```
.copilot-commit-message-instructions.md    # Commit message conventions
.github/
├── copilot-instructions.md                # Top-level router — ties everything together
├── config/
│   ├── review-models.md                   # AI models for multi-model review (update here)
│   └── test-runner.md                     # Test execution config: local or Docker
├── instructions/
│   ├── general.instructions.md            # Language-agnostic coding guidelines
│   └── code-review.instructions.md        # Review criteria & severity levels (auto-applied by /review)
└── skills/
    ├── code-review/                       # Multi-model review synthesis
    │   └── SKILL.md                       # Synthesis protocol (post-/review)
    ├── tdd-implement/                     # TDD implementation workflow
    │   ├── SKILL.md                       # Skill definition & TDD discipline
    │   ├── phases/
    │   │   ├── phase-1-setup.md           # Branch + draft PR setup
    │   │   ├── phase-2-implementation.md  # Red-Green-Refactor TDD cycles
    │   │   └── phase-3-review.md          # Self-review, finalize PR
    │   └── references/
    │       ├── pr-template.md             # PR description as state machine
    │       └── resume.md                  # Resume from existing PR logic
    ├── refine-requirements/               # Requirements → Architecture → Test Plan
    │   ├── SKILL.md                       # Skill definition & invocation
    │   ├── phases/
    │   │   ├── phase-1-discovery.md       # Understand requirements
    │   │   ├── phase-2-exploration.md     # Explore codebase, draft business rules
    │   │   ├── phase-3-architecture.md    # Design two approaches, user picks one
    │   │   └── phase-4-test-plan.md       # Write test plan, produce final output
    │   └── references/
    │       └── work-item-template.md      # Output template for work tracking tools
    └── reference-lookup/                  # External codebase & docs lookup
        ├── SKILL.md                       # Skill definition & procedure
        └── references/
            ├── sources.md                 # Configure your reference sources here
            └── search-patterns.md         # Tool-agnostic search heuristics
docker/                                    # (Optional) Docker test runner
├── docker-compose.test.yml                # Template — customize for your project
└── examples/
    ├── node.yml                           # Node.js test runner
    ├── python.yml                         # Python test runner
    ├── dotnet.yml                         # .NET test runner
    ├── go.yml                             # Go test runner
    └── al-bc.yml                          # AL / Business Central test runner
```

## Components

### Copilot Instructions Router

**File:** `.github/copilot-instructions.md`

Top-level configuration file that Copilot reads automatically. Routes to all coding guidelines, commit conventions, and available skills — ensuring Copilot picks up the full framework regardless of client.

### Commit Message Instructions

**File:** `.copilot-commit-message-instructions.md`

Structured conventional commit messages with:
- **Type + Scope** header (feat, fix, refactor, etc.)
- **Business Context** — why the change was made
- **Technical Changes** — what was modified
- **Implementation Details** — specific decisions and changes
- **Impact** — what's enabled, breaking changes, performance

### Coding Instructions

**File:** `.github/instructions/general.instructions.md`

Language-agnostic guidelines for Copilot:
- Build and test expectations
- Code quality standards
- Pointers to available skills

### Skill: `/refine-requirements`

A 4-phase workflow for analyzing work items before implementation:

| Phase | Focus | Output |
|-------|-------|--------|
| **1. Discovery** | Understand requirements, identify affected areas | Summary of scope and domains |
| **2. Exploration** | Explore codebase, draft and refine business rules | Business Rules Analysis table |
| **3. Architecture** | Design two approaches (Minimal vs Clean), user picks | Architecture document with diagrams |
| **4. Test Plan** | Write test scenarios using ZOMBIES methodology | Test plan with scenarios |

Each phase has a **user checkpoint** — Copilot won't proceed until you approve. The final output is a single Markdown block you can paste into your work tracking tool.

### Skill: `/tdd-implement`

A 3-phase TDD implementation workflow that picks up where `/refine-requirements` leaves off:

| Phase | Focus | Output |
|-------|-------|--------|
| **1. Setup** | Create feature branch and draft PR | PR with Architecture, Test Plan, and Progress table |
| **2. Implementation** | Red-Green-Refactor cycles per scenario | Production code + tests, progress tracked in PR |
| **3. Review** | Self-review, finalize PR | Ready-for-review PR with implementation summary |

Key features:
- **Three Laws of TDD** enforced — no production code without a failing test
- **ZOMBIES ordering** — scenarios processed Zero → One → Many → Boundary → Interface → Exception
- **PR as state machine** — progress table enables resuming from any point
- **Execution verification** — confirms tests actually hit the intended code paths

### Skill: `/review` (Multi-Model Code Review)

Two-part code review system:

1. **Review criteria** (`.github/instructions/code-review.instructions.md`) — automatically applied during every `/review` pass. Defines 7 review categories and 4 severity levels so each model evaluates against consistent standards.

2. **Synthesis skill** (`.github/skills/code-review/SKILL.md`) — run after a multi-model `/review` (using models from `.github/config/review-models.md`) to consolidate the independent passes into a deduplicated, confidence-scored, prioritized report.

### Skill: `/reference-lookup`

A configurable skill for exploring external codebases, documentation, and APIs:

1. **Configure sources** — edit `references/sources.md` with your project's reference repos, docs, and API specs
2. **Use the skill** — Copilot follows a structured procedure: identify sources → search → inspect → cross-check
3. **Get results** — file paths, function signatures, hook points, and recommended patterns

### Docker Test Runner (Optional)

Run tests inside Docker containers for consistent, reproducible test execution across environments. The TDD skill automatically uses Docker when configured.

1. **Configure** — Edit `.github/config/test-runner.md` to switch from Local to Docker mode
2. **Set up** — Copy an example from `docker/examples/` to `docker/docker-compose.test.yml` and customize
3. **Run** — `docker compose -f docker/docker-compose.test.yml run --rm test`

Pre-built examples for: **Node.js**, **Python**, **.NET**, **Go**, and **AL/Business Central**.

## Customization

### Add Language-Specific Instructions

Create additional instruction files in `.github/instructions/`:

```
.github/instructions/
├── general.instructions.md          # Included by default
├── typescript.instructions.md       # TypeScript-specific guidelines
├── python.instructions.md           # Python-specific guidelines
└── csharp.instructions.md           # C#-specific guidelines
```

### Configure Reference Sources

Edit `.github/skills/reference-lookup/references/sources.md` to add your project's reference sources:

```markdown
| Name | Type | Location | Description |
|------|------|----------|-------------|
| Django | repo | django/django | Django framework patterns |
| Project API | api-spec | docs/openapi.yaml | Our API contracts |
| Internal Wiki | docs | wiki.example.com | Team knowledge base |
```

### Add Project-Specific Skills

Create new skill folders in `.github/skills/` following the same pattern:

```
.github/skills/your-skill/
├── SKILL.md           # Skill definition with name, description, procedure
└── references/        # Supporting reference files
```

## Updating

If you copied this template into an existing project and want to pull in updates later:

```bash
# Add the template as a remote
git remote add copilot-template https://github.com/jkfrydendahl/copilot-project-template.git

# Fetch and review changes
git fetch copilot-template
git diff HEAD...copilot-template/main -- .github/ .copilot-commit-message-instructions.md

# Cherry-pick or manually merge the changes you want
```

Alternatively, compare your local files against the latest release and manually apply relevant changes.

## License

[MIT](LICENSE)