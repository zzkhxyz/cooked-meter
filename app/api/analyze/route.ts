// Serverless API route: receives extracted exam TEXT (not the file) + the
// student's self-described level, calls Groq, and returns a normalized JSON
// verdict. The Groq API key lives only in server-side env — never shipped to
// the client.

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildMessages, MAX_EXAM_CHARS } from "@/lib/prompt";
import { parseAnalysis } from "@/lib/validate";
import type { AnalyzeRequest } from "@/lib/types";

// Give the model room to answer without hitting Vercel's default timeout.
export const maxDuration = 30;
export const runtime = "nodejs";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return bad("Server is not configured (missing GROQ_API_KEY).", 500);
  }

  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return bad("Invalid request body.");
  }

  const examText = (body.examText ?? "").trim();
  const knowledgeLevel = (body.knowledgeLevel ?? "").trim();

  if (examText.length < 30) {
    return bad("No usable exam text. Upload a PDF that has a text layer.");
  }
  if (!knowledgeLevel) {
    return bad("Tell us your current knowledge level first.");
  }

  const truncated = examText.length > MAX_EXAM_CHARS;
  const lang = body.lang === "en" ? "en" : "ru";
  const messages = buildMessages({
    examText,
    knowledgeLevel,
    daysLeft: body.daysLeft,
    lang,
  });

  const groq = new Groq({ apiKey });

  // Up to 2 attempts: JSON mode usually nails it, but we retry once if parsing fails.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages,
        temperature: attempt === 0 ? 0.7 : 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const result = parseAnalysis(raw);
      return NextResponse.json({ result, truncated });
    } catch (err) {
      lastErr = err;
    }
  }

  // Distinguish "model gave junk" from "Groq is down / rate limited".
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  const isParse = /JSON|roast/i.test(msg);
  console.error("analyze failed:", msg);
  return bad(
    isParse
      ? "The AI got a bit too cooked and returned a weird answer. Try again."
      : "The AI service is unavailable right now. Please try again in a moment.",
    isParse ? 502 : 503,
  );
}
