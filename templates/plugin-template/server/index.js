/**
 * Server-side plugin entry point.
 *
 * This file is loaded by the Mnemo PluginManager on the server.
 * It uses CommonJS module format.
 *
 * Available API:
 *   api.notes     - Read/write notes
 *   api.events    - Subscribe to system events
 *   api.routes    - Register HTTP endpoints
 *   api.storage   - Key-value storage
 *   api.database  - Direct DB access
 *   api.settings  - Plugin settings
 *   api.search    - Search integration
 *   api.log       - Structured logging
 */

exports.activate = function (api) {
  api.log.info("Plugin activated");

  // Example: register a custom route
  // api.routes.register("get", "/hello", async (req, res) => {
  //   res.json({ message: "Hello from plugin!" });
  // });

  // Example: listen for events
  // api.events.on("note:afterSave", (ctx) => {
  //   api.log.info(`Note saved: ${ctx.path}`);
  // });
};

exports.deactivate = function () {
  // Cleanup resources if needed.
  // Note: PluginManager automatically removes registered routes and event listeners.
};
