# Phase 4: Test Plan

**Goal**: Create test scenarios and output as Markdown.

## Actions

### 1. Consult Testing Guidance

Gather test strategy based on:
- Feature description
- Architecture from Phase 3
- Business Rules from Phase 2

### 2. Get Pattern Knowledge

Review testing patterns relevant to the project (unit tests, integration tests, end-to-end tests, contract tests, manual verification).

### 3. Find Existing Patterns

Search the codebase for existing test patterns, fixtures, helpers, or testing utilities.

### 4. Apply ZOMBIES Checklist

- **Z**ero — Empty/null inputs, zero-length collections, missing data
- **O**ne — Single item/record cases
- **M**any — Multiple items/records, bulk operations
- **B**oundary — Edge cases, limits, max values, overflow
- **I**nterface — External interfaces, API boundaries, integration points
- **E**xceptions — Error handling, guard clauses, invalid state
- **S**imple — Happy path, standard usage

### 5. Apply Project-Specific Checklist

**Data & State:**
- [ ] Data validation and constraints verified
- [ ] State transitions produce expected results
- [ ] Transaction/atomicity behavior verified (no partial updates)
- [ ] Concurrent access scenarios considered (if applicable)

**API & Integration:**
- [ ] Input validation and sanitization
- [ ] Authentication/authorization checks
- [ ] Error responses follow project conventions
- [ ] External service failures handled gracefully

**UI & UX (if applicable):**
- [ ] Component renders correctly with various data states
- [ ] User interactions produce expected behavior
- [ ] Loading, error, and empty states handled
- [ ] Accessibility requirements met

### 6. Write Test Plan

Create a test plan with this structure:

**Test Plan Type:** [Manual / Automated / Mixed]
**Scope:** [Feature Name]
**Environment:** [Dev/Staging/Sandbox]

**Checklist:**
- [ ] [Key validation or flow]
- [ ] [Key data processing or calculation]
- [ ] [Permissions/authorization]

**Scenario Inventory table:**
| # | Scenario | Type | Risk | Preconditions | Evidence |
|---|----------|------|------|---------------|----------|
| 1 | [Happy path description] | [Auto/Manual] | Low | [Setup summary] | [Expected output/state] |
| 2 | [Edge case description] | [Auto/Manual] | Med | [Setup summary] | [Error message/state] |
| 3 | [Error scenario] | [Auto/Manual] | High | [Setup summary] | [Error response/log] |

**Scenarios:** Each with Preconditions, Steps, Expected Results, Evidence.

### 7. Output Test Plan

Present the Test Plan as **normal rendered Markdown** (not wrapped in a code block). Use the Output Template (linked in SKILL.md references) with Markdown tables and headings. The user will read this inline; it will be included in the final combined output after approval.

### 8. Quality Gate Self-Review

- Every business rule has at least one test scenario
- ZOMBIES coverage is adequate
- Project-specific checklist items addressed
- Evidence targets are specific and verifiable
- At least one negative/error scenario included

## User Checkpoint

After presenting the Test Plan as normal rendered Markdown, ask the user to confirm:

- **Summary message**: "Test plan complete with {N} scenarios covering {M} business rules. Quality gate verified."
- **Ask the user** (header: `Phase 4`, question: "Test plan output ready. How would you like to proceed?"):
  - **Approve & finish** (recommended) — Planning workflow complete, output ready to paste
  - **Revise test plan** — User provides feedback, regenerate output

## Next Steps

After user approves, proceed to **Step 9: Final Combined Output**.

### 9. Final Combined Output

After the user approves the test plan, produce a **single 4-backtick fenced code block** containing **all three deliverables** combined:

1. **Business Rules Analysis** (from Phase 2)
2. **Architecture** (from Phase 3)
3. **Test Plan** (from Phase 4)

Use the structure from the [Output Template](../references/work-item-template.md). Inside this code block:
- Mermaid diagrams use standard fenced `` ```mermaid `` blocks (for portability in the target work tracking tool)
- All tables, headings, and sections are in Markdown format
- The block uses **4-backtick fences** (``````) so inner fenced blocks nest correctly

This is the **only code block** in the entire workflow. Present it with a brief message: "Here is the complete planning output ready to copy into your work tracking tool."

After producing the combined output, the planning workflow is complete. If an implementation workflow exists in your environment, proceed with it.

### 10. Review Reminder

After the final output, remind the user of the two-step review process:

> **After implementation**, Copilot will automatically self-review the changes against the project's review criteria and fix any critical/warning issues before presenting the work.
>
> For deeper coverage with multiple AI models, run the `/review` command with the models listed in `.github/config/review-models.md`.
> Then ask Copilot to synthesize the findings into a prioritized report.
