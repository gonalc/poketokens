# server

Node.js process that reads Claude Code daily message stats and forwards a usage percentage to the ESP32 via serial every second.

## Prerequisites

- Node.js 18+
- npm
- ESP32 connected via USB
- [Claude Code](https://claude.ai/code) installed — it writes `~/.claude/stats-cache.json` automatically after first use

## Installation

```bash
cd server
npm install
```

## Configuration

```bash
cp .env.example .env
```

| Variable      | Required | Description |
|---------------|----------|-------------|
| `SERIAL_PORT` | No       | Override auto-detection. Example: `/dev/tty.usbserial-0001`. If not set, the server scans all ports and picks the first one matching an ESP32 by vendor ID (`10c4`, `0403`) or path pattern (`usbserial`, `SLAB`, `usbmodem`). |

## Running

```bash
npm start
```

Expected output on startup:

```
Connecting to ESP32 on /dev/tty.usbserial-0001 at 115200 baud...
Serial port open. Sending data every second.
[10:32:05] 2026-06-06 — 47 msgs (83.9% of peak 56)
```

## How usage is calculated

The server reads `~/.claude/stats-cache.json` — a file maintained automatically by Claude Code:

```json
{
  "dailyActivity": [
    { "date": "2026-06-06", "messageCount": 47 },
    { "date": "2026-06-05", "messageCount": 56 }
  ]
}
```

```
percentage = (today's messageCount / all-time peak messageCount) × 100
```

- The file is re-read every **30 seconds**
- The calculated percentage is sent to the ESP32 every **1 second**

## Serial protocol

```
tokens=XX.X\n
```

Example: `tokens=83.9\n`

The display firmware also supports `pokemon=` and `spirit=` fields, but the server currently only sends `tokens`.

## Troubleshooting

**Port busy**
Close the Arduino IDE Serial Monitor before starting the server. The server retries up to 10 times with a 3-second delay between attempts.

**ESP32 not found**
List available ports:
```bash
node -e "import('serialport').then(m => m.SerialPort.list()).then(l => l.forEach(p => console.log(p.path, p.vendorId, p.manufacturer)))"
```
Then set `SERIAL_PORT` in `.env` to the correct path.

**Stats file not found / 0 messages**
Claude Code must have been used at least once for `~/.claude/stats-cache.json` to exist. The percentage will show `0.0` until data is present.
