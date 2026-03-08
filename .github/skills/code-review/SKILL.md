---
name: code-review-synthesis
description: "Synthesize findings from a multi-model code review into a consolidated, prioritized report. Use after running /review with multiple models."
---

# Review Synthesis

After running a multi-model code review using the models configured in `.github/config/review-models.md`, use this skill to synthesize the independent findings into a single prioritized report.

> **The review criteria and severity levels are defined in `.github/instructions/code-review.instructions.md`** — they are applied automatically during each `/review` pass. This skill handles only the **synthesis** of results across models.

## Why Synthesize?

Different models have different strengths, blind spots, and reasoning styles. Raw output from three models is noisy. The synthesis step is where the real value emerges:
- Findings confirmed by multiple models are high-confidence
- Findings from only one model may reveal blind spots the others missed
- Disagreements between models highlight areas that need human judgment

## Invocation

Run this skill after completing a multi-model review. Use the models and `/review` command from `.github/config/review-models.md`.

Then ask Copilot to synthesize:

```
Synthesize the review findings using the code-review-synthesis protocol.
```

## Review Models

See `.github/config/review-models.md` for the current model list and review command.

## Synthesis Protocol

### 1. Deduplicate
Group findings that describe the same issue. Note which models flagged it.

### 2. Confidence Score
Rate each unique finding by how many models independently identified it:

| Models | Confidence | Interpretation |
|--------|------------|----------------|
| 3/3 | **High** | Very likely a real issue |
| 2/3 | **Medium** | Probably worth addressing |
| 1/3 | **Low** | May be a false positive, or a genuine blind-spot catch — review carefully |

### 3. Prioritize
Sort findings by: Severity (descending) → Confidence (descending) → Category.

### 4. Output Format

Present the synthesized report:

```markdown
## Code Review Summary

**Changeset**: [PR/branch description]
**Models Used**: [List models from .github/config/review-models.md]

### Findings

| # | Severity | Category | Finding | Confidence | Models | File(s) |
|---|----------|----------|---------|------------|--------|---------|
| 1 | 🔴 Critical | Security | [Description] | High (3/3) | All | `src/auth.ts:42` |
| 2 | 🟠 Warning | Performance | [Description] | Medium (2/3) | [Model A], [Model C] | `src/db.ts:88` |
| 3 | 🟡 Suggestion | Design | [Description] | Low (1/3) | [Model B] | `src/service.ts:15` |

### Details

#### Finding 1: [Title]
- **Severity**: 🔴 Critical
- **Category**: Security
- **Confidence**: High (3/3 models)
- **Location**: `src/auth.ts:42`
- **Description**: [What's wrong]
- **Recommendation**: [How to fix]

### Summary
- **Critical**: N findings (must fix)
- **Warning**: N findings (should fix)
- **Suggestion**: N findings (consider)
- **Notes**: N observations
```

## Tips

1. **Pay attention to lone findings** — A single model catching something the others missed is often the most valuable finding.
2. **Use for non-trivial changes** — Simple typo fixes don't need three-model review. Use this for features, refactors, and security-sensitive changes.
3. **Iterate if needed** — After addressing critical/warning findings, you can re-run the review to verify fixes.
