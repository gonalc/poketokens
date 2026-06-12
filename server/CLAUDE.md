---
description: Node.js server context for the PokeTokens project.
globs: "*.js, package.json, .env*"
alwaysApply: false
---

# server — Claude Code context

This is a **Node.js** project using native ES modules (`"type": "module"`). There is no TypeScript, no Bun, and no build step.

## Runtime

- Run: `npm start` → `node index.js`
- Install: `npm install`
- Entry point: `index.js`

## What the server does

1. Resolves usage % and reset time via `getUsage()` in `src/usage.js` every 60s, trying two sources in order:
   - **`ccusage` subprocess** — spawns `ccusage daily --json` to compute `(today / peak day) * 100`; spawns `ccusage blocks --active --json` for the reset time (`endTime` of the active 5-hour window). Reads local JSONL files, no network required.
   - **`/api/oauth/usage`** — throttled (≥ 5 min between calls) with 429 `retry-after` backoff and a last-good cache. Fallback only; returns the actual API utilization % if ccusage fails.
2. Auto-detects the ESP32 serial port (or reads `SERIAL_PORT` from `.env`)
3. Writes `tokens=XX.X,resets=<minutes>\n` to the serial port every 1 second

## Statusline (`statusline.js`)

`statusline.js` is registered as Claude Code's `statusLine` command in `~/.claude/settings.json`:

```json
"statusLine": { "type": "command", "command": "node /absolute/path/to/server/statusline.js" }
```

Claude Code pipes the live session JSON to it on stdin on every render. It prints a compact status line (`model · ctx X% · 5h Y%`) for the Claude Code UI. It no longer writes any files — usage data is fetched independently by the server via ccusage.

## Environment variables

| Variable      | Required | Description |
|---------------|----------|-------------|
| `SERIAL_PORT` | No       | Override ESP32 port auto-detection |

## Dependencies

- `serialport@13` — serial port communication
- `ccusage` — spawned as a subprocess to read local JSONL usage data

## Common tasks

**Add a new serial field** (e.g., `pokemon=PIKACHU`)
Edit the `setInterval` at the bottom of `main()` in `index.js` to append the new field:
```js
port.write(`tokens=${tokenPercent.toFixed(1)},pokemon=PIKACHU\n`);
```
Then update `parseSerialLine()` in `display/src/main.cpp` to handle the new key.

**Test without hardware**
Use a virtual serial pair with `socat`:
```bash
socat -d -d pty,raw,echo=0 pty,raw,echo=0
# Set SERIAL_PORT to one of the pty paths in .env
```
