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
function collectDirectFiles(entries) {
  const files = [];
  for (const entry of entries) {
    if (entry.type === "file") {
      files.push(entry);
    }
  }
  return files;
}
function activate(api) {
  api.log.info("Calendar server plugin activated");
  api.routes.register("get", "/dates", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const year = parseInt(req.query.year, 10) || (/* @__PURE__ */ new Date()).getFullYear();
    const month = parseInt(req.query.month, 10) || (/* @__PURE__ */ new Date()).getMonth() + 1;
    try {
      const entries = await api.notes.list(userId, "Daily");
      const files = collectDirectFiles(entries);
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      const dates = files.filter((e) => e.name.startsWith(prefix) && e.name.endsWith(".md")).map((e) => e.name.replace(/\.md$/, ""));
      res.json(dates);
    } catch {
      res.json([]);
    }
  });
  api.routes.register("post", "/open/:date", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "Invalid date format; expected YYYY-MM-DD" });
      return;
    }
    const logicalPath = `Daily/${date}`;
    try {
      const note = await api.notes.get(userId, logicalPath);
      res.json({ path: `${logicalPath}.md`, content: note.content });
    } catch {
      const content = `# Daily Note \u2014 ${date}

`;
      try {
        await api.notes.create(userId, logicalPath, content);
        res.json({ path: `${logicalPath}.md`, content });
      } catch (createErr) {
        api.log.error("Calendar /open create error", createErr);
        res.status(500).json({ error: createErr.message ?? "Failed to create daily note" });
      }
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
