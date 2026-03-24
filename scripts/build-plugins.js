#!/usr/bin/env node

/**
 * Builds all TypeScript plugins into JS using esbuild.
 * Server plugins -> CJS, Client plugins -> ESM (with externalized React deps)
 */

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = path.resolve(__dirname, "..");
const PLUGINS_DIR = path.join(ROOT, "plugins");

async function buildPlugins() {
  const pluginDirs = fs
    .readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  let built = 0;
  let errors = 0;

  for (const dir of pluginDirs) {
    const pluginDir = path.join(PLUGINS_DIR, dir.name);
    const manifestPath = path.join(pluginDir, "manifest.json");

    if (!fs.existsSync(manifestPath)) {
      console.warn(`  SKIP: ${dir.name}/ — no manifest.json`);
      continue;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    // Build server entry if .ts source exists
    if (manifest.server) {
      const serverJs = path.join(pluginDir, manifest.server);
      const serverTs = serverJs.replace(/\.js$/, ".ts");

      if (fs.existsSync(serverTs)) {
        try {
          await esbuild.build({
            entryPoints: [serverTs],
            outfile: serverJs,
            bundle: false,
            platform: "node",
            format: "cjs",
            target: "es2022",
          });
          console.log(`  OK: ${dir.name}/server (CJS)`);
          built++;
        } catch (err) {
          console.error(`  FAIL: ${dir.name}/server — ${err.message}`);
          errors++;
        }
      }
    }

    // Build client entry if .ts source exists
    if (manifest.client) {
      const clientJs = path.join(pluginDir, manifest.client);
      const clientTs = clientJs.replace(/\.js$/, ".ts");

      if (fs.existsSync(clientTs)) {
        try {
          await esbuild.build({
            entryPoints: [clientTs],
            outfile: clientJs,
            bundle: false,
            platform: "browser",
            format: "esm",
            target: "es2022",
          });
          console.log(`  OK: ${dir.name}/client (ESM)`);
          built++;
        } catch (err) {
          console.error(`  FAIL: ${dir.name}/client — ${err.message}`);
          errors++;
        }
      }
    }
  }

  console.log(`\nBuild complete: ${built} file(s) built, ${errors} error(s)`);
  if (errors > 0) process.exit(1);
}

buildPlugins();
