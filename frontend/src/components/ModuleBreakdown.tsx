"use client";

import { useEffect, useState } from "react";
import type { DetectionResult } from "@/lib/api";

interface Props {
  result: DetectionResult;
}

export default function ModuleBreakdown({ result }: Props) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, [result]);

  const modules = [
    {
      label: "Self-consistency",
      description: "Flan-T5 sampled ×5 — agreement score",
      groundednessScore: result.self_consistency ?? 0.5,
    },
    {
      label: "Similarity",
      description: "Semantic distance from retrieved facts",
      groundednessScore: result.similarity_score,
    },
    {
      label: "NLI Entailment",
      description: "DeBERTa cross-encoder entailment check",
      groundednessScore: result.nli_score,
    },
    {
      label: "ML Classifier",
      description: "TruthfulQA-trained logistic regression",
      groundednessScore: 1.0 - result.classifier_score,
    },
  ];

  function barColor(score: number) {
    if (score >= 0.65) return "bg-signal-green";
    if (score >= 0.45) return "bg-signal-amber";
    return "bg-signal-red";
  }

  function scoreLabel(score: number) {
    if (score >= 0.65) return { text: "Grounded",    cls: "text-signal-green" };
    if (score >= 0.45) return { text: "Mixed",       cls: "text-signal-amber" };
    return             { text: "Hallucinated", cls: "text-signal-red"   };
  }

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-4">
        Module Breakdown
      </p>
      <div className="border border-ink/10 bg-white/50 p-5 space-y-5">
        {modules.map((mod) => {
          const pct = Math.round(mod.groundednessScore * 100);
          const { text, cls } = scoreLabel(mod.groundednessScore);
          return (
            <div key={mod.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-sm font-sans font-semibold text-ink">{mod.label}</span>
                  <span className="text-xs text-ink/40 ml-2 font-mono">{mod.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold ${cls}`}>{text}</span>
                  <span className="text-xs font-mono text-ink/40">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-ink/8 w-full rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor(mod.groundednessScore)} rounded-full score-bar-fill`}
                  style={{ width: animated ? `${pct}%` : "0%" }}
                />
              </div>
            </div>
          );
        })}
        <div className="pt-2 border-t border-ink/8 flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-mono text-ink/30 uppercase tracking-wider">Groundedness →</span>
          {[
            { color: "bg-signal-red",   label: "Hallucinated" },
            { color: "bg-signal-amber", label: "Mixed" },
            { color: "bg-signal-green", label: "Grounded" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${l.color}`} />
              <span className="text-[10px] font-mono text-ink/40">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
