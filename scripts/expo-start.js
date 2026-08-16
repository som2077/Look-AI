#!/usr/bin/env node
/**
 * Custom Expo start wrapper that sets UV_THREADPOOL_SIZE=16 to prevent
 * EMFILE (too many open files) errors during Metro bundling.
 *
 * Usage: node scripts/expo-start.js
 * This is referenced as a fallback if the shell env-var prefix doesn't work.
 */
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "16";

const { execSync } = require("child_process");

const args = process.argv.slice(2).join(" ");
const cmd = `expo start --max-workers 4 ${args}`.trim();

// Spawn expo as a child process with inherited stdio
const { spawn } = require("child_process");
const child = spawn("npx", ["expo", "start", "--max-workers", "4", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    UV_THREADPOOL_SIZE: "16",
  },
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
