"use client";

import { useRef, useState } from "react";
import { extractPdfText, ScannedPdfError } from "@/lib/pdf";
import { ResultView } from "@/components/ResultView";
import type { AnalysisResult } from "@/lib/types";

type Status = "idle" | "reading" | "analyzing";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [knowledge, setKnowledge] = useState("");
  const [days, setDays] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const busy = status !== "idle";

  function pickFile(f: File | null) {
    setError(null);
    if (f && f.type !== "application/pdf") {
      setError("That's not a PDF. Upload your exam as a PDF file.");
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorDetail(null);
    setResult(null);
    setTruncated(false);

    if (!file) return setError("Upload your exam PDF first.");
    if (!knowledge.trim()) return setError("Describe your current level — be honest.");

    try {
      setStatus("reading");
      const examText = await extractPdfText(file);

      setStatus("analyzing");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examText,
          knowledgeLevel: knowledge,
          daysLeft: days.trim() === "" ? null : Number(days),
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Something went wrong.");

      setResult(payload.result as AnalysisResult);
      setTruncated(Boolean(payload.truncated));
    } catch (err) {
      if (err instanceof ScannedPdfError) {
        setError(
          "I can't see any text in that PDF — looks like a scan. Upload a PDF with a real text layer (OCR isn't supported yet).",
        );
      } else {
        setError(err instanceof Error ? err.message : "Unexpected error.");
        // Temporary diagnostic: surface where it actually failed (helps debug
        // mobile-only issues we can't reproduce on desktop).
        if (err instanceof Error) {
          setErrorDetail(
            `${err.name} @ ${status}\n${(err.stack || "no stack").slice(0, 600)}`,
          );
        }
      }
    } finally {
      setStatus("idle");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-16">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
          Cooked Meter
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          Upload your exam. Confess how little you studied.
          <br />
          Get roasted — then get an actual escape plan. 🔥
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dropzone */}
        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-zinc-900/50 p-8 text-center transition hover:border-amber-400/50 hover:bg-zinc-900"
        >
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-4xl">{file ? "📄" : "⬆️"}</p>
          <p className="mt-2 font-medium text-white">
            {file ? file.name : "Drop your exam PDF here, or click to browse"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {file ? "Click to choose a different file" : "PDF with a text layer (no scans)"}
          </p>
        </div>

        {/* Knowledge level */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            How much have you actually studied?
          </label>
          <textarea
            value={knowledge}
            onChange={(e) => setKnowledge(e.target.value)}
            rows={3}
            placeholder="e.g. read 2 of 10 lectures, don't remember any formulas, panicking"
            className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
          />
        </div>

        {/* Days left */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Days until the exam <span className="text-zinc-600">(optional)</span>
          </label>
          <input
            type="number"
            min={0}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="1"
            className="w-32 rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <p>{error}</p>
            {errorDetail && (
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs text-red-400/80">
                {errorDetail}
              </pre>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-red-500 px-6 py-4 text-lg font-bold text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "reading"
            ? "Reading your PDF…"
            : status === "analyzing"
              ? "Cooking the verdict… 🔥"
              : "Am I cooked?"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-10">
          {truncated && (
            <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
              Heads up: your exam was long, so I analyzed the first part of it.
            </p>
          )}
          <ResultView result={result} />
        </div>
      )}

      <footer className="mt-16 text-center text-xs text-zinc-600">
        Built with Next.js + Groq · Roasts are jokes, the study plan is real.
      </footer>
    </main>
  );
}
