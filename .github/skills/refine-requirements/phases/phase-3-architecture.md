# Phase 3: Architecture Design

**Goal**: Design **two** concrete architectures (Minimal and Clean/Patterned), present both to the user with a comparison, let them choose, then output the selected design as Markdown.

## Actions

### 1. Consult Reference Guidance

Gather architecture guidance based on:
- Feature description
- Business Rules from Phase 2
- Constraints from clarifications
- Technical Domains from Phase 1

### 2. Get Pattern Guidance

Research design patterns relevant to the feature: facade, repository, strategy, observer, middleware pipeline, event-driven, etc.

### 3. Analyze Existing Patterns

Search the codebase for existing architectural patterns (module structure, dependency injection, layering conventions, public/internal APIs).

### 4. Determine Architecture Criteria

- Feature type (enhancement, new feature, integration, refactor)
- Pattern fit (which design patterns apply)
- Extension/hook design (events, middleware, plugins, interfaces)
- API surface (public vs internal)
- Risk areas (data integrity, security, performance, breaking changes)

### 5. Design Pattern Reference

| Pattern | When to Use | Characteristics |
|---------|-------------|-----------------|
| **Facade** | Public API to subsystem | Single entry point + internal implementation |
| **Repository** | Data access abstraction | Interface + implementation, swappable backends |
| **Strategy** | Multiple algorithm variants | Interface + concrete strategies, runtime selection |
| **Observer/Event** | Decoupled notifications | Publisher + subscribers, async-friendly |
| **Middleware Pipeline** | Cross-cutting concerns | Chain of handlers, composable |
| **Module/Package** | Feature isolation | Self-contained, clear public API |
| **CQRS** | Read/write separation | Command handlers + Query handlers |

### 6. Design Both Architectures

**This is the core step.** Design two complete, concrete architectures — not just counts or trade-off labels. Each design must include:

#### 6a. Minimal Design

Produce all of the following for the Minimal approach:

1. **Component Table** — List every component (new and modified) with columns: Type, Name, Responsibility, Key Interactions
2. **Responsibility Assignments** — For each business rule from Phase 2, state which component handles it and how
3. **Integration Flow** — Which existing hooks/events are used, which new ones (if any) are created
4. **Architecture Diagram** — Mermaid flowchart showing component relationships, data flow, and integration points. Render visually when the environment supports it; otherwise present as a fenced code block.
5. **Design Decisions** — Key choices with rationale (patterns used, API design, error handling, etc.)

#### 6b. Clean/Patterned Design

Produce the same 5 deliverables for the Clean/Patterned approach.

> **Important**: Both designs must be detailed enough that a developer could start implementation from either one. Placeholder values like "X components" or "..." are not acceptable.

### 7. Design Comparison

After both designs exist, present a comparison table. **Every row must reference specific components or decisions from the designs above.**

| Criteria | Minimal | Clean/Patterned |
|----------|---------|-----------------|
| New Modules/Packages | [count] ([list names]) | [count] ([list names]) |
| New Data Models | [count] ([list names]) | [count] ([list names]) |
| New API Endpoints | [count] ([list names]) | [count] ([list names]) |
| New UI Components | [count] ([list names]) | [count] ([list names]) |
| Interfaces/Contracts | [count] | [count] |
| Total Components | [total] | [total] |
| Hook/Event Coverage | [specific: which hooks, middleware, events] | [specific] |
| Testability | [specific: why easy/hard to isolate] | [specific] |
| Extensibility | [specific: what can/cannot be extended] | [specific] |
| Risk | [specific risks] | [specific risks] |

### 8. User Selects Approach

Present both designs (component tables + diagrams) alongside the comparison table so the user sees **what** they are choosing, not just trade-off labels.

Default guidance if user is unavailable:
- Choose **Clean/Patterned** when extensibility, testability, or multiple integration points are required.
- Choose **Minimal** when the change is localized, low risk, and short-lived.

### 9. Output Selected Architecture

After the user selects, present the **selected** design as **normal rendered Markdown** (not wrapped in a code block). Use the Output Template (linked in SKILL.md references) with Markdown tables and headings. Render Mermaid diagrams visually when the environment supports it; otherwise present as fenced code blocks.

The user will read this inline; it will be included in the final combined output at the end of Phase 4.

The output is the selected design from step 6 — do not recreate it from scratch. Expand to full detail if needed:
- Pattern Applied
- Component Overview table (with names, responsibilities, interactions)
- Architecture Diagram (rendered visually when supported; otherwise as fenced code block)
- Design Decisions with rationale

## User Checkpoints

Two gates in this phase:

### Gate 1: Select approach

After presenting **both designs and the comparison table**, ask the user:

- **Ask the user** (header: `Approach`, question: "I've designed both architectures above. Which approach do you prefer?"):
  - **Clean/Patterned** (recommended) — Better structure, extensibility, more testable
  - **Minimal** — Fewer components, faster implementation, lower risk

### Gate 2: Approve architecture output

After presenting the selected Architecture as normal rendered Markdown, ask the user:

- **Ask the user** (header: `Phase 3`, question: "Architecture output ready. How would you like to proceed?"):
  - **Approve & proceed to Test Plan** (recommended) — Continue to Phase 4
  - **Revise architecture** — User provides feedback, regenerate output

Do **not** proceed to Phase 4 until the user approves.
