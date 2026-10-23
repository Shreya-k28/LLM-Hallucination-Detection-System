"use client";

import { useEffect, useState } from "react";

const STAGES = [
  { step: "01", label: "Retrieving context", sub: "FAISS dense retrieval · top-3 docs" },
  { step: "02", label: "Similarity scoring", sub: "sentence-transformers · cosine similarity" },
  { step: "03", label: "NLI entailment",     sub: "DeBERTa cross-encoder · ENTAILMENT / CONTRADICTION" },
  { step: "04", label: "ML classification",  sub: "TruthfulQA logistic regression · P(hallucination)" },
  { step: "05", label: "Score aggregation",  sub: "weighted ensemble → final verdict" },
];

export default function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % STAGES.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-12 border-t border-ink/10 fade-up">
      <div className="max-w-lg mx-auto">
        {/* Animated scan box */}
        <div className="relative border border-ink/15 bg-white/40 h-20 mb-8 overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-accent/60 scanline" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-ink/30">
              Analysing…
            </span>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="space-y-3">
          {STAGES.map((stage, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 transition-all duration-300 ${
                i < activeStep
                  ? "opacity-40"
                  : i === activeStep
                  ? "opacity-100"
                  : "opacity-20"
              }`}
            >
              <span className="font-mono text-xs text-accent/70 flex-shrink-0">
                {stage.step}
              </span>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans text-ink">{stage.label}</span>
                  {i === activeStep && (
                    <span className="inline-flex gap-0.5">
                      {[0,1,2].map((dot) => (
                        <span
                          key={dot}
                          className="w-1 h-1 bg-accent rounded-full animate-bounce"
                          style={{ animationDelay: `${dot * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-ink/30 mt-0.5">{stage.sub}</p>
              </div>

              {i < activeStep && (
                <span className="text-signal-green font-mono text-xs flex-shrink-0">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
