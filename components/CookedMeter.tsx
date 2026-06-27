"use client";

import { useEffect, useState } from "react";
import { verdict, STRINGS, type Lang } from "@/lib/i18n";

/** The signature visual: a 0–100 "how cooked are you" gauge. */
export function CookedMeter({ level, lang }: { level: number; lang: Lang }) {
  const clamped = Math.max(0, Math.min(100, level));
  const [width, setWidth] = useState(0);

  // Animate the fill on mount / when level changes.
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  const { label, emoji } = verdict(clamped, lang);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium uppercase tracking-wider text-zinc-400">
          {STRINGS[lang].meterLabel}
        </span>
        <span className="text-3xl font-black tabular-nums text-white">
          {clamped}
          <span className="text-lg text-zinc-500">/100</span>
        </span>
      </div>

      <div className="relative h-5 w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-inset ring-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-[width] duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
        {/* Marker */}
        <div
          className="absolute top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-white shadow-lg transition-[left] duration-1000 ease-out"
          style={{ left: `calc(${width}% - 2px)` }}
        />
      </div>

      <p className="mt-3 text-center text-lg font-bold text-white">
        {emoji} {label}
      </p>
    </div>
  );
}
