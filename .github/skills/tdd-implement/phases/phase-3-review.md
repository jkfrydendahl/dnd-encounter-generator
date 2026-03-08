# Phase 3: Review & Finalize

**Goal**: Self-review changes, ensure quality, and finalize the PR.

## Actions

### 1. Run Full Test Suite

Execute the project's full build and test process. Confirm:
- All tests pass
- Zero warnings (or only pre-existing warnings)
- No temporary debug/logging artifacts remain

### 2. Self-Review Against Criteria

Review all changed files against the review criteria defined in `.github/instructions/code-review.instructions.md`:

- **Correctness & Logic**: Does the code do what it claims?
- **Security**: Any vulnerabilities introduced?
- **Performance**: Any unnecessary operations?
- **Error Handling**: Are failures handled gracefully?
- **Design & Architecture**: Does it follow the planned architecture?
- **Maintainability**: Is the code readable and well-structured?
- **Breaking Changes**: Does this break existing behavior?

### 3. Present Findings by Severity

| Severity | Action |
|----------|--------|
| 🔴 **Critical** | Must fix before merge |
| 🟠 **Warning** | Should fix, can defer with justification |
| 🟡 **Suggestion** | Optional improvements |

### 4. Fix Critical Issues

Address any critical findings before proceeding. For warnings, ask the user:
- **Fix all now**: Address everything before marking ready
- **Fix critical only**: Fix critical, create follow-up for the rest
- **Proceed as-is**: Mark ready for review

### 5. Update Review Checklist

```markdown
## Review Checklist
- [x] All scenarios passing
- [x] No debug/temporary artifacts in codebase
- [ ] Code review comments addressed
- [x] Build/CI passing
- [x] Ready for merge
```

### 6. Mark PR Ready

Remove draft status from the PR.

### 7. Generate Summary

Add a PR comment with implementation summary:

```markdown
## Implementation Summary

**What was built:**
- [Feature description]

**Tests:**
- {N} scenarios implemented, all passing
- Coverage: [relevant metrics if available]

**Key decisions:**
- [Notable implementation decisions]

**Files changed:**
- [List of key files with brief purpose]
```

### 8. Suggest Multi-Model Review

After marking the PR ready, suggest:

> For deeper review coverage with multiple AI models, run the `/review` command with the models listed in `.github/config/review-models.md`.

## Workflow Complete

After Phase 3, the implementation workflow is complete. The PR is ready for human review and merge.

## Success Criteria

- All tests pass with the project's full test suite.
- No temporary artifacts remain in code.
- Review Checklist is updated and PR is marked ready.
- Implementation Summary comment is posted.
