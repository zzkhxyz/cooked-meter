// Mini-eval for Cooked Meter.
//
// Checks two things the spec cares about:
//   1. STABILITY  — the API always returns valid, well-shaped JSON.
//   2. RELEVANCE  — the key_topics actually reflect the exam content
//                   (keyword recall against expected topics).
// Also verifies the prompt-injection fixture is NOT obeyed.
//
// Usage:
//   1. npm run dev           (in another terminal)
//   2. node eval/run-eval.mjs
//
// Optional: BASE_URL=https://your-app.vercel.app node eval/run-eval.mjs

import { readFile } from "node:fs/promises";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const fixtures = JSON.parse(
  await readFile(new URL("./fixtures.json", import.meta.url), "utf8"),
);

const VALID_PRIORITIES = new Set(["high", "medium", "low"]);

function checkShape(result) {
  const problems = [];
  if (typeof result.roast !== "string" || !result.roast) problems.push("roast missing");
  if (
    typeof result.cooked_level !== "number" ||
    result.cooked_level < 0 ||
    result.cooked_level > 100
  )
    problems.push("cooked_level out of range");
  if (!Array.isArray(result.key_topics) || result.key_topics.length === 0)
    problems.push("key_topics empty");
  for (const t of result.key_topics ?? []) {
    if (!VALID_PRIORITIES.has(t.priority)) problems.push(`bad priority: ${t.priority}`);
  }
  if (!Array.isArray(result.quick_wins)) problems.push("quick_wins not array");
  if (!Array.isArray(result.study_plan)) problems.push("study_plan not array");
  return problems;
}

function topicRecall(result, expect) {
  const haystack = result.key_topics
    .map((t) => `${t.topic} ${t.why}`)
    .join(" ")
    .toLowerCase();
  const hit = expect.filter((kw) => haystack.includes(kw.toLowerCase()));
  return { hit: hit.length, total: expect.length };
}

let passed = 0;
for (const f of fixtures) {
  process.stdout.write(`• ${f.name.padEnd(20)} `);
  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examText: f.examText,
        knowledgeLevel: f.knowledgeLevel,
        daysLeft: f.daysLeft,
        lang: f.lang,
      }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);

    const result = payload.result;
    const shape = checkShape(result);
    const { hit, total } = topicRecall(result, f.expectTopics);
    const recallOk = hit / total >= 0.5; // at least half the expected topics surface

    const roast = (result.roast || "").toLowerCase();
    const injectionOk = (f.mustNotContainRoast ?? []).every(
      (bad) => !roast.includes(bad.toLowerCase()),
    );

    const ok = shape.length === 0 && recallOk && injectionOk;
    if (ok) {
      passed++;
      console.log(`PASS  (recall ${hit}/${total}, cooked ${result.cooked_level})`);
    } else {
      console.log("FAIL");
      if (shape.length) console.log(`    shape: ${shape.join(", ")}`);
      if (!recallOk) console.log(`    recall too low: ${hit}/${total}`);
      if (!injectionOk) console.log(`    injection not defended: "${result.roast}"`);
    }
  } catch (err) {
    console.log(`ERROR  ${err.message}`);
  }
}

console.log(`\n${passed}/${fixtures.length} cases passed.`);
process.exit(passed === fixtures.length ? 0 : 1);
