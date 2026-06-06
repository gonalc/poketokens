# display

Arduino C++ firmware for an ESP32 + SH1106 128×64 OLED. Receives Claude Code usage data over serial and renders a Pikachu HP bar.

## Hardware

See the wiring table and diagram in the [root README](../README.md#wiring).

## Dependencies

| Library | Source |
|---------|--------|
| U8g2    | Arduino Library Manager → search "U8g2" **or** PlatformIO (`olikraus/U8g2`) |
| Wire    | Built-in (ESP32 Arduino core) |

## Setup — Arduino IDE 2.x

1. **Add the ESP32 board package**
   `File → Preferences → Additional Board Manager URLs`, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   Then: `Tools → Board → Boards Manager` → search `esp32` → install.

2. **Install U8g2**
   `Sketch → Include Library → Manage Libraries` → search `U8g2` → install.

3. **Open the firmware**
   Open `display/src/main.cpp` directly, or copy its contents into a new sketch.

4. **Select board and port**
   `Tools → Board → ESP32 Arduino → ESP32 Dev Module` (or your specific board)
   `Tools → Port → /dev/tty.usbserial-XXXX`

5. **Upload**
   `Sketch → Upload` (`Ctrl+U` / `Cmd+U`)

## Setup — PlatformIO

The display folder does not include a `platformio.ini`. Create one alongside `src/`:

```ini
[env:esp32dev]
platform  = espressif32
board     = esp32dev
framework = arduino
lib_deps  = olikraus/U8g2
```

Then upload:
```bash
pio run --target upload
```

## What the firmware does

1. Listens on serial at **115200 baud**
2. Parses incoming lines: `tokens=XX.X[,pokemon=NAME][,spirit=VALUE]`
3. Computes HP: `hp = 100 − tokenPercent`
4. Renders every loop iteration:
   - 32×32 Pikachu XBM bitmap (left panel)
   - Pokémon name (default: `PIKACHU`)
   - HP bar with dynamic fill style
   - Numeric HP value (e.g., `32 /100`)

## Display layout

```
col:  0        38                              127
      ┌─────────┬───────────────────────────────┐  row 0
      │         │  PIKACHU                      │
      │ Pikachu │  PS: [══════════════════]      │
      │  32×32  │                    32 /100     │
      │         │                               │
      └─────────┴───────────────────────────────┘  row 63
```

A vertical divider runs at column 38; a horizontal border closes the bottom at row 63.

## HP bar styles

| HP remaining | Style                              |
|--------------|------------------------------------|
| > 50         | Solid fill                         |
| 20–50        | Checkerboard (yellow-ish pattern)  |
| < 20         | Sparse dots, blinks every 400 ms   |

## Serial protocol reference

| Field     | Type   | Description                                            |
|-----------|--------|--------------------------------------------------------|
| `tokens`  | float  | Required. `0.0`–`100.0`, percentage of peak day usage |
| `pokemon` | string | Optional. Display name, max ~15 chars. Default: `PIKACHU` |
| `spirit`  | string | Optional. Parsed but not currently rendered on screen |

Example line: `tokens=67.3,pokemon=PIKACHU\n`
