# Mnemo Plugin API Reference

This guide covers everything you need to build plugins for Mnemo.

## Plugin Structure

Every plugin lives in its own directory under `plugins/`:

```
plugins/my-plugin/
  manifest.json       # Required: plugin metadata
  server/
    index.ts          # Optional: server-side entry point (TypeScript, built to CJS)
  client/
    index.ts          # Optional: client-side entry point (TypeScript, built to ESM)
```

Plugins are written in TypeScript. The build step (`npm run build`) compiles `.ts` files to `.js` using esbuild. Type definitions are available in `types/server.d.ts` and `types/client.d.ts`.

A plugin must have at least one entry point (server, client, or both).

---

## Manifest Format

The `manifest.json` file describes your plugin:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": "Your Name",
  "minMnemoVersion": "2.0.0",
  "server": "server/index.js",
  "client": "client/index.js",
  "settings": [
    {
      "key": "enabled",
      "type": "boolean",
      "default": true,
      "label": "Enable this feature",
      "perUser": true
    }
  ]
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, must match directory name |
| `name` | string | Human-readable display name |
| `version` | string | Semver version string |
| `description` | string | Brief description of what the plugin does |
| `author` | string | Plugin author name |
| `minMnemoVersion` | string | Minimum Mnemo version required |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `server` | string | Path to server entry point (relative to plugin dir) |
| `client` | string | Path to client entry point (relative to plugin dir) |
| `settings` | array | Plugin settings declarations |

### Settings

Each setting object has:

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Setting identifier |
| `type` | string | `"boolean"`, `"string"`, `"number"`, `"select"` |
| `default` | any | Default value |
| `label` | string | Display label in settings UI |
| `perUser` | boolean | If true, each user can override this setting. If false, admin-only. |
| `options` | array | For `"select"` type: `[{ "value": "a", "label": "Option A" }]` |

---

## Server-Side API

Server plugins are written in TypeScript and must export `activate(api)` and `deactivate()`. They are compiled to CommonJS by esbuild.

```typescript
import type { PluginAPI } from '../../../types/server';

export function activate(api: PluginAPI): void {
  // Plugin initialization
}

export function deactivate(): void {
  // Cleanup (optional - PluginManager handles route/event removal)
}
```

### `api.notes`

Access and manipulate notes.

| Method | Description |
|--------|-------------|
| `api.notes.get(userId, path)` | Get a note by user ID and path |
| `api.notes.list(userId, folder?)` | List notes for a user |
| `api.notes.create(userId, path, content)` | Create a new note |
| `api.notes.update(userId, path, content)` | Update an existing note |
| `api.notes.delete(userId, path)` | Delete a note |

### `api.events`

Subscribe to system events.

| Method | Description |
|--------|-------------|
| `api.events.on(event, handler)` | Listen for an event |
| `api.events.off(event, handler)` | Remove an event listener |

**Available Events:**
- `note:afterSave` - Fired after a note is saved. Context: `{ userId, path, content }`
- `note:afterDelete` - Fired after a note is deleted. Context: `{ userId, path }`
- `note:afterCreate` - Fired after a note is created. Context: `{ userId, path, content }`

### `api.routes`

Register custom HTTP endpoints. Routes are prefixed with `/api/plugins/{pluginId}/`.

| Method | Description |
|--------|-------------|
| `api.routes.register(method, path, handler)` | Register a route (`get`, `post`, `put`, `delete`) |

```javascript
api.routes.register("get", "/stats", async (req, res) => {
  res.json({ status: "ok" });
});
```

### `api.storage`

Key-value storage scoped to the plugin.

| Method | Description |
|--------|-------------|
| `api.storage.get(key)` | Get a stored value |
| `api.storage.set(key, value)` | Store a value |
| `api.storage.delete(key)` | Remove a stored value |
| `api.storage.list()` | List all keys |

### `api.database`

Direct database access (use with caution).

| Method | Description |
|--------|-------------|
| `api.database.query(sql, params)` | Execute a SQL query |

### `api.settings`

Access plugin settings.

| Method | Description |
|--------|-------------|
| `api.settings.get(key, userId?)` | Get a setting value |
| `api.settings.set(key, value, userId?)` | Set a setting value |

### `api.search`

Integration with the search system.

| Method | Description |
|--------|-------------|
| `api.search.register(indexer)` | Register a custom search indexer |

### `api.log`

Structured logging scoped to the plugin.

| Method | Description |
|--------|-------------|
| `api.log.info(message)` | Info-level log |
| `api.log.warn(message)` | Warning-level log |
| `api.log.error(message)` | Error-level log |
| `api.log.debug(message)` | Debug-level log |

---

## Client-Side API

Client plugins are written in TypeScript and must export an `activate(api)` function. A `deactivate()` export is recommended for cleanup. They are compiled to ESM by esbuild.

```typescript
import type { ClientPluginAPI } from '../../../types/client';

export function activate(api: ClientPluginAPI): void {
  // Plugin initialization
}

export function deactivate(): void {
  // Cleanup
}
```

### `api.ui`

Register UI components in designated slots.

#### UI Slots

| Slot | Registration Method | Description |
|------|---------------------|-------------|
| sidebar | `api.ui.registerSidebarItem(Component, opts)` | Sidebar panel item |
| statusbar-left | `api.ui.registerStatusBarItem(Component, { position: 'left', ... })` | Left status bar |
| statusbar-right | `api.ui.registerStatusBarItem(Component, { position: 'right', ... })` | Right status bar |
| editor-toolbar | `api.ui.registerEditorToolbarButton(Component, opts)` | Editor toolbar button |
| pages | `api.ui.registerPage(path, Component)` | Custom full-page route |
| note-actions | `api.ui.registerNoteAction(Component, opts)` | Note context menu actions |
| settings-section | `api.ui.registerSettingsSection(Component, opts)` | Plugin settings panel |

Options typically include `id` (string) and `order` (number for positioning).

### `api.editor`

Extend the CodeMirror editor.

| Method | Description |
|--------|-------------|
| `api.editor.registerExtension(extension)` | Add a CodeMirror 6 extension |

```javascript
// Example: add vim keybindings
const { vim } = window.__mnemoPluginDeps;
api.editor.registerExtension(vim());
```

### `api.markdown`

Extend markdown rendering.

| Method | Description |
|--------|-------------|
| `api.markdown.registerPlugin(remarkPlugin)` | Add a remark plugin |
| `api.markdown.registerRehypePlugin(rehypePlugin)` | Add a rehype plugin |

### `api.commands`

Register keyboard commands.

| Method | Description |
|--------|-------------|
| `api.commands.register(id, opts)` | Register a command with keybinding |

```javascript
api.commands.register("my-plugin:do-thing", {
  label: "Do Thing",
  keybinding: "Ctrl-Shift-T",
  run: () => { /* ... */ },
});
```

### `api.context`

Access app context and plugin settings from React components.

| Method | Description |
|--------|-------------|
| `api.context.usePluginSettings(key)` | React hook to read a plugin setting |
| `api.context.useCurrentNote()` | React hook to get the current note |
| `api.context.useCurrentUser()` | React hook to get the current user |

### `api.api`

Make authenticated API calls to the Mnemo backend.

| Method | Description |
|--------|-------------|
| `api.api.fetch(path, options)` | Fetch from plugin's API endpoint (auto-prefixed) |

### `api.notify`

Show toast notifications.

| Method | Description |
|--------|-------------|
| `api.notify.success(message)` | Green success toast |
| `api.notify.error(message)` | Red error toast |
| `api.notify.info(message)` | Blue info toast |

---

## Client Plugin Dependencies

Client plugins can access shared dependencies via `window.__mnemoPluginDeps` (typed in `types/client.d.ts`):

```typescript
const { React, vim, getCM } = window.__mnemoPluginDeps;
const { createElement: h, useState, useEffect } = React;
```

Available dependencies:
- `React` - React library
- `vim` - CodeMirror vim extension (`@replit/codemirror-vim`)
- `getCM` - Helper to get the CodeMirror 5 compatibility layer from a CM6 EditorView

---

## Lifecycle

1. **Install**: Plugin files are copied to the Mnemo server's plugin directory
2. **Activate**: `activate(api)` is called with the plugin API
3. **Runtime**: Plugin is active, handling events and rendering UI
4. **Deactivate**: `deactivate()` is called during shutdown or uninstall
5. **Uninstall**: Plugin files are removed

---

## Example: Minimal Plugin

A simple plugin that adds a status bar item showing the current time.

**manifest.json:**
```json
{
  "id": "clock",
  "name": "Clock",
  "version": "1.0.0",
  "description": "Shows current time in the status bar",
  "author": "Example",
  "minMnemoVersion": "2.0.0",
  "client": "client/index.js"
}
```

**client/index.ts:**
```typescript
import type { ClientPluginAPI } from '../../../types/client';

const { React } = window.__mnemoPluginDeps;
const { createElement: h, useState, useEffect } = React;

let interval: ReturnType<typeof setInterval> | undefined;

export function activate(api: ClientPluginAPI): void {
  function Clock(): any {
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    useEffect(() => {
      interval = setInterval(() => {
        setTime(new Date().toLocaleTimeString());
      }, 1000);
      return () => clearInterval(interval);
    }, []);
    return h("span", { className: "text-xs text-gray-400" }, time);
  }

  api.ui.registerStatusBarItem(Clock, {
    id: "clock",
    position: "right",
    order: 99,
  });
}

export function deactivate(): void {
  if (interval) clearInterval(interval);
}
```
