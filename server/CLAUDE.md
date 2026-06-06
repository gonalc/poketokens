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

1. Reads `~/.claude/stats-cache.json` every 30 seconds and calculates `(today's messageCount / peak messageCount) * 100`
2. Auto-detects the ESP32 serial port (or reads `SERIAL_PORT` from `.env`)
3. Writes `tokens=XX.X\n` to the serial port every 1 second

## Environment variables

| Variable      | Required | Description |
|---------------|----------|-------------|
| `SERIAL_PORT` | No       | Override ESP32 port auto-detection |

## Dependencies

- `serialport@13` — only external dependency

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
