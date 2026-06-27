"use client";

import { useRef, useState } from "react";
import { extractPdfText, ScannedPdfError } from "@/lib/pdf";
import { ResultView } from "@/components/ResultView";
import { STRINGS, type Lang } from "@/lib/i18n";
import type { AnalysisResult } from "@/lib/types";

type Status = "idle" | "reading" | "analyzing";

export default function Home() {
  const [lang, setLang] = useState<Lang>("ru");
  const [file, setFile] = useState<File | null>(null);
  const [knowledge, setKnowledge] = useState("");
  const [days, setDays] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultLang, setResultLang] = useState<Lang>("ru");
  const fileInput = useRef<HTMLInputElement>(null);

  const t = STRINGS[lang];
  const busy = status !== "idle";

  function pickFile(f: File | null) {
    setError(null);
    if (f && f.type !== "application/pdf") {
      setError(t.errNotPdf);
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

    if (!file) return setError(t.errNoFile);
    if (!knowledge.trim()) return setError(t.errNoKnowledge);

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
          lang,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || t.errUnexpected);

      setResult(payload.result as AnalysisResult);
      setResultLang(lang);
      setTruncated(Boolean(payload.truncated));
    } catch (err) {
      if (err instanceof ScannedPdfError) {
        setError(t.errScan);
      } else {
        setError(err instanceof Error ? err.message : t.errUnexpected);
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
      {/* Language toggle */}
      <div className="mb-6 flex justify-end">
        <div className="inline-flex overflow-hidden rounded-lg border border-white/10 text-sm font-medium">
          {(["ru", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 transition ${
                lang === l
                  ? "bg-amber-400 text-zinc-950"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
          Cooked Meter
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          {t.subtitle1}
          <br />
          {t.subtitle2}
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
            {file ? file.name : t.dropTitle}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {file ? t.dropChange : t.dropHint}
          </p>
        </div>

        {/* Knowledge level */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            {t.knowledgeLabel}
          </label>
          <textarea
            value={knowledge}
            onChange={(e) => setKnowledge(e.target.value)}
            rows={3}
            placeholder={t.knowledgePlaceholder}
            className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
          />
        </div>

        {/* Days left */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            {t.daysLabel} <span className="text-zinc-600">{t.optional}</span>
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
            ? t.btnReading
            : status === "analyzing"
              ? t.btnAnalyzing
              : t.btnIdle}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-10">
          {truncated && (
            <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
              {STRINGS[resultLang].truncated}
            </p>
          )}
          <ResultView result={result} lang={resultLang} />
        </div>
      )}

      <footer className="mt-16 text-center text-xs text-zinc-600">{t.footer}</footer>
    </main>
  );
}
