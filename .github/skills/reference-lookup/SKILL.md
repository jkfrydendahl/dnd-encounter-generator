---
name: reference-lookup
description: "Locate canonical behavior, patterns, APIs, and implementations in external codebases and documentation. Use when you need standard behavior, event signatures, reference implementations, or best practices."
---

# Reference Lookup

Use configured reference sources to locate patterns, APIs, implementations, and best practices. The focus is on *what* to find and *how to reason about it*, keeping the procedure tool-agnostic.

## When to Use

- Finding patterns to follow (e.g., "How does the framework handle authentication?")
- Understanding standard implementations (e.g., "How does library X implement caching?")
- Locating test patterns (e.g., "How do tests set up database fixtures in this ecosystem?")
- Finding API implementations (e.g., "How does the standard REST API handle pagination?")
- Discovering data models and their purposes
- Learning how a reference project implements a specific feature

## What You Need

- Target domain or topic
- Object/function/pattern name you're investigating
- Optional: specific API endpoint or event name if already known

## Procedure

### Step 1: Identify Reference Sources

Check `references/sources.md` for configured reference repositories, documentation URLs, and API specs relevant to the current project.

### Step 2: Search Reference Sources

Search the configured repos or documentation using object/function/pattern names. Narrow by domain paths when possible. Your goal is to find the exact file or section that defines the behavior or publishes the event/hook.

### Step 3: Inspect Implementation

Open the candidate file/section and confirm:
- The component declaration (name, type, exports)
- The hook/event/middleware signature (if relevant)
- The implementation flow surrounding the behavior

### Step 4: Cross-Check Documentation

Use official documentation to confirm syntax, concepts, and best practices that contextualize what you found in source.

## Outputs / Success Criteria

- File path(s) or documentation URL(s)
- Component/function name and signature
- Hook/event/middleware signature and location
- A recommended integration point or reference pattern

## Delegated Exploration (Optional)

For open-ended questions, delegate research to a subagent or background task with a focused brief:

```
Search [reference source] for [topic]. Identify candidate files, inspect implementations, and report back with relevant patterns, APIs, and example locations.
```

## References

- [Sources Configuration](./references/sources.md) - Reference sources for the current project
- [Search Patterns](./references/search-patterns.md) - Tool-agnostic search heuristics
