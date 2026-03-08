# Phase 2: Implementation

**Goal**: Implement the feature using Red-Green-Refactor TDD.

## Three Laws of TDD (Robert C. Martin)

These three laws govern every RED-GREEN-REFACTOR cycle:

| Law | Rule | What This Means |
|-----|------|-----------------|
| **Law 1** | No production code without a failing test first | Never create production code before the test that requires it exists and fails |
| **Law 2** | Write only enough test to fail (compile/type error = failure) | Stop writing the test as soon as it fails |
| **Law 3** | Write only enough production code to pass the current test | Write the MINIMUM code. Do not implement logic for future scenarios |

## ZOMBIES-Driven Ordering

Process scenarios in the order they appear in the Scenario Inventory (which follows ZOMBIES progression from planning). Each scenario forces the next minimal increment of production code:

- **Z/O scenarios**: Expect simple, straight-line code (no loops, no complex branching)
- **M scenarios**: Expect loops and aggregation to emerge
- **B scenarios**: Expect boundary checks and validation to emerge
- **I scenarios**: Expect interface contracts and integration points to emerge
- **E scenarios**: Expect error handling and guard clauses to emerge

Do NOT reorder scenarios without documenting why. The order is intentional — it ensures design emerges incrementally.

## Implementation Loop

### Pre-Flight (Required)

1. **Read test runner config**: Check `.github/config/test-runner.md` for the project's test execution mode (Local or Docker) and commands. Use these commands for all test execution throughout this phase.
2. Confirm no temporary debug/logging artifacts exist at task start.
3. Verify the project builds and existing tests pass using the configured test command.
4. If Docker mode: verify Docker is running and the test container starts successfully.

### For Each Scenario (or batch of related scenarios):

### RED Phase

1. **Write a failing test** (Law 1: test first. Law 2: stop at first failure):

   ```
   // Test structure (adapt to your language/framework):
   // [SCENARIO] Description
   // [GIVEN] Setup/preconditions
   // [WHEN] Action under test
   // [THEN] Expected outcome
   ```

2. **Run the project's test command** — the new test should FAIL (RED).

3. If the test passes without writing production code, the test is not testing new behavior — revise it.

### GREEN Phase

1. **Implement minimum code to pass** the currently failing test (Law 3: nothing more).
   - If this is a Z or O scenario, the production code should be trivially simple
   - If this is an M scenario, a loop may now emerge — this is expected
   - If you realize the next scenario needs something, do NOT add it yet

2. **Run the project's test command** — all tests should PASS (GREEN).

3. **Verify execution** — confirm the test actually exercised the intended code path:
   - Check code coverage for the relevant lines/branches
   - Or use temporary logging to verify the path, then note it for cleanup
   - Or verify via test spies/mocks that expected functions were called

### REFACTOR Phase

1. **Clean up code** — improve naming, extract methods, reduce duplication.

2. **Remove ALL temporary artifacts** — debug logs, temporary assertions, print statements.

3. **Run the project's test command** — all tests still pass.

4. **Commit** the completed scenario with a descriptive message.

## Progress Tracking

After each scenario completes:

1. **Update PR progress table:**
   ```markdown
   | 1 | Scenario 1 | [x] | [x] | [x] | Complete |
   ```

2. **Add a brief PR comment** documenting what was implemented.

## Batching Strategy

Group related scenarios that:
- Test the same function/method
- Share similar setup
- Have sequential dependencies

Max 5 scenarios per batch. Document batching decisions.

## Progress Table States

| Red | Green | Refactor | Status | Meaning |
|-----|-------|----------|--------|---------|
| [ ] | [ ] | [ ] | Not started | No work begun |
| [x] | [ ] | [ ] | In progress | Test written and failing |
| [x] | [x] | [ ] | In progress | Implementation complete, test passing |
| [x] | [x] | [x] | Complete | Code cleaned, artifacts removed |

## Success Criteria

- All scenarios are marked Complete in the progress table.
- All tests pass.
- No temporary debug/logging artifacts remain.
- Progress updates are recorded in the PR.
