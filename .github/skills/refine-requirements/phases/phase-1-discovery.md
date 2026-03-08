# Phase 1: Discovery

**Goal**: Understand what needs to be built from the provided requirements, load project context, and identify affected areas.

## Actions

1. **Load project context**: Review repository conventions (README, CONTRIBUTING, docs, internal guidelines). Parallelize multiple searches when looking for different types of context.

2. **Gather requirements**: If requirements text was not provided inline, ask the user for:
   - **Requirements**: Full requirements text (free-form input)

3. **Identify project areas affected**:
   Based on repository context, identify which modules/features are impacted.

   _Example checklist (adapt to current project):_
   - [ ] Core domain functionality
   - [ ] API layer (endpoints, contracts)
   - [ ] Data layer (schemas, migrations, models)
   - [ ] UI components
   - [ ] Business rules / validation
   - [ ] Infrastructure / configuration
   - [ ] Integration with external services

4. **Identify technical domains affected**:
   - [ ] Authentication / Authorization
   - [ ] Data persistence / Storage
   - [ ] API / Communication
   - [ ] Background processing / Jobs
   - [ ] Caching
   - [ ] Logging / Monitoring
   - [ ] Testing infrastructure
   - [ ] CI/CD / Deployment
   - [ ] Other: ___

5. **Identify likely component types**:
   - [ ] New modules / packages / services
   - [ ] New data models / schemas / migrations
   - [ ] New API endpoints / routes
   - [ ] New UI components / pages
   - [ ] Event handlers / middleware / hooks
   - [ ] Interfaces / contracts / types
   - [ ] Configuration / environment variables
   - [ ] Tests

6. **Initial file discovery** (optional): Search for files matching feature keywords. Launch parallel searches for different keyword groups.

7. **Present summary**:
   - Key requirements summary
   - Project areas affected
   - Technical domains affected
   - Component types likely needed

## User Checkpoint

Present the discovery summary, then ask the user to gate the transition:

- **Summary message**: "I've analyzed the requirements in context of the repository. Here's my understanding: [summary]. Affected areas: [list]. Technical domains: [list]."
- **Ask the user** (header: `Phase 1`, question: "Discovery complete. How would you like to proceed?"):
  - **Proceed to Exploration** (recommended) — Continue to Phase 2
  - **Revise summary** — User provides corrections, redo summary

Do **not** proceed to Phase 2 until the user selects an option.
