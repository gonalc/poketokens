import fs from "fs";
import path from "path";
import os from "os";

const CLAUDE_DIR = path.join(os.homedir(), ".claude", "projects");

function findJsonlFiles(dir) {
  let results = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(findJsonlFiles(fullPath));
    } else if (item.endsWith(".jsonl")) {
      results.push(fullPath);
    }
  }

  return results;
}

function parseFile(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split("\n");

  const usage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    messages: 0,
  };

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const json = JSON.parse(line);

      // Claude usage objects often live here
      const u =
        json.message?.usage ||
        json.usage ||
        json.response?.usage;

      if (u) {
        usage.inputTokens += u.input_tokens || 0;
        usage.outputTokens += u.output_tokens || 0;
        usage.cacheReadTokens += u.cache_read_input_tokens || 0;
        usage.cacheWriteTokens += u.cache_creation_input_tokens || 0;
      }

      usage.messages++;
    } catch (err) {
      // ignore malformed lines
    }
  }

  return usage;
}

const files = findJsonlFiles(CLAUDE_DIR);

let totals = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  messages: 0,
};

for (const file of files) {
  const usage = parseFile(file);

  totals.inputTokens += usage.inputTokens;
  totals.outputTokens += usage.outputTokens;
  totals.cacheReadTokens += usage.cacheReadTokens;
  totals.cacheWriteTokens += usage.cacheWriteTokens;
  totals.messages += usage.messages;
}

console.log("\nClaude Code Usage Summary");
console.log("==========================");
console.log(`Files scanned: ${files.length}`);
console.log(`Messages: ${totals.messages}`);
console.log(`Input tokens: ${totals.inputTokens.toLocaleString()}`);
console.log(`Output tokens: ${totals.outputTokens.toLocaleString()}`);
console.log(
  `Cache read tokens: ${totals.cacheReadTokens.toLocaleString()}`
);
console.log(
  `Cache write tokens: ${totals.cacheWriteTokens.toLocaleString()}`
);
