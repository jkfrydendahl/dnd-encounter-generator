---
description: Top-level Copilot instructions — routes to coding guidelines, skills, and conventions.
---

# Project Copilot Configuration

This project uses a structured Copilot framework with coding instructions, commit conventions, and reusable skills.

## Coding Instructions

Follow the guidelines in `.github/instructions/`:
- `general.instructions.md` — Language-agnostic coding standards (always active)
- `code-review.instructions.md` — Review criteria and severity levels (applied automatically during `/review`)
- Add language-specific files (e.g., `typescript.instructions.md`) as needed

## Commit Conventions

Follow the conventions in `.copilot-commit-message-instructions.md` when generating commit messages. Use standard format (type + summary + optional body) for most commits; use extended format (with Business Context, Technical Changes, Implementation Details, and Impact sections) for significant features or breaking changes.

## Configuration

- `.github/config/review-models.md` — AI models for multi-model code review (update when better models are available)
- `.github/config/test-runner.md` — Test execution mode (Local or Docker) and commands (read by TDD skill automatically)

## Available Skills

### `/refine-requirements`
4-phase planning workflow: Discovery → Exploration → Architecture → Test Plan.
Use before implementing any non-trivial feature or change.
See `.github/skills/refine-requirements/SKILL.md`.

### `/reference-lookup`
Look up patterns, APIs, and implementations in external codebases and documentation.
Configure project-specific sources in `.github/skills/reference-lookup/references/sources.md`.
See `.github/skills/reference-lookup/SKILL.md`.

### `/tdd-implement`
TDD implementation workflow: Setup → Red-Green-Refactor cycles → Review.
Use after planning is complete to implement features with strict test-first discipline.
See `.github/skills/tdd-implement/SKILL.md`.

### `/review` (Multi-Model Code Review)
Run multi-model review using the models configured in `.github/config/review-models.md`.
Review criteria and severity levels are defined in `.github/instructions/code-review.instructions.md` and applied automatically.
After review, use the synthesis skill to consolidate findings: see `.github/skills/code-review/SKILL.md`.
