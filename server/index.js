import { readFile } from "fs/promises";
import { SerialPort } from "serialport";
import { homedir } from "os";
import { join } from "path";

const BAUD_RATE = 115200;
const POLL_MS = 30_000;
const SERIAL_MS = 1_000;
const CACHE_PATH = join(homedir(), ".claude", "stats-cache.json");

let tokenPercent = 0;

async function refreshUsage() {
  try {
    const raw = await readFile(CACHE_PATH, "utf8");
    const cache = JSON.parse(raw);

    const today = new Date().toISOString().slice(0, 10);
    const activity = cache.dailyActivity ?? [];

    const todayEntry = activity.find((d) => d.date === today);
    const targetEntry = todayEntry ?? activity[activity.length - 1];

    if (!targetEntry) return;

    const maxMessages = Math.max(...activity.map((d) => d.messageCount));
    tokenPercent =
      maxMessages > 0 ? (targetEntry.messageCount / maxMessages) * 100 : 0;

    console.log(
      `[${new Date().toLocaleTimeString()}] ${targetEntry.date} — ` +
        `${targetEntry.messageCount} msgs (${tokenPercent.toFixed(1)}% of peak ${maxMessages})`
    );
  } catch (err) {
    console.error(
      "Failed to refresh usage:",
      err instanceof Error ? err.message : err
    );
  }
}

async function findPort() {
  if (process.env.SERIAL_PORT) return process.env.SERIAL_PORT;

  const ports = await SerialPort.list();
  const esp32 = ports.find(
    (p) =>
      p.path.includes("usbserial") ||
      p.path.includes("SLAB") ||
      p.path.includes("usbmodem") ||
      p.vendorId?.toLowerCase() === "10c4" ||
      p.vendorId?.toLowerCase() === "0403"
  );

  if (!esp32) {
    const available = ports.map((p) => p.path).join(", ") || "none detected";
    throw new Error(`ESP32 not found. Available ports: ${available}`);
  }
  return esp32.path;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectSerial(portPath) {
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 3_000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const port = await new Promise((resolve, reject) => {
        const p = new SerialPort({ path: portPath, baudRate: BAUD_RATE });
        p.once("open", () => resolve(p));
        p.once("error", reject);
      });
      return port;
    } catch (err) {
      const busy =
        err?.message?.includes("Resource busy") ||
        err?.message?.includes("EBUSY");
      if (busy && attempt < MAX_RETRIES) {
        console.warn(
          `Port busy (attempt ${attempt}/${MAX_RETRIES}). ` +
            `Close Arduino IDE Serial Monitor or kill previous server instances. ` +
            `Retrying in ${RETRY_DELAY_MS / 1000}s…`
        );
        await sleep(RETRY_DELAY_MS);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Unreachable");
}

async function main() {
  const portPath = await findPort();
  console.log(`Connecting to ESP32 on ${portPath} at ${BAUD_RATE} baud...`);

  const port = await connectSerial(portPath);

  port.on("error", (err) => console.error("Serial error:", err.message));
  port.on("open", () =>
    console.log("Serial port open. Sending data every second.")
  );

  await refreshUsage();
  setInterval(refreshUsage, POLL_MS);

  setInterval(() => {
    const line = `tokens=${tokenPercent.toFixed(1)}\n`;
    port.write(line, (err) => {
      if (err) console.error("Write error:", err.message);
    });
  }, SERIAL_MS);
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
