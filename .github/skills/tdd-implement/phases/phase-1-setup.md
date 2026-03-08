# Phase 1: Setup

**Goal**: Prepare feature branch and draft PR from a work item with completed planning.

## Prerequisites

Validate the work item has completed planning:
- Architecture section present
- Test Plan section present with Scenario Inventory table

If missing, abort and suggest running `/refine-requirements` first.

## Actions

### 1. Obtain Work Item Details

Gather the work item title, description, and any associated metadata (issue number, labels, etc.).

### 2. Validate Planning Complete

Parse for required sections:
- `## Architecture` must be present
- `## Test Plan` must be present with Scenario Inventory table

If validation fails:
> "This work item is missing required planning sections. Please run `/refine-requirements` first to complete planning."

### 3. Ensure Feature Branch Exists

Create or switch to a feature branch. Naming convention:

```
feature/{slug}        # For new features
fix/{slug}            # For bug fixes
issue/{number}-{slug} # When linked to an issue
```

Where `slug` is derived from the work item title (lowercase, hyphenated, max 50 chars).

### 4. Ensure Draft PR Exists

Extract **Architecture** and **Test Plan** from the work item. Build the **Implementation Progress** table by copying the Scenario Inventory rows.

The draft PR description should use this structure (see [pr-template.md](../references/pr-template.md) for full template):

```markdown
## Summary
[Brief description from work item]

---
## Architecture
[Copy from work item]

---
## Test Plan
[Copy from work item]

---
## Implementation Progress
| # | Scenario | Red | Green | Refactor | Status |
|---|----------|-----|-------|----------|--------|
| 1 | [Scenario 1] | [ ] | [ ] | [ ] | Not started |
...

---
## Review Checklist
- [ ] All scenarios passing
- [ ] No debug/temporary artifacts in codebase
- [ ] Code review comments addressed
- [ ] Build/CI passing
- [ ] Ready for merge
```

### 5. Present Summary

```
## Setup Complete

**Branch:** {branch-name}
**PR:** #{pr-number} (draft)

Architecture and Test Plan copied to PR.
Implementation Progress table initialized with {N} scenarios.

Ready to begin implementation?
```

## User Checkpoint

Wait for user confirmation before Phase 2.

## Error Handling

- **No planning sections**: Suggest running `/refine-requirements` first.
- **Branch already exists**: Ask user whether to use existing branch or create new one.
- **PR already exists**: Ask user whether to resume from existing PR or create new one.
