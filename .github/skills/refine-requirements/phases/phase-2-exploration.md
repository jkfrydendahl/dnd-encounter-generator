# Phase 2: Codebase Exploration & Questions

**Goal**: Understand existing code patterns, discover business rules, consult references, ask clarifying questions.

> **Critical rule**: Clarifying questions and the phase transition gate must **never** be combined in the same prompt. The user must see the updated Business Rules output before being asked to proceed.

## Stage A: Research

### 1. Explore Codebase

Search the codebase for relevant patterns. Launch **parallel** searches for independent queries:

- Search for similar modules/components matching feature keywords
- Find event/hook patterns: middleware, interceptors, observers, event handlers
- Find integration points with external services or shared modules
- List directory structure for feature areas

### 2. Consult References

Gather guidance on patterns, APIs, error handling, and validation approaches from:
- Project documentation and existing patterns
- External reference sources (configured via `/reference-lookup` skill)
- Framework/library documentation
- Industry best practices

### 3. Read Key Files

Read implementation details of discovered files to understand patterns and conventions.

## Stage B: Clarify (loop)

This stage loops until the user confirms the Business Rules are finalized.

### 4. Draft Business Rules Table

Map discovered rules with relevant columns:

| Rule # | Business Rule | Source | Hook Point? | Existing Pattern? | Clarification? |
|--------|---------------|--------|-------------|-------------------|----------------|
| 1 | ... | Requirements | Middleware | No | No |
| 2 | ... | Code | Event handler | Yes — auth module | Yes — edge case |
| 3 | ... | Reference | Validation | Yes | No |

Present this draft to the user.

### 5. Ask Clarifying Questions

Ask the user clarifying questions with project-specific focus. These questions should be about the **requirements and design**, not about proceeding.

**Standard Questions:**
- "Does this need to integrate with existing middleware/hooks/event systems?"
- "Should other modules be able to override or extend this behavior?"
- "Will this affect data persistence or require schema migrations?"
- "Are there authorization/permission considerations?"
- "Should this support multi-tenant or multi-environment scenarios?"
- "Are there performance requirements (caching, pagination, rate limiting)?"
- "What error handling strategy should be used (fail fast, graceful degradation, retry)?"

Reference specific patterns found through codebase exploration and reference guidance.

### 6. Incorporate Answers & Re-present Business Rules

After the user answers clarifying questions:

1. **Update** the Business Rules table — add/modify/remove rules based on answers
2. **Re-present** the updated Business Rules table to the user
3. Ask the user if more clarification is needed:

- **Ask the user** (header: `Clarify`, question: "I've updated the business rules based on your answers. Are the business rules complete?"):
  - **Business rules are complete** (recommended) — Finalize and proceed to output
  - **I have corrections** — User provides corrections, loop back to step 6
  - **Ask me more questions** — Agent asks additional questions, loop back to step 5

**Loop** back to step 5 or 6 as needed until the user confirms the business rules are complete.

## Stage C: Output & Transition

### 7. Output Final Business Rules

Present the finalized Business Rules as **normal rendered Markdown** (not wrapped in a code block). The user will read this inline; it will be included in the final combined output at the end of Phase 4.

Use this structure:

> **Business Rules Analysis**
>
> | Rule # | Business Rule | Source | Hook Point? | Existing Pattern? |
> |--------|---------------|--------|-------------|-------------------|
> | 1 | ... | Requirements | ... | ... |
> | 2 | ... | Code | ... | ... |
>
> **Technical Domains:** [list from Phase 1]
> **Reference Guidance:** Sources consulted - key insights: [summary]

### 8. Transition Gate

**Only after** the final Business Rules have been presented, use a **separate** prompt to gate the transition:

- **Ask the user** (header: `Phase 2`, question: "Business rules analysis complete. Ready to proceed to architecture design?"):
  - **Proceed to Architecture** (recommended) — Continue to Phase 3
  - **Revise business rules** — Go back to Stage B

Do **not** proceed to Phase 3 until the user selects an option.
