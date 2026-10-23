"use client";

import { DetectionResult } from "@/lib/api";

interface Props {
  result: DetectionResult;
}

export default function ResultPanel({ result }: Props) {
  const isHallucination = result.label === "Hallucination";
  const pct = Math.round(result.confidence * 100);

  const riskLevel =
    pct >= 70 ? "HIGH" : pct >= 40 ? "MEDIUM" : "LOW";

  const colors = {
    Hallucination: {
      bg: "bg-signal-red-light",
      border: "border-signal-red/30",
      text: "text-signal-red",
      badge: "bg-signal-red text-white",
      bar: "bg-signal-red",
    },
    Grounded: {
      bg: "bg-signal-green-light",
      border: "border-signal-green/30",
      text: "text-signal-green",
      badge: "bg-signal-green text-white",
      bar: "bg-signal-green",
    },
  }[result.label];

  return (
    <div className={`border ${colors.border} ${colors.bg} p-6 md:p-8`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`font-mono text-xs uppercase tracking-widest px-2 py-1 ${colors.badge}`}>
              {result.label}
            </span>
            <span className={`font-mono text-xs uppercase tracking-widest ${colors.text}`}>
              {riskLevel} RISK
            </span>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-ink leading-tight">
              "{result.query}"
            </p>
          </div>
        </div>

        {/* Right — big confidence number */}
        <div className="flex-shrink-0 text-right">
          <div className={`font-mono text-5xl font-bold ${colors.text}`}>
            {pct}
            <span className="text-2xl">%</span>
          </div>
          <p className="text-xs font-mono text-ink/40 uppercase tracking-widest mt-1">
            hallucination confidence
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-6">
        <div className="h-1.5 bg-black/10 w-full rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} score-bar-fill rounded-full`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-mono text-ink/30">Grounded</span>
          <span className="text-[10px] font-mono text-ink/30">Hallucinated</span>
        </div>
      </div>
    </div>
  );
}
