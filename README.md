# McpKit

## Development

### Commit Message Format

This project enforces conventional commit message format using a pre-commit hook. All commit messages must follow this pattern:

```
<type>(<scope>): <description>
```

**Required Components:**

- **Type**: One of the following conventional commit types:

  - `feat` - New feature
  - `fix` - Bug fix
  - `chore` - Maintenance tasks
  - `docs` - Documentation changes
  - `style` - Code style changes (formatting, etc.)
  - `refactor` - Code refactoring
  - `test` - Adding or updating tests
  - `ci` - CI/CD changes
  - `perf` - Performance improvements
  - `build` - Build system changes
  - `revert` - Reverting previous commits

- **Scope** (optional): Must be one of the actual package names in this project:

  - `cli` - CLI package
  - `core` - Core package (@mcpkit/core)
  - `server` - Server package
  - `transport-stdio` - Transport stdio package

  Multiple scopes can be specified separated by commas: `feat(cli, server): description`

- **Description**: Brief description of the change (minimum 3 characters, Russian/English acceptable)

**Examples of valid commit messages:**

```bash
feat(core): добавить новую функцию X
fix(cli, server): исправить ошибку Y
chore: обновить dev-зависимости
docs(transport-stdio): update API documentation
test(core): add unit tests for validation
```

**Examples of invalid commit messages:**

```bash
# Missing conventional format
"just some changes"

# Invalid type
"update(core): some changes"

# Invalid scope
"feat(invalid-package): some feature"

# Description too short
"feat(core): ab"
```

The commit message validation is automatically enforced by a git hook. If your commit message doesn't follow the required format, the commit will be rejected with a helpful error message.

## TODO

- let's use another convention for test files:
  test files should be placed with implementation file in same folder
- add changelog
