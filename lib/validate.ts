// Robust parsing + normalization of the LLM's JSON response.
// The model is asked for strict JSON, but we never trust that blindly:
// we strip stray code fences, parse, coerce types, and clamp ranges so the
// UI always receives a well-formed AnalysisResult (or we throw to trigger a retry).

import type { AnalysisResult, KeyTopic, Priority, StudyPlanItem } from "./types";

const PRIORITIES: Priority[] = ["high", "medium", "low"];

/** Extract a JSON object from a raw model string, tolerating ```json fences. */
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Try direct parse first.
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall back to the first {...} block.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("No JSON object found in model response");
  }
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asPriority(v: unknown): Priority {
  const s = asString(v).toLowerCase();
  return (PRIORITIES as string[]).includes(s) ? (s as Priority) : "medium";
}

function clampLevel(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Parse + normalize. Throws if the core shape is unusable (caller retries). */
export function parseAnalysis(raw: string): AnalysisResult {
  const data = extractJson(raw) as Record<string, unknown>;

  const roast = asString(data.roast);
  if (!roast) throw new Error("Missing 'roast' in model response");

  const key_topics: KeyTopic[] = Array.isArray(data.key_topics)
    ? data.key_topics
        .map((t): KeyTopic => {
          const obj = (t ?? {}) as Record<string, unknown>;
          return {
            topic: asString(obj.topic),
            priority: asPriority(obj.priority),
            why: asString(obj.why),
          };
        })
        .filter((t) => t.topic)
    : [];

  const quick_wins: string[] = Array.isArray(data.quick_wins)
    ? data.quick_wins.map(asString).filter(Boolean)
    : [];

  const study_plan: StudyPlanItem[] = Array.isArray(data.study_plan)
    ? data.study_plan
        .map((s): StudyPlanItem => {
          const obj = (s ?? {}) as Record<string, unknown>;
          return { when: asString(obj.when), focus: asString(obj.focus) };
        })
        .filter((s) => s.focus)
    : [];

  return {
    roast,
    cooked_level: clampLevel(data.cooked_level),
    key_topics,
    quick_wins,
    study_plan,
  };
}
