#!/usr/bin/env node

/**
 * Validates the plugin registry and all plugin manifests.
 *
 * Checks:
 * 1. registry.json is valid JSON with expected structure
 * 2. Each plugin directory exists
 * 3. Each plugin has a valid manifest.json
 * 4. Required manifest fields are present
 * 5. Manifest id matches directory name
 * 6. Manifest version matches registry version
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "registry.json");
const PLUGINS_DIR = path.join(ROOT, "plugins");

const REQUIRED_MANIFEST_FIELDS = [
  "id",
  "name",
  "version",
  "description",
  "author",
  "minMnemoVersion",
];

let errors = 0;

function error(msg) {
  console.error(`  ERROR: ${msg}`);
  errors++;
}

function info(msg) {
  console.log(`  ${msg}`);
}

// --- 1. Load and validate registry.json ---

console.log("Validating registry.json...");

let registry;
try {
  const raw = fs.readFileSync(REGISTRY_PATH, "utf-8");
  registry = JSON.parse(raw);
} catch (err) {
  error(`Failed to read/parse registry.json: ${err.message}`);
  process.exit(1);
}

if (typeof registry.version !== "number") {
  error("registry.json must have a numeric 'version' field");
}

if (!Array.isArray(registry.plugins)) {
  error("registry.json must have a 'plugins' array");
  process.exit(1);
}

info(`Found ${registry.plugins.length} plugin(s) in registry`);

// Check for duplicate IDs
const ids = registry.plugins.map((p) => p.id);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length > 0) {
  error(`Duplicate plugin IDs in registry: ${duplicates.join(", ")}`);
}

// --- 2. Validate each plugin ---

for (const entry of registry.plugins) {
  console.log(`\nValidating plugin: ${entry.id || "(missing id)"}...`);

  if (!entry.id) {
    error("Registry entry missing 'id'");
    continue;
  }

  if (!entry.version) {
    error(`Registry entry '${entry.id}' missing 'version'`);
  }

  // Check plugin directory exists
  const pluginDir = path.join(PLUGINS_DIR, entry.id);
  if (!fs.existsSync(pluginDir)) {
    error(`Plugin directory not found: plugins/${entry.id}/`);
    continue;
  }

  // Check manifest.json exists and is valid
  const manifestPath = path.join(pluginDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    error(`Missing manifest.json in plugins/${entry.id}/`);
    continue;
  }

  let manifest;
  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
  } catch (err) {
    error(`Failed to parse plugins/${entry.id}/manifest.json: ${err.message}`);
    continue;
  }

  // Check required fields
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!manifest[field]) {
      error(`Manifest plugins/${entry.id}/manifest.json missing required field: '${field}'`);
    }
  }

  // Check manifest id matches directory name
  if (manifest.id && manifest.id !== entry.id) {
    error(`Manifest id '${manifest.id}' does not match directory name '${entry.id}'`);
  }

  // Check version matches between manifest and registry
  if (manifest.version && entry.version && manifest.version !== entry.version) {
    error(
      `Version mismatch for '${entry.id}': manifest=${manifest.version}, registry=${entry.version}`
    );
  }

  // Check that at least one entry point is declared
  if (!manifest.server && !manifest.client) {
    error(`Plugin '${entry.id}' must declare at least one of 'server' or 'client' entry points`);
  }

  // Check that declared entry points exist
  if (manifest.server) {
    const serverPath = path.join(pluginDir, manifest.server);
    if (!fs.existsSync(serverPath)) {
      error(`Server entry point not found: plugins/${entry.id}/${manifest.server}`);
    }
  }
  if (manifest.client) {
    const clientPath = path.join(pluginDir, manifest.client);
    if (!fs.existsSync(clientPath)) {
      error(`Client entry point not found: plugins/${entry.id}/${manifest.client}`);
    }
  }

  // Validate settings if present
  if (manifest.settings) {
    if (!Array.isArray(manifest.settings)) {
      error(`Plugin '${entry.id}' settings must be an array`);
    } else {
      for (const setting of manifest.settings) {
        if (!setting.key) {
          error(`Plugin '${entry.id}' has a setting without a 'key'`);
        }
        if (!setting.type) {
          error(`Plugin '${entry.id}' setting '${setting.key || "?"}' missing 'type'`);
        }
        if (!setting.label) {
          error(`Plugin '${entry.id}' setting '${setting.key || "?"}' missing 'label'`);
        }
      }
    }
  }

  info(`OK - ${manifest.name} v${manifest.version}`);
}

// --- Summary ---

console.log("");
if (errors > 0) {
  console.error(`Validation FAILED with ${errors} error(s)`);
  process.exit(1);
} else {
  console.log("Validation PASSED - all plugins are valid");
}
