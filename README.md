# PokeTokens

Visualizes your Claude Code daily message usage as a Pokémon HP bar on a physical OLED display. High Claude usage = low HP. The display shows a Pikachu sprite with a color-coded HP bar that updates in real time.

## How it works

```
~/.claude/stats-cache.json
  ↓ read every 30s
server/index.js (Node.js)
  calculates: today's messages / your all-time peak day × 100
  ↓ serial 115200 baud  "tokens=XX.X\n"  every 1s
ESP32 (display/src/main.cpp)
  ↓ I2C
SH1106 128×64 OLED
  Pikachu sprite + HP bar
```

### HP bar states

| Usage   | HP remaining | Bar style             |
|---------|--------------|-----------------------|
| 0–19%   | 81–100 HP    | Solid green           |
| 20–49%  | 51–80 HP     | Yellow checkerboard   |
| 50–79%  | 21–50 HP     | Yellow checkerboard   |
| 80–100% | 0–20 HP      | Red blinking (400 ms) |

HP = `100 − tokenPercent`, so a quiet day keeps Pikachu healthy.

## Hardware

### Parts

- ESP32 development board (any variant with a USB-UART bridge)
- SH1106 128×64 OLED display (I2C)
- 4× jumper wires

### Wiring

```
        ESP32
    ┌─────────────┐
    │         3V3 ├──── VCC ──┐
    │         GND ├──── GND  ─┤  SH1106 128×64 OLED
    │      GPIO21 ├──── SDA  ─┤
    │      GPIO22 ├──── SCL ──┘
    └──────USB────┘
           │
    host machine running server/index.js
```

GPIO pins confirmed by `Wire.begin(21, 22)` in `display/src/main.cpp`.

## Requirements

- Node.js 18+ and npm
- Arduino IDE 2.x or PlatformIO (to flash the ESP32)
- USB cable (ESP32 to your machine)
- [Claude Code](https://claude.ai/code) installed — it generates `~/.claude/stats-cache.json` automatically

## Quick start

**Step 1 — Flash the ESP32**

See [display/README.md](display/README.md) for full setup instructions.

**Step 2 — Start the server**

See [server/README.md](server/README.md) for full setup instructions.

```bash
cd server
npm install
npm start
```

## Project structure

```
poketokens/
├── server/          Node.js backend — reads usage stats, drives serial port
├── display/         Arduino C++ firmware for ESP32 + SH1106 OLED
└── sprites/         Source PNG used to generate the embedded Pikachu XBM bitmap
```
