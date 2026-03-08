---
name: refine-requirements
description: "Requirements refinement workflow. Produce architecture + test plan as Markdown output."
---

# Work Item Refinement

4-phase workflow for analyzing work items and producing architecture designs + test plans. During the workflow, deliverables are rendered as normal Markdown with visual Mermaid diagrams. After approval, a single combined code block is produced for the user to copy into their work tracking tool.

> **Note**: This skill handles planning only. For implementation, use your implementation workflow after planning is complete.

## Invocation

| Command | Action |
|---------|--------|
| `/refine-requirements` | Start — prompts user for requirements text |
| `/refine-requirements <inline text>` | Start with the provided requirements text |

## Input

The skill takes requirements as plain text. If the user does not provide text inline, ask for:
1. **Requirements** (full requirements text — free-form input)

## Output

During the workflow (Phases 1-4), all deliverables are presented as **normal rendered Markdown** so the user can read them inline. Render Mermaid diagrams visually when the environment supports it; otherwise present as fenced code blocks.

Only **after Phase 4 approval**, a single **4-backtick fenced code block** is produced containing **all three deliverables** (Business Rules + Architecture + Test Plan) ready for the user to copy into their work tracking tool. Inside this final code block, Mermaid diagrams use standard `` ```mermaid `` fences (for portability in the target tool).

| Deliverable | During Workflow | Final Combined Output |
|-------------|-----------------|----------------------|
| Business Rules Analysis | Normal Markdown (Phase 2) | Included |
| Architecture | Normal Markdown + Mermaid diagrams (Phase 3) | Included (with `` ```mermaid `` fences) |
| Test Plan | Normal Markdown (Phase 4) | Included |

## Exploration & Research

**Use whatever search and exploration tools your environment provides.** The key principles:

- **Parallelize** independent searches — don't explore sequentially when you can search multiple areas simultaneously
- **Delegate** complex research to subagents when available; otherwise perform multi-file analysis directly
- **Render** Mermaid diagrams visually when the environment supports it; otherwise present as fenced code blocks
- **Prefer** broad codebase search over targeted text search for discovery tasks

## Phase Overview

| Stage | Phases | Mode | Primary Focus |
|-------|--------|------|---------------|
| **Discovery** | 1-2 | Read-only | Requirements analysis, codebase exploration, research |
| **Planning** | 3-4 | Design | Architecture design, test plan creation |

## Workflow Phases

- [Phase 1: Discovery](./phases/phase-1-discovery.md) - Understand requirements
- [Phase 2: Exploration](./phases/phase-2-exploration.md) - Explore codebase, ask questions
- [Phase 3: Architecture](./phases/phase-3-architecture.md) - Design approach, output architecture
- [Phase 4: Test Plan](./phases/phase-4-test-plan.md) - Write test plan, output combined deliverable

## Argument Detection

| Pattern | Type | Action |
|---------|------|--------|
| `/refine-requirements <text>` | Inline text | Start Phase 1 with provided text |
| `/refine-requirements` (no argument) | No input | Prompt user for requirements text, then start Phase 1 |

### Starting a Refinement

1. Get work item text from user (inline or prompted)
2. Create task list for 4 phases
3. Begin [Phase 1](./phases/phase-1-discovery.md)

## Task List Structure

When starting new workflow, create tasks:

```
[Phase 1] Discovery - Understand requirements
[Phase 2] Exploration - Explore patterns, ask questions
[Phase 3] Architecture - Design approach, output as Markdown
[Phase 4] Test Plan - Write test cases, output as Markdown
```

## Related Resources

- Project documentation and existing patterns
- External reference sources (via `/reference-lookup` skill)

## Terminology Quick Reference

| Generic Term | Common Equivalents |
|--------------|-------------------|
| Component | Module, Package, Service, Class, Object |
| Data Model | Schema, Table, Entity, Model, Type |
| Factory | Builder, Creator, Library helper |
| Unit Test | Test case, Spec, Test procedure |
| Test Suite | Test module, Test class, Test file |
| Hook/Event | Middleware, Interceptor, Observer, Listener, Event handler |
| Interface | Protocol, Trait, Contract, Abstract class |
| Enum | Union type, Const, Variant |

## References

- [Output Template](./references/work-item-template.md) - Markdown template structure for planning output

## Next Steps

After completing all 4 phases and the user approves, the final combined output code block will contain:
- Business Rules Analysis
- Architecture decisions and component overview
- Test plan with scenarios

Copy the single Markdown code block into your work tracking tool. If an implementation workflow exists in your environment, proceed with it after planning is complete.

## Quality Gate (Required)

- Every business rule maps to at least one test scenario
- Architecture section is present and complete in the output
- Test plan includes at least one negative/error scenario
- Each scenario defines steps, expected results, and evidence
