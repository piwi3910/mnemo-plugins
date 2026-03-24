#!/usr/bin/env node

/**
 * Tests plugin JS files for basic correctness.
 *
 * Checks:
 * 1. All JS files parse without syntax errors
 * 2. Server plugins export 'activate' and 'deactivate'
 * 3. Client plugins export 'activate'
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const PLUGINS_DIR = path.join(ROOT, "plugins");

let errors = 0;
let tests = 0;

function error(msg) {
  console.error(`  FAIL: ${msg}`);
  errors++;
}

function pass(msg) {
  console.log(`  PASS: ${msg}`);
  tests++;
}

/**
 * Check if a JS file can be parsed without syntax errors.
 * Returns true if valid, false otherwise.
 */
function checkSyntax(filePath, label) {
  try {
    const code = fs.readFileSync(filePath, "utf-8");
    // Use vm.Script for CJS or try Function for ESM
    // First try as a script (CJS)
    try {
      new vm.Script(code, { filename: filePath });
      pass(`${label} - syntax OK (CJS)`);
      return { valid: true, type: "cjs", code };
    } catch (_cjsErr) {
      // Try as module (ESM) - use vm.SourceTextModule if available,
      // otherwise parse with Function wrapper
      try {
        // Strip import/export for syntax check
        const stripped = code
          .replace(/^\s*export\s+/gm, "")
          .replace(/^\s*import\s+.*$/gm, "// import removed for syntax check");
        new vm.Script(stripped, { filename: filePath });
        pass(`${label} - syntax OK (ESM)`);
        return { valid: true, type: "esm", code };
      } catch (esmErr) {
        error(`${label} - syntax error: ${esmErr.message}`);
        return { valid: false, type: null, code };
      }
    }
  } catch (err) {
    error(`${label} - could not read file: ${err.message}`);
    return { valid: false, type: null, code: null };
  }
}

/**
 * Check that a CJS server plugin exports activate and deactivate.
 */
function checkServerExports(filePath, label) {
  const code = fs.readFileSync(filePath, "utf-8");

  // Check for exports.activate or module.exports containing activate
  const hasActivate =
    /exports\.activate\s*=/.test(code) ||
    /module\.exports\s*=\s*\{[^}]*activate/.test(code);
  const hasDeactivate =
    /exports\.deactivate\s*=/.test(code) ||
    /module\.exports\s*=\s*\{[^}]*deactivate/.test(code);

  if (hasActivate) {
    pass(`${label} - exports 'activate'`);
  } else {
    error(`${label} - missing 'activate' export`);
  }

  if (hasDeactivate) {
    pass(`${label} - exports 'deactivate'`);
  } else {
    error(`${label} - missing 'deactivate' export`);
  }
}

/**
 * Check that a client (ESM) plugin exports activate.
 */
function checkClientExports(filePath, label) {
  const code = fs.readFileSync(filePath, "utf-8");

  const hasActivate =
    /export\s+function\s+activate/.test(code) ||
    /export\s+const\s+activate/.test(code) ||
    /export\s+\{[^}]*activate/.test(code);

  if (hasActivate) {
    pass(`${label} - exports 'activate'`);
  } else {
    error(`${label} - missing 'activate' export`);
  }
}

// --- Main ---

console.log("Testing plugins...\n");

// Load registry to know which plugins to test
const registry = JSON.parse(
  fs.readFileSync(path.join(ROOT, "registry.json"), "utf-8")
);

for (const entry of registry.plugins) {
  console.log(`Testing plugin: ${entry.id}`);

  const pluginDir = path.join(PLUGINS_DIR, entry.id);
  const manifestPath = path.join(pluginDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    error(`Missing manifest for ${entry.id}`);
    continue;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  // Test server entry point
  if (manifest.server) {
    const serverPath = path.join(pluginDir, manifest.server);
    const label = `${entry.id}/server`;
    const result = checkSyntax(serverPath, label);
    if (result.valid) {
      checkServerExports(serverPath, label);
    }
  }

  // Test client entry point
  if (manifest.client) {
    const clientPath = path.join(pluginDir, manifest.client);
    const label = `${entry.id}/client`;
    const result = checkSyntax(clientPath, label);
    if (result.valid) {
      checkClientExports(clientPath, label);
    }
  }

  console.log("");
}

// --- Summary ---

console.log(`Tests complete: ${tests} passed, ${errors} failed`);
if (errors > 0) {
  process.exit(1);
}
