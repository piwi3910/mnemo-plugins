# Contributing to Mnemo Plugins

Thank you for your interest in contributing plugins to Mnemo! This guide covers how to add a new plugin to the registry.

## Prerequisites

- Node.js 24+
- npm
- Git
- A working knowledge of JavaScript (CommonJS for server, ESM for client)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/piwi3910/mnemo-plugins.git
   cd mnemo-plugins
   npm install
   ```

2. **Copy the plugin template:**
   ```bash
   cp -r templates/plugin-template plugins/my-plugin
   ```

3. **Edit the manifest:**
   Update `plugins/my-plugin/manifest.json` with your plugin's details. The `id` field must match the directory name.

4. **Implement your plugin:**
   - Server plugins: edit `server/index.js` (CommonJS - use `exports.activate`)
   - Client plugins: edit `client/index.js` (ESM - use `export function activate`)
   - You can have both, or just one

5. **Add to the registry:**
   Add your plugin entry to `registry.json`:
   ```json
   {
     "id": "my-plugin",
     "name": "My Plugin",
     "description": "What it does",
     "author": "Your Name",
     "version": "1.0.0",
     "minMnemoVersion": "2.0.0",
     "tags": ["category"],
     "icon": "icon-name"
   }
   ```

## Directory Structure

```
plugins/my-plugin/
  manifest.json           # Required: plugin metadata
  server/
    index.js              # Optional: server entry point (CommonJS)
  client/
    index.js              # Optional: client entry point (ESM)
```

## Manifest Requirements

All manifests must include these fields:

| Field | Description |
|-------|-------------|
| `id` | Must match the directory name exactly |
| `name` | Human-readable display name |
| `version` | Semver version (must match the version in `registry.json`) |
| `description` | Brief description |
| `author` | Your name |
| `minMnemoVersion` | Minimum Mnemo version required |

At least one of `server` or `client` entry points must be declared.

## Testing Locally

Run all checks before submitting:

```bash
# Lint all plugin JS files
npm run lint

# Validate registry and manifests
npm run validate

# Test plugin exports and syntax
npm run test
```

Fix any linting issues automatically:

```bash
npm run lint:fix
```

## Code Style

- **Server plugins**: CommonJS (`exports.activate = function(api) { ... }`)
- **Client plugins**: ESM (`export function activate(api) { ... }`)
- Use `const` and `let`, never `var`
- Use strict equality (`===` / `!==`)
- Always use semicolons
- Follow the ESLint rules configured in `eslint.config.js`

## PR Workflow

1. **Create a branch:**
   ```bash
   git checkout -b add-my-plugin
   ```

2. **Make your changes:**
   - Add your plugin directory under `plugins/`
   - Add your plugin entry to `registry.json`
   - Ensure version in manifest matches version in registry

3. **Run all checks:**
   ```bash
   npm run lint && npm run validate && npm run test
   ```

4. **Commit and push:**
   ```bash
   git add plugins/my-plugin registry.json
   git commit -m "feat: add my-plugin"
   git push -u origin add-my-plugin
   ```

5. **Open a Pull Request:**
   - CI will automatically run lint, validate, and test checks
   - All checks must pass before merge
   - Describe what your plugin does in the PR description

## Review Criteria

Pull requests are evaluated on:

- **Correctness**: Plugin passes all validation and tests
- **Quality**: Clean code, follows style guidelines
- **Documentation**: Manifest has accurate description and settings
- **Security**: No access to data outside the plugin's scope
- **Compatibility**: Correct `minMnemoVersion` specified

## Questions?

See the [Plugin API Reference](PLUGIN_API.md) for the full API documentation, or open an issue on the repository.
