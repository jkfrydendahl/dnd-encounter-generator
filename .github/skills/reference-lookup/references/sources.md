# Reference Sources

Configure reference repositories, documentation, and API specs for your project here. The `/reference-lookup` skill will use these sources when searching for patterns, implementations, and best practices.

## How to Configure

Add entries below for each reference source relevant to your project. Include:
- **Name**: A short identifier
- **Type**: `repo`, `docs`, `api-spec`, or `other`
- **Location**: GitHub repo (owner/repo), URL, or file path
- **Description**: What this source is useful for
- **Key Paths**: Important folders or files within the source (optional)

## Sources

<!-- Add your project-specific reference sources below -->

| Name | Type | Location | Description |
|------|------|----------|-------------|
| _Example: React_ | _repo_ | _facebook/react_ | _React framework source for component patterns_ |
| _Example: MDN_ | _docs_ | _developer.mozilla.org_ | _Web API documentation and standards_ |
| _Example: API Spec_ | _api-spec_ | _docs/openapi.yaml_ | _Project API contract definitions_ |

<!-- Remove the example rows and add your own sources -->

## Key Paths (Optional)

Document important paths within your reference sources for faster lookups:

```
# Example for a framework repo:
# src/core/           — Core framework logic
# src/middleware/      — Middleware implementations
# src/types/          — Type definitions and interfaces
# tests/              — Test patterns and fixtures
# docs/api/           — API documentation
```
