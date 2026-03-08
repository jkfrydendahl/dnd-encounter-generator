# Resuming from PR

When resuming from an existing PR, restore context and continue from the appropriate phase.

## Context Restoration Process

### 1. Obtain PR Data

Gather PR title, body, state, branch names, and linked issues/work items.

### 2. Parse PR Description for State

Extract workflow state from PR body sections:

Look for:
```markdown
## Implementation Progress
| # | Scenario | Red | Green | Refactor | Status |
```
Parse checkbox states to determine current scenario.

### 3. Determine Resume Point

**Phase Detection Logic:**

| Progress Table | Resume At |
|----------------|-----------|
| Missing or empty | Phase 1: Setup (may need to recreate PR) |
| No checkboxes checked | Phase 2: Start first scenario |
| Partially checked | Phase 2: Resume at incomplete scenario |
| All complete | Phase 3: Review & Finalize |

**Mid-Scenario Detection** (parse progress table rows):

| Red | Green | Refactor | Resume At |
|-----|-------|----------|-----------|
| [ ] | [ ] | [ ] | Start RED phase |
| [x] | [ ] | [ ] | Start GREEN phase |
| [x] | [x] | [ ] | Start REFACTOR phase |
| [x] | [x] | [x] | Next scenario |

### 4. Rebuild Task List

```
[Phase 1] Setup ✓
[Phase 2] Implementation - Resume at Scenario {X} ({phase} phase)
[Phase 3] Review & Finalize
```

### 5. Present Resume Summary

```
## Resume Summary

**PR:** #{number} - {title}
**Branch:** {branch-name}

**Current State:**
- Implementation: {M}/{N} scenarios complete
- Next: Scenario {X} - {name} ({phase} phase)

Ready to continue?
```

## Edge Cases

- **PR is not draft**: Ask whether to convert back to draft or continue.
- **PR is closed/merged**: Inform user the PR is no longer active.
- **Missing sections**: Offer to reconstruct from linked work item or re-run Phase 1.
- **Branch conflicts**: Suggest merging main/base into feature branch first.
