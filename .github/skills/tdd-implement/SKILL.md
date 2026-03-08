---
name: tdd-implement
description: "Implements features via TDD after planning is complete. Use when a work item includes Architecture and Test Plan sections, or when resuming implementation from a PR."
---

# TDD Implementation Workflow

## Overview

3-phase workflow for implementing features using Test-Driven Development, starting from a work item that has completed planning (architecture + test plan). This skill focuses on outcomes and checkpoints, not specific tools. Use whatever tools your environment provides.

> **Prerequisite**: Run `/refine-requirements` first to complete planning phases, or ensure the work item already contains Architecture and Test Plan sections.

## When to Use

- The work item already contains **Architecture** and **Test Plan** sections.
- You need to implement a feature using strict TDD discipline.
- You are resuming from an existing PR and need to continue the TDD cycle.

## When Not to Use

- Planning is incomplete or missing (use `/refine-requirements`).
- The task is a trivial fix that doesn't warrant TDD ceremony.
- The task is release management, deployment, or production operations.

## Guidelines

- Validate planning completeness before any implementation.
- Treat the PR description as the source of truth for architecture, test plan, and progress.
- Follow Red-Green-Refactor for every scenario.
- Update progress immediately after each phase.
- Pause for user confirmation before starting Phase 2.

## TDD Discipline: Three Laws

Every Red-Green-Refactor cycle is governed by the Three Laws of TDD (Robert C. Martin):

| Law | Rule | What This Means |
|-----|------|-----------------|
| **Law 1** | Do not write production code until you have a failing test | Never create production code before the test that requires it exists and fails |
| **Law 2** | Do not write more of a test than sufficient to fail (compile error = failure) | A compilation/type error IS a failing test. Stop writing the test as soon as it fails |
| **Law 3** | Do not write more production code than sufficient to pass the currently failing test | Write the MINIMUM code to make the current test pass. Do not implement logic for future scenarios |

**Why Law 3 matters for AI agents:** AI agents tend to implement complete solutions in one pass. This produces code that "works" but was never driven by tests. Each scenario is designed to force a specific increment of production code. If you implement more than the minimum, you bypass the design-emergence mechanism.

**Practical enforcement:**
- Before writing ANY production code, ask: "Which specific failing test am I making pass?"
- After making a test pass, STOP. Do not add logic for the next scenario.
- If you realize the next scenario needs a loop but the current one does not, do NOT add the loop yet.

## Execution Verification

After each GREEN phase, verify the test actually exercised the intended code path — not just that assertions passed. AI agents can produce tests that pass without hitting the right code.

**Verification methods** (use what's available in your project):
- **Code coverage**: Run coverage tool and verify relevant lines/branches were hit
- **Test logging**: Add temporary log/print statements at decision points, verify they appear, then remove
- **Mocking/spies**: Verify expected functions were called with expected arguments
- **Debugger**: Step through to confirm execution flow

Remove any temporary verification artifacts (log statements, debug prints) during the REFACTOR phase.

## Do / Don't

**Do**
- Ensure a draft PR exists and contains Architecture, Test Plan, and Implementation Progress.
- Keep the progress table updated at every Red/Green/Refactor checkpoint.
- Remove all temporary debug/logging artifacts before completing a scenario.
- Surface blockers immediately and document them.
- Run the project's full test suite after each GREEN phase.

**Don't**
- Start implementation without Architecture and Test Plan sections.
- Leave debug/logging artifacts in code after refactor.
- Skip the RED failing-test verification.
- Implement production code beyond what the current failing test requires (Law 3 violation).
- Write a complete test when a partial test already fails (Law 2 violation).
- Mark a PR ready for review without completing the Review Checklist.

## Invocation

| Command | Action |
|---------|--------|
| `/tdd-implement` | Start from the current work item / issue |
| `/tdd-implement --resume` | Resume from existing PR |

## Phase Overview

| Stage | Phase | Mode | Primary Focus |
|-------|-------|------|---------------|
| **Setup** | 1 | Branch/PR setup | Prepare feature branch and draft PR |
| **Implementation** | 2 | Code changes | Red-Green-Refactor TDD cycles |
| **Review** | 3 | Finalization | Self-review, finalize PR |

## Workflow Phases

- [Phase 1: Setup](./phases/phase-1-setup.md) - Prepare branch and draft PR
- [Phase 2: Implementation](./phases/phase-2-implementation.md) - Red-Green-Refactor TDD
- [Phase 3: Review](./phases/phase-3-review.md) - Self-review, finalize PR

## Resuming Work

For resume logic when starting from a PR, see [resume.md](./references/resume.md).

## Task List Structure

When starting new workflow, create tasks:

```
[Phase 1] Setup - Prepare branch and PR
[Phase 2] Implementation - Red-Green-Refactor cycles
[Phase 3] Review - Self-review, finalize PR
```

## References

- [PR Template](./references/pr-template.md) - PR description structure
- [Resume](./references/resume.md) - Resume from PR logic
