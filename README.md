# Mnemo Plugins

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

## Plugin Structure

Each plugin is a directory under `plugins/` with:

```
plugins/{id}/
  manifest.json       # Plugin metadata and settings declarations
  server/
    index.js          # Backend entry point (optional)
  client/
    index.js          # Frontend entry point (optional)
```

## Developing Plugins

See the [Plugin Ecosystem Design Spec](https://github.com/piwi3910/mnemo/blob/master/docs/superpowers/specs/2026-03-23-plugin-ecosystem-design.md) for the full Plugin API documentation.
