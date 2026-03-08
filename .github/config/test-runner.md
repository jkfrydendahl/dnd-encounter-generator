# Test Runner Configuration

Defines how tests are executed for this project. Copilot reads this file during TDD implementation to determine the correct test commands.

## Mode

**Local** — Tests run directly on the host machine.

<!-- Change to Docker mode by uncommenting below and commenting out the Local section:

## Mode

**Docker** — Tests run inside a Docker container using `docker compose`.

## Commands

| Action | Command |
|--------|---------|
| Run all tests | `docker compose -f docker/docker-compose.test.yml run --rm test` |
| Run with coverage | `docker compose -f docker/docker-compose.test.yml run --rm test-coverage` |
| Stop environment | `docker compose -f docker/docker-compose.test.yml down` |

## Prerequisites

- Docker installed and running
- `docker/docker-compose.test.yml` configured for your stack (see `docker/examples/`)
-->

## Commands

| Action | Command |
|--------|---------|
| Run all tests | `npm test` |
| Run specific test file | `npm test -- [file]` |
| Run with coverage | `npm run coverage` |

## Notes

Replace the commands above with your project's actual test commands. Common examples:

| Stack | Test Command | Coverage Command |
|-------|-------------|-----------------|
| Node.js | `npm test` | `npm run coverage` |
| Python | `pytest` | `pytest --cov=src` |
| .NET | `dotnet test` | `dotnet test --collect:"XPlat Code Coverage"` |
| Go | `go test ./...` | `go test -cover ./...` |
| Rust | `cargo test` | `cargo tarpaulin` |
| AL/BC | See `docker/examples/al-bc.yml` | Via AL Test Runner |

## Docker Setup

To switch to Docker-based test execution:

1. Copy an example from `docker/examples/` to `docker/docker-compose.test.yml`
2. Customize the image, commands, and volumes for your project
3. Switch this file to Docker mode (see commented section above)
4. Verify with: `docker compose -f docker/docker-compose.test.yml run --rm test`
