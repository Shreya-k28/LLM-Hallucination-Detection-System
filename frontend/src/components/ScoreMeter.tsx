"use client";

import { useEffect, useState } from "react";
import { DetectionResult } from "@/lib/api";

interface Props {
  result: DetectionResult;
}

export default function ScoreMeter({ result }: Props) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [result]);

  const pct = result.confidence;
  const isHal = result.label === "Hallucination";

  // SVG arc calculation
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;
  const strokeDash = animated ? circumference * pct : 0;

  const color = isHal ? "#8b1a1a" : "#1a7a4a";

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-4">
        Overall Confidence
      </p>

      <div className="border border-ink/10 bg-white/50 p-6 flex items-center gap-6">
        {/* SVG gauge */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {/* Track */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="rgba(10,10,10,0.08)"
              strokeWidth="8"
            />
            {/* Progress arc */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - strokeDash}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
            {/* Center text */}
            <text
              x={cx} y={cy - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontWeight="700"
              fontSize="18"
              fill={color}
            >
              {Math.round(pct * 100)}%
            </text>
            <text
              x={cx} y={cy + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize="9"
              fill="rgba(10,10,10,0.4)"
            >
              HALLUCINATION
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3 flex-1">
          {[
            { label: "Certain Hallucination", range: "≥ 70%", active: pct >= 0.7 },
            { label: "Uncertain / Mixed",     range: "40–69%", active: pct >= 0.4 && pct < 0.7 },
            { label: "Likely Grounded",       range: "< 40%",  active: pct < 0.4  },
          ].map((tier) => (
            <div key={tier.label} className={`flex items-center gap-2 ${tier.active ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                tier.active
                  ? (pct >= 0.5 ? "bg-signal-red" : "bg-signal-green")
                  : "bg-ink/20"
              }`} />
              <span className="text-xs font-sans text-ink/70">{tier.label}</span>
              <span className="text-[10px] font-mono text-ink/30 ml-auto">{tier.range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
