import { SerialPort } from "serialport";
import { getUsage } from "./src/usage.js";

const BAUD_RATE = 115200;
const POLL_MS = 60_000;
const SERIAL_MS = 1_000;

let tokenPercent = 0;
let resetsMinutes = -1;

async function refreshUsage() {
  try {
    const usage = await getUsage();
    tokenPercent = usage.percent;
    resetsMinutes = usage.resetsAt
      ? Math.max(0, Math.round((new Date(usage.resetsAt) - Date.now()) / 60000))
      : -1;
    console.log(
      `[${new Date().toLocaleTimeString()}] ${tokenPercent.toFixed(1)}% usage` +
        (resetsMinutes >= 0 ? `, resets in ${resetsMinutes}m` : "")
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
    const line = `tokens=${tokenPercent.toFixed(1)},resets=${resetsMinutes}\n`;
    port.write(line, (err) => {
      if (err) console.error("Write error:", err.message);
    });
  }, SERIAL_MS);
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
