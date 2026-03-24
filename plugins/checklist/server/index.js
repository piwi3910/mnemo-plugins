"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var index_exports = {};
__export(index_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(index_exports);
function collectMdPaths(entries) {
  const paths = [];
  for (const entry of entries) {
    if (entry.type === "file" && entry.name.endsWith(".md")) {
      paths.push(entry.path);
    } else if (entry.type === "directory" && entry.children) {
      paths.push(...collectMdPaths(entry.children));
    }
  }
  return paths;
}
function activate(api) {
  api.log.info("Checklist server plugin activated");
  api.routes.register("get", "/notes", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const entries = await api.notes.list(userId);
      const paths = collectMdPaths(entries);
      const results = [];
      await Promise.all(
        paths.map(async (notePath) => {
          try {
            const logicalPath = notePath.replace(/\.md$/, "");
            const note = await api.notes.get(userId, logicalPath);
            if (note.content.includes("- [ ]") || note.content.includes("- [x]") || note.content.includes("- [X]") || note.content.includes("* [ ]") || note.content.includes("* [x]") || note.content.includes("* [X]")) {
              results.push({ path: notePath, content: note.content });
            }
          } catch {
          }
        })
      );
      res.json(results);
    } catch (err) {
      api.log.error("Checklist /notes error", err);
      res.status(500).json({ error: err.message ?? "Failed to list notes" });
    }
  });
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
