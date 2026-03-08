---
description: Code review criteria and standards — applied automatically during /review passes
---

# Code Review Standards

When reviewing code, evaluate every changeset against these criteria and severity levels.

## Review Criteria

### 1. Correctness & Logic
- Does the code do what it claims to do?
- Are there logic errors, off-by-one errors, or incorrect conditions?
- Are return values and error states handled correctly?
- Are edge cases covered (null, empty, zero, boundary values)?

### 2. Security
- Are there injection vulnerabilities (SQL, XSS, command injection)?
- Is user input validated and sanitized?
- Are secrets/credentials handled safely (no hardcoding, proper env vars)?
- Are authorization checks present where needed?
- Are there race conditions or TOCTOU vulnerabilities?

### 3. Performance
- Are there unnecessary allocations, loops, or database calls?
- Are N+1 query patterns present?
- Is caching used appropriately (or missing where needed)?
- Are there blocking operations that should be async?

### 4. Error Handling
- Are errors caught and handled gracefully?
- Are error messages informative without leaking internals?
- Are transactions/rollbacks handled correctly?
- Is there proper cleanup in failure paths (resources, connections)?

### 5. Design & Architecture
- Does the change follow existing project patterns?
- Is the responsibility clearly assigned (no god objects/functions)?
- Are abstractions appropriate (not over- or under-engineered)?
- Are dependencies reasonable and well-directed?

### 6. Maintainability
- Is the code readable and self-documenting?
- Are names clear and consistent with the project's conventions?
- Are there magic numbers or unclear constants?
- Is test coverage adequate for the change?

### 7. Breaking Changes & Compatibility
- Does this break existing APIs, contracts, or behavior?
- Are migrations or data changes backward-compatible?
- Are deprecations properly signaled?

## Severity Levels

Classify each finding:

| Severity | Meaning | Action |
|----------|---------|--------|
| 🔴 **Critical** | Bug, security vulnerability, data loss risk | Must fix before merge |
| 🟠 **Warning** | Performance issue, design concern, missing validation | Should fix before merge |
| 🟡 **Suggestion** | Improvement, readability, minor optimization | Consider for this or future PR |
| ℹ️ **Note** | Observation, question, or discussion point | No action required |
