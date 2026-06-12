import os from "os";
import { execSync, execFileSync } from "child_process";

const USAGE_API = "https://api.anthropic.com/api/oauth/usage";
const CCUSAGE_BIN = new URL("../node_modules/.bin/ccusage", import.meta.url).pathname;

// The /api/oauth/usage endpoint is undocumented and aggressively rate-limited
// (HTTP 429), so it is only a fallback and is throttled hard.
const API_MIN_INTERVAL_MS = 5 * 60_000;

let lastApiAttempt = 0;
let backoffUntil = 0;
let lastGoodApiUsage = null;

function getOAuthToken() {
  const raw = execSync(
    `security find-generic-password -a "${process.env.USER}" -w -s "Claude Code-credentials"`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  ).trim();
  const creds = JSON.parse(raw);
  return creds.claudeAiOauth?.accessToken;
}

function runCcusage(...args) {
  const out = execFileSync(CCUSAGE_BIN, [...args, "--json", "--no-color"], {
    encoding: "utf8",
    timeout: 10_000,
  });
  return JSON.parse(out);
}

const PRO_PLAN_5H_LIMIT = 7_000_000;

async function getCcusageData() {
  const { blocks } = runCcusage("blocks", "--active", "--token-limit", String(PRO_PLAN_5H_LIMIT));
  const active = blocks.find((b) => b.isActive);
  if (!active) return { percent: 0, resetsAt: null };

  const percent = (active.totalTokens / PRO_PLAN_5H_LIMIT) * 100;
  const resetsAt = active.endTime;
  return { percent, resetsAt };
}

async function getRealUsage() {
  const now = Date.now();
  if (now < backoffUntil || now - lastApiAttempt < API_MIN_INTERVAL_MS) {
    return lastGoodApiUsage;
  }
  lastApiAttempt = now;

  const token = getOAuthToken();
  if (!token) return lastGoodApiUsage;

  const res = await fetch(USAGE_API, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const backoffMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : API_MIN_INTERVAL_MS * 2;
      backoffUntil = Date.now() + backoffMs;
      console.warn(`[usage API] HTTP 429, backing off ${Math.round(backoffMs / 1000)}s`);
    } else {
      console.warn(`[usage API] HTTP ${res.status}: ${await res.text()}`);
    }
    return lastGoodApiUsage;
  }
  const data = await res.json();

  const window = data.five_hour ?? data.seven_day ?? null;
  if (!window) {
    console.warn(`[usage API] no window in response:`, JSON.stringify(data));
    return lastGoodApiUsage;
  }

  lastGoodApiUsage = {
    percent: window.utilization,
    resetsAt: window.resets_at ?? null,
  };
  return lastGoodApiUsage;
}

export async function getUsage() {
  // 1. ccusage subprocess — reads local JSONL files, no network required.
  try {
    return await getCcusageData();
  } catch (err) {
    console.warn(`[ccusage] error:`, err instanceof Error ? err.message : err);
  }

  // 2. Throttled API fallback.
  try {
    const real = await getRealUsage();
    if (real !== null) return real;
  } catch (err) {
    console.warn(`[usage API] error:`, err instanceof Error ? err.message : err);
  }

  return { percent: 0, resetsAt: null };
}
