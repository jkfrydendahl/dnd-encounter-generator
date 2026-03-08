# Search Patterns (Tool-Agnostic)

These patterns describe *what to search for* and *what to expect*. Use any repository search or browsing method available to you.

## Find Components / Modules

- Search for: component name or class name
- Scope: source directories (`src/`, `lib/`, `packages/`)
- Expect: the component declaration, exports, and key methods

## Find Hooks / Events / Middleware

- Search for: hook name, event name, or middleware identifier
- Scope: core framework or feature directories
- Expect: handler registration, signature, and execution context

- Search for: decorator/attribute patterns (e.g., `@EventHandler`, `@Middleware`, `@Subscribe`)
- Expect: annotated functions with clear signatures

## Find Data Models / Schemas

- Search for: model name, table name, or schema definition
- Scope: models/schemas directories
- Expect: field definitions, relationships, constraints, and validations

## Find Tests and Test Utilities

- Search for: test helper or fixture name (e.g., `createTestUser`, `setupDatabase`)
- Scope: test directories (`tests/`, `__tests__/`, `spec/`, `test/`)
- Expect: helper functions for test setup that can be reused

- Search for: test file for a specific feature
- Expect: test patterns showing how the feature is exercised

## Find API Endpoints / Routes

- Search for: route path or controller name
- Scope: routes/controllers directories
- Expect: endpoint definitions, request/response handling, middleware chain

## Find Configuration / Environment

- Search for: config key or environment variable name
- Scope: config files, `.env.example`, setup scripts
- Expect: default values, validation, and usage context

## Workflow Tip

Start from known component or function names, then narrow by directory path. Once you find a candidate file, confirm the exact declaration and signature before deciding where to hook or replicate behavior.

## Cross-Referencing

When investigating a pattern:
1. Find the **definition** (where it's declared)
2. Find the **usages** (where it's consumed/called)
3. Find the **tests** (how it's verified)

This three-point approach gives you confidence in both the pattern's intent and its actual behavior.
