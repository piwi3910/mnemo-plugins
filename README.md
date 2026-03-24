# Mnemo Plugins

[![Plugin CI](https://github.com/piwi3910/mnemo-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/piwi3910/mnemo-plugins/actions/workflows/ci.yml)

Official plugin registry for [Mnemo](https://github.com/piwi3910/mnemo), a self-hosted knowledge base.

## Available Plugins

| Plugin | Description |
|--------|-------------|
| **vim-mode** | Adds Vim keybindings to the editor with toggle, mode indicator, and command bar |
| **sample-wordcount** | Displays word count statistics for notes via a custom API endpoint |

## Installing Plugins

Plugins are installed through the Mnemo Admin Dashboard:

1. Go to **Admin > Plugins > Browse Registry**
2. Search for a plugin
3. Click **Install**

Plugins can also be managed via the admin API endpoints.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/piwi3910/mnemo-plugins.git
cd mnemo-plugins

# Install dependencies
npm install
```

## Running Validation Locally

```bash
# Lint all plugin JS files
npm run lint

# Validate registry.json and all manifests
npm run validate

# Test plugin syntax and exports
npm run test

# Fix linting issues automatically
npm run lint:fix
```

All three checks must pass before a PR can be merged.

## Plugin Structure

Each plugin is a directory under `plugins/` with:

```
plugins/{id}/
  manifest.json       # Plugin metadata and settings declarations
  server/
    index.js          # Backend entry point (optional, CommonJS)
  client/
    index.js          # Frontend entry point (optional, ESM)
```

## Creating a New Plugin

1. Copy the template: `cp -r templates/plugin-template plugins/my-plugin`
2. Edit `manifest.json` with your plugin details
3. Implement your server and/or client entry points
4. Add your plugin to `registry.json`
5. Run all checks: `npm run lint && npm run validate && npm run test`

## Documentation

- [Plugin API Reference](docs/PLUGIN_API.md) -- full API documentation for server and client plugins
- [Contributing Guide](docs/CONTRIBUTING.md) -- how to add a plugin, PR workflow, and code style

## Developing Plugins

See the [Plugin Ecosystem Design Spec](https://github.com/piwi3910/mnemo/blob/master/docs/superpowers/specs/2026-03-23-plugin-ecosystem-design.md) for the full architecture and design specification.
