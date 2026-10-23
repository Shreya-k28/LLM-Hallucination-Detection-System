"use client";

import { useState, useEffect, useRef } from "react";
import { detect, getExamples, DetectionResult, Example } from "@/lib/api";
import ResultPanel from "@/components/ResultPanel";
import ScoreMeter from "@/components/ScoreMeter";
import ModuleBreakdown from "@/components/ModuleBreakdown";
import ContextDocs from "@/components/ContextDocs";
import LoadingState from "@/components/LoadingState";

const FALLBACK_EXAMPLES: Example[] = [
  { category: "Health", query: "Can vitamin C prevent the common cold?" },
  { category: "Science", query: "Do vaccines cause autism?" },
  { category: "History", query: "Did Cleopatra live closer to the Moon landing than the pyramids?" },
  { category: "Geography", query: "Is the Great Wall of China visible from space?" },
  { category: "Biology", query: "Do humans use only 10% of their brains?" },
  { category: "Space", query: "Is there liquid water on Mars today?" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [examplesLoading, setExamplesLoading] = useState(true);
  const [examplesError, setExamplesError] = useState<string | null>(null);
  const [showAnswerField, setShowAnswerField] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ex = await getExamples();
        if (!alive) return;
        if (Array.isArray(ex) && ex.length > 0) {
          setExamples(ex);
        } else {
          setExamples(FALLBACK_EXAMPLES);
        }
      } catch {
        if (!alive) return;
        setExamplesError("Backend not reachable — showing built-in examples.");
        setExamples(FALLBACK_EXAMPLES);
      } finally {
        if (!alive) return;
        setExamplesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleDetect = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await detect(query, answer || undefined);
      setResult(r);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      setError(e.message || "Detection failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (ex: Example) => {
    setQuery(ex.query);
    setAnswer("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="noise grid-bg min-h-screen">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="border-b border-ink/10 bg-chalk/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-ink flex items-center justify-center">
                <div className="w-3 h-3 bg-ink" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">HalluciCheck</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-ink/40 uppercase tracking-widest">v1.0</span>
            <div className="w-px h-4 bg-ink/20" />
            <span className="text-xs font-mono text-ink/40">TruthfulQA</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">

        {/* ── Hero ────────────────────────────────────────────────── */}
        <div className="pt-16 pb-12 border-b border-ink/10">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4">
              Closed-Domain · LLM Verification
            </p>
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-none tracking-tight text-ink mb-6">
              Detect what
              <br />
              <em className="not-italic text-ink/30">the model</em>
              <br />
              invented.
            </h1>
            <p className="text-ink/60 text-base leading-relaxed max-w-lg font-light">
              Three-signal hallucination detection using semantic similarity,
              natural language inference, and an ML classifier trained on{" "}
              <span className="font-mono text-sm bg-ink/5 px-1 rounded">TruthfulQA</span>.
            </p>
          </div>
        </div>

        {/* ── Detection Interface ─────────────────────────────────── */}
        <div className="py-12 grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Input column */}
          <div className="lg:col-span-3 space-y-6">

            {/* Query input */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">
                Query
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) handleDetect();
                }}
                placeholder="Enter a question to evaluate…"
                rows={3}
                className="w-full bg-white/60 border border-ink/15 rounded-none p-4
                           font-sans text-base text-ink placeholder:text-ink/30
                           resize-none focus:outline-none focus:border-accent
                           transition-colors"
              />
            </div>

            {/* Optional answer toggle */}
            <div>
              <button
                onClick={() => setShowAnswerField(!showAnswerField)}
                className="text-xs font-mono text-ink/40 hover:text-ink transition-colors flex items-center gap-2"
              >
                <span className={`transition-transform ${showAnswerField ? "rotate-90" : ""}`}>›</span>
                {showAnswerField ? "Hide" : "Provide"} a custom answer (optional — we generate one otherwise)
              </button>

              {showAnswerField && (
                <div className="mt-3 fade-up">
                  <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">
                    LLM Answer to Test
                  </label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Paste the LLM's answer here…"
                    rows={3}
                    className="w-full bg-white/60 border border-ink/15 rounded-none p-4
                               font-sans text-base text-ink placeholder:text-ink/30
                               resize-none focus:outline-none focus:border-accent
                               transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleDetect}
              disabled={loading || !query.trim()}
              className="relative group w-full bg-ink text-chalk font-mono text-sm
                         uppercase tracking-widest py-4 px-6
                         disabled:opacity-40 disabled:cursor-not-allowed
                         hover:bg-ink/90 transition-colors overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="inline-block w-1 h-4 bg-chalk/50 animate-[ping_0.8s_ease-in-out_infinite]" />
                  <span className="inline-block w-1 h-4 bg-chalk/70 animate-[ping_0.8s_ease-in-out_infinite_0.15s]" />
                  <span className="inline-block w-1 h-4 bg-chalk animate-[ping_0.8s_ease-in-out_infinite_0.3s]" />
                  &nbsp; Analysing…
                </span>
              ) : (
                <>
                  Run Detection
                  <span className="ml-3 text-ink/30 group-hover:text-chalk/40 transition-colors text-xs">
                    ⌘↵
                  </span>
                </>
              )}
              {/* Shimmer on hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 shimmer transition-opacity" />
            </button>

            {error && (
              <div className="border border-signal-red/30 bg-signal-red-light p-4 fade-up">
                <p className="font-mono text-xs text-signal-red">{error}</p>
              </div>
            )}
          </div>

          {/* Examples sidebar */}
          <div className="lg:col-span-2">
            <p className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-4">
              Example queries
            </p>
            {examplesError && (
              <div className="mb-3 border border-ink/10 bg-white/40 px-3 py-2">
                <p className="text-[11px] font-mono text-ink/50">{examplesError}</p>
              </div>
            )}
            <div className="space-y-2">
              {examplesLoading ? (
                // Skeleton
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 bg-ink/5 animate-pulse" />
                ))
              ) : (
                examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleExample(ex)}
                    className="w-full text-left border border-ink/10 bg-white/40
                               hover:bg-white/80 hover:border-accent/50
                               p-3 transition-all group"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-widest
                                     text-accent/70 group-hover:text-accent block mb-1">
                      {ex.category}
                    </span>
                    <span className="text-sm text-ink/70 group-hover:text-ink transition-colors leading-tight">
                      {ex.query}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Loading State ───────────────────────────────────────── */}
        {loading && <LoadingState />}

        {/* ── Results ─────────────────────────────────────────────── */}
        {result && !loading && (
          <div ref={resultRef} className="border-t border-ink/10 pt-12 space-y-10 fade-up">

            {/* Verdict banner */}
            <ResultPanel result={result} />

            {/* Score breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ScoreMeter result={result} />
              <ModuleBreakdown result={result} />
            </div>

            {/* Answer + context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Generated answer */}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-3">
                  LLM Answer
                </p>
                <div className="border border-ink/10 bg-white/50 p-5">
                  <p className="text-sm text-ink/80 leading-relaxed font-light">
                    {result.answer}
                  </p>
                </div>
              </div>

              {/* Retrieved context */}
              <ContextDocs docs={result.retrieved_context} />
            </div>

            {/* Explanation */}
            <div className="border-l-2 border-accent/50 pl-5">
              <p className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-2">
                Explanation
              </p>
              <p className="text-sm text-ink/70 leading-relaxed">{result.explanation}</p>
            </div>

            {/* Reset */}
            <div className="text-center pt-4">
              <button
                onClick={() => { setResult(null); setQuery(""); setAnswer(""); }}
                className="text-xs font-mono uppercase tracking-widest text-ink/30
                           hover:text-ink transition-colors border-b border-transparent
                           hover:border-ink/20 pb-0.5"
              >
                ← Run another detection
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-ink/10 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-ink/30">
            HalluciCheck · Similarity + NLI + ML Classifier
          </p>
          <p className="text-xs font-mono text-ink/30">
            Dataset:{" "}
            <a
              href="https://huggingface.co/datasets/domenicrosati/TruthfulQA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/70 transition-colors"
            >
              domenicrosati/TruthfulQA
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
