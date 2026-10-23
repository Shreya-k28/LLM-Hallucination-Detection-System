"""
detector.py — Core orchestrator (fully local, zero paid APIs)

Pipeline:
  1. Flan-T5 generates the answer locally
  2. Similarity module   (sentence-transformers)
  3. NLI module          (DeBERTa cross-encoder)
  4. ML classifier       (trained on TruthfulQA)
  → Weighted ensemble → hallucination label + confidence
"""
import numpy as np

from llm_client import generate_answer, get_multiple_responses
from similarity_module import SimilarityModule
from nli_module import NLIModule
from classifier_module import ClassifierModule
from knowledge_base import KnowledgeBase
from self_consistency import self_consistency_score


class HallucinationDetector:
    def __init__(self):
        print("[Detector] Initialising modules …")
        self.kb         = KnowledgeBase()
        self.similarity = SimilarityModule()
        self.nli        = NLIModule()
        self.classifier = ClassifierModule()
        print("[Detector] All modules ready.")

        # Ensemble weights (tuned on TruthfulQA validation split)
        self.weights = {
            "self_consistency": 0.20,
            "similarity":       0.25,
            "nli":              0.35,
            "classifier":       0.20,
        }

    def detect(self, query: str, provided_answer: str | None = None) -> dict:
        # ── 1. Generate answer locally ────────────────────────────
        answer = provided_answer or generate_answer(query)

        # ── 2. Retrieve relevant context from closed-domain KB ────
        context_docs = self.kb.retrieve(query, top_k=3)

        # ── 3. Self-consistency (sample 5 local answers) ──────────
        sc_groundedness = self_consistency_score(query)      # high = consistent = grounded

        # ── 4. Semantic similarity ────────────────────────────────
        sim_score = self.similarity.score(answer, context_docs)

        # ── 5. NLI entailment ─────────────────────────────────────
        nli_score = self.nli.score(answer, context_docs)

        # ── 6. ML classifier ─────────────────────────────────────
        clf_hal = self.classifier.score(query, answer)       # high = hallucinated

        # ── 7. Convert to hallucination probability ───────────────
        #   similarity & nli & sc are "groundedness" → invert
        hal_prob = (
            self.weights["self_consistency"] * (1.0 - sc_groundedness) +
            self.weights["similarity"]       * (1.0 - sim_score)       +
            self.weights["nli"]              * (1.0 - nli_score)       +
            self.weights["classifier"]       * clf_hal
        )
        hal_prob = float(np.clip(hal_prob, 0.0, 1.0))

        label = "Hallucination" if hal_prob >= 0.5 else "Grounded"

        explanation = self._explain(hal_prob, sc_groundedness, sim_score, nli_score, clf_hal)

        return {
            "query":              query,
            "answer":             answer,
            "label":              label,
            "confidence":         round(hal_prob, 4),
            "self_consistency":   round(sc_groundedness, 4),
            "similarity_score":   round(sim_score, 4),
            "nli_score":          round(nli_score, 4),
            "classifier_score":   round(clf_hal, 4),
            "explanation":        explanation,
            "retrieved_context":  context_docs,
        }

    def _explain(self, hal_prob, sc, sim, nli, clf):
        parts = []
        if sc < 0.4:
            parts.append("model gave inconsistent answers across multiple samples")
        elif sc > 0.7:
            parts.append("model answered consistently across multiple samples")

        if sim < 0.35:
            parts.append("answer is semantically distant from retrieved facts")
        elif sim > 0.7:
            parts.append("answer closely matches retrieved facts")

        if nli < 0.4:
            parts.append("retrieved documents do not entail the answer")
        elif nli > 0.7:
            parts.append("retrieved documents strongly support the answer")

        if clf > 0.6:
            parts.append("ML classifier flags this as likely hallucinated")
        elif clf < 0.35:
            parts.append("ML classifier considers this answer trustworthy")

        if not parts:
            parts = ["mixed signals from all four detection modules"]

        risk = "HIGH" if hal_prob >= 0.7 else ("MEDIUM" if hal_prob >= 0.4 else "LOW")
        return f"[{risk} RISK] " + "; ".join(parts).capitalize() + "."
