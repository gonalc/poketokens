---
description: Root-level Claude Code context for the PokeTokens project.
globs: "**"
alwaysApply: true
---

# PokeTokens — Claude Code context

IoT project: a Node.js server reads Claude Code daily message usage stats and sends the percentage to an ESP32 microcontroller, which renders a Pokémon HP bar on an SH1106 128×64 OLED display.

## Project layout

| Folder    | Language          | Purpose |
|-----------|-------------------|---------|
| `server/` | JavaScript (Node.js ES modules) | Resolves Claude Code usage % + reset time, drives serial port |
| `display/` | C++ / Arduino    | ESP32 firmware — renders Pikachu HP bar on OLED |
| `sprites/` | —                | Source PNG for the Pikachu XBM bitmap embedded in `main.cpp` |

See `server/CLAUDE.md` for server-specific context.

## Serial protocol — shared contract

The serial line is the interface between `server/index.js` and `display/src/main.cpp`.

```
Format:  key=value[,key=value]\n
Example: tokens=67.3,pokemon=PIKACHU\n

Keys:
  tokens   Float 0.0–100.0 (% of peak daily usage). Required.
  pokemon  String display name. Optional.
  spirit   String stat descriptor. Optional, not yet rendered.
```

Any change to this protocol must be reflected in **both** files.

## No tests, no CI

Personal IoT project. Testing is manual: run the server and observe the physical OLED display.
