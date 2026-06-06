import Anthropic from "@anthropic-ai/sdk";
import { SerialPort } from "serialport";

const BAUD_RATE = 115200;
const POLL_MS = 30_000;
const SERIAL_MS = 1_000;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from .env

let tokenPercent = 0;

async function refreshUsage(): Promise<void> {
  try {
    const { response } = await client.messages
      .create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "." }],
      })
      .withResponse();

    const limit = parseInt(
      response.headers.get("anthropic-ratelimit-tokens-limit") ?? "0"
    );
    const remaining = parseInt(
      response.headers.get("anthropic-ratelimit-tokens-remaining") ?? "0"
    );

    if (limit > 0) {
      tokenPercent = ((limit - remaining) / limit) * 100;
      console.log(
        `[${new Date().toLocaleTimeString()}] Token usage: ${tokenPercent.toFixed(1)}% (${limit - remaining}/${limit} used)`
      );
    }
  } catch (err) {
    console.error(
      "Failed to refresh usage:",
      err instanceof Error ? err.message : err
    );
  }
}

async function findPort(): Promise<string> {
  if (process.env.SERIAL_PORT) return process.env.SERIAL_PORT;

  const ports = await SerialPort.list();
  const esp32 = ports.find(
    (p) =>
      p.path.includes("usbserial") ||
      p.path.includes("SLAB") ||
      p.path.includes("usbmodem") ||
      p.vendorId?.toLowerCase() === "10c4" || // CP210x (common on ESP32 devkits)
      p.vendorId?.toLowerCase() === "0403" // FTDI
  );

  if (!esp32) {
    const available =
      ports.map((p) => p.path).join(", ") || "none detected";
    throw new Error(`ESP32 not found. Available ports: ${available}`);
  }
  return esp32.path;
}

async function main(): Promise<void> {
  const portPath = await findPort();
  console.log(`Connecting to ESP32 on ${portPath} at ${BAUD_RATE} baud...`);

  const port = new SerialPort({ path: portPath, baudRate: BAUD_RATE });

  port.on("error", (err) => console.error("Serial error:", err.message));
  port.on("open", () => console.log("Serial port open. Sending data every second."));

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
