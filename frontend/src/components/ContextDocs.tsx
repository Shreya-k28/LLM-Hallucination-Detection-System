"use client";

interface Props {
  docs: string[];
}

export default function ContextDocs({ docs }: Props) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-3">
        Retrieved Context
      </p>
      <div className="border border-ink/10 bg-white/50 p-5 space-y-3">
        {docs.length === 0 ? (
          <p className="text-sm text-ink/40 italic">No context retrieved.</p>
        ) : (
          docs.map((doc, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono text-[10px] text-accent/60 flex-shrink-0 pt-0.5">
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <p className="text-sm text-ink/70 leading-relaxed font-light">{doc}</p>
            </div>
          ))
        )}
        <div className="pt-2 border-t border-ink/8">
          <p className="text-[10px] font-mono text-ink/25 uppercase tracking-wider">
            Source: closed-domain knowledge base · FAISS dense retrieval
          </p>
        </div>
      </div>
    </div>
  );
}
