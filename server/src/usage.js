import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const CLAUDE_DIR = path.join(os.homedir(), ".claude", "projects");
const USAGE_API = "https://api.anthropic.com/api/oauth/usage";

function getOAuthToken() {
  const raw = execSync(
    `security find-generic-password -a "${process.env.USER}" -w -s "Claude Code-credentials"`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  ).trim();
  const creds = JSON.parse(raw);
  return creds.claudeAiOauth?.accessToken;
}

async function getRealPercent() {
  const token = getOAuthToken();
  if (!token) return null;

  const res = await fetch(USAGE_API, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.five_hour?.utilization ?? data.seven_day?.utilization ?? null;
}

function findJsonlFiles(dir) {
  let results = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(findJsonlFiles(fullPath));
    } else if (item.endsWith(".jsonl")) {
      results.push(fullPath);
    }
  }
  return results;
}

function buildDailyTokenMap() {
  const byDay = new Map();

  for (const file of findJsonlFiles(CLAUDE_DIR)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        const u = json.message?.usage;
        if (!u || !json.timestamp) continue;

        const date = json.timestamp.slice(0, 10);
        const tokens =
          (u.input_tokens || 0) +
          (u.output_tokens || 0) +
          (u.cache_creation_input_tokens || 0) +
          (u.cache_read_input_tokens || 0);

        byDay.set(date, (byDay.get(date) ?? 0) + tokens);
      } catch {
        // ignore malformed lines
      }
    }
  }

  return byDay;
}

function getLocalPercent() {
  const byDay = buildDailyTokenMap();
  if (byDay.size === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const todayTokens = byDay.get(today) ?? 0;
  const peakTokens = Math.max(...byDay.values());

  return peakTokens > 0 ? (todayTokens / peakTokens) * 100 : 0;
}

export async function getTodayPercent() {
  try {
    const real = await getRealPercent();
    if (real !== null) return real;
  } catch {
    // fall through to local calculation
  }
  return getLocalPercent();
}
