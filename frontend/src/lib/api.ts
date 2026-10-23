// If `NEXT_PUBLIC_API_URL` is set (local dev), call the backend directly.
// If not set (typical Vercel deploy), call `/api/*` and rely on platform rewrites.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const API_PREFIX = API_URL ? "" : "/api";

export interface DetectionResult {
  query: string;
  answer: string;
  label: "Hallucination" | "Grounded";
  confidence: number;
  // Some backends include this; keep optional for compatibility.
  self_consistency?: number;
  similarity_score: number;
  nli_score: number;
  classifier_score: number;
  explanation: string;
  retrieved_context: string[];
}

export interface Example {
  query: string;
  category: string;
}

export async function detect(query: string, answer?: string): Promise<DetectionResult> {
  const res = await fetch(`${API_URL}${API_PREFIX}/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, answer }),
  });
  if (!res.ok) {
    // Backend errors are usually JSON, but if we ever get HTML/text (proxy, 404, etc)
    // we still want a useful message for debugging.
    const text = await res.text().catch(() => "");
    const maybeJson = (() => {
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return null;
      }
    })();

    const detail =
      typeof (maybeJson as any)?.detail === "string"
        ? (maybeJson as any).detail
        : Array.isArray((maybeJson as any)?.detail)
          ? (maybeJson as any).detail
              .map((d: any) => d?.msg || d?.message)
              .filter(Boolean)
              .join("; ")
          : text?.trim()
            ? text.trim().slice(0, 400)
            : null;

    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getExamples(): Promise<Example[]> {
  const res = await fetch(`${API_URL}${API_PREFIX}/examples`);
  if (!res.ok) return [];
  const data = await res.json();
  // Support either `{ examples: Example[] }` or a raw `Example[]` response.
  if (Array.isArray(data)) return data as Example[];
  return (data?.examples || []) as Example[];
}
