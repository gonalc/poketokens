#!/usr/bin/env node
// Claude Code statusLine command for PokeTokens.
//
// Claude Code (>=2.1.x) pipes the live session JSON to this script on stdin every
// render. Prints a short status line showing model, context usage, and rate-limit %.
//
// Must never throw: missing fields are normal (rate_limits only appears after the
// first API response in a session, and each window may be independently absent).

import fs from "fs";

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  let data = {};
  try {
    data = JSON.parse(readStdin()) || {};
  } catch {
    data = {};
  }

  const limits = data.rate_limits ?? {};
  const window = limits.five_hour ?? limits.seven_day ?? null;

  const model = data.model?.display_name ?? "Claude";
  const ctx = data.context_window?.used_percentage;
  const parts = [model];
  if (typeof ctx === "number") parts.push(`ctx ${Math.round(ctx)}%`);
  if (window && typeof window.used_percentage === "number") {
    const label = limits.five_hour ? "5h" : "7d";
    parts.push(`${label} ${Math.round(window.used_percentage)}%`);
  }
  process.stdout.write(parts.join(" · "));
}

main();
