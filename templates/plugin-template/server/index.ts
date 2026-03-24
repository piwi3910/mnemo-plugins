import type { PluginAPI } from '../../../types/server';

export function activate(api: PluginAPI): void {
  api.log.info("Plugin activated");

  // Example: register a custom route
  // api.routes.register("get", "/hello", async (req, res) => {
  //   res.json({ message: "Hello from plugin!" });
  // });

  // Example: listen for events
  // api.events.on("note:afterSave", (ctx: any) => {
  //   api.log.info(`Note saved: ${ctx.path}`);
  // });
}

export function deactivate(): void {
  // Cleanup resources if needed.
  // Note: PluginManager automatically removes registered routes and event listeners.
}
