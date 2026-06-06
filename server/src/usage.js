import fs from "fs";
import path from "path";
import os from "os";

const CLAUDE_DIR = path.join(os.homedir(), ".claude", "projects");

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

export function getTodayPercent() {
  const byDay = buildDailyTokenMap();
  if (byDay.size === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const todayTokens = byDay.get(today) ?? 0;
  const peakTokens = Math.max(...byDay.values());

  return peakTokens > 0 ? (todayTokens / peakTokens) * 100 : 0;
}
