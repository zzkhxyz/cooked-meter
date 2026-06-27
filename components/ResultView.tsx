"use client";

import type { AnalysisResult, Priority } from "@/lib/types";
import { STRINGS, type Lang } from "@/lib/i18n";
import { CookedMeter } from "./CookedMeter";

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-red-500/15 text-red-300 ring-red-500/30",
  medium: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
};

export function ResultView({ result, lang }: { result: AnalysisResult; lang: Lang }) {
  const t = STRINGS[lang];
  return (
    <div className="space-y-6">
      {/* Roast */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-xl">
        <p className="text-lg font-semibold leading-relaxed text-white">
          “{result.roast}”
        </p>
      </div>

      {/* Cooked Meter */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
        <CookedMeter level={result.cooked_level} lang={lang} />
      </div>

      {/* Key topics */}
      {result.key_topics.length > 0 && (
        <Section title={t.topicsTitle} subtitle={t.topicsSub}>
          <ul className="space-y-3">
            {result.key_topics.map((t, i) => (
              <li
                key={i}
                className="rounded-xl border border-white/10 bg-zinc-900/60 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{t.topic}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ring-1 ring-inset ${PRIORITY_STYLES[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                </div>
                {t.why && <p className="mt-1 text-sm text-zinc-400">{t.why}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Quick wins */}
      {result.quick_wins.length > 0 && (
        <Section title={t.winsTitle} subtitle={t.winsSub}>
          <ul className="space-y-2">
            {result.quick_wins.map((w, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-zinc-200"
              >
                <span className="text-emerald-400">✓</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Study plan */}
      {result.study_plan.length > 0 && (
        <Section title={t.planTitle} subtitle={t.planSub}>
          <ol className="space-y-3">
            {result.study_plan.map((s, i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-white/10 bg-zinc-900/60 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-amber-300">{s.when}</p>
                  <p className="text-zinc-200">{s.focus}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="mb-3 text-sm text-zinc-500">{subtitle}</p>}
      {children}
    </section>
  );
}
