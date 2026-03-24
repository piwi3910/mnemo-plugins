/**
 * Client-side plugin entry point.
 *
 * This file is loaded by Mnemo in the browser.
 * It uses ESM module format.
 *
 * Available API:
 *   api.ui        - Register UI components (sidebar, statusbar, toolbar, pages, etc.)
 *   api.editor    - Register CodeMirror extensions
 *   api.markdown  - Register remark/rehype plugins
 *   api.commands  - Register keyboard commands
 *   api.context   - Access app context and settings (React hooks)
 *   api.api       - Make authenticated API calls
 *   api.notify    - Show toast notifications
 *
 * Shared dependencies available via window.__mnemoPluginDeps:
 *   React, vim, getCM
 */

const { React } = window.__mnemoPluginDeps;
const { createElement: h } = React;

export function activate(api) {
  // Example: register a status bar item
  // function MyStatus() {
  //   return h("span", { className: "text-xs text-gray-400" }, "My Plugin");
  // }
  //
  // api.ui.registerStatusBarItem(MyStatus, {
  //   id: "my-plugin-status",
  //   position: "right",
  //   order: 50,
  // });
}

export function deactivate() {
  // Cleanup timers, listeners, etc.
}
