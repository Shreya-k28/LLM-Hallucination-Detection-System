"""
NLI (Natural Language Inference) Module
Uses a cross-encoder NLI model to check whether retrieved
documents ENTAIL the LLM's answer.

ENTAILMENT   → document supports answer     → low hallucination
NEUTRAL      → neither supports nor refutes → medium
CONTRADICTION → document contradicts answer → high hallucination
"""
import numpy as np
from transformers import pipeline


class NLIModule:
    def __init__(self, model_name: str = "cross-encoder/nli-deberta-v3-small"):
        """
        cross-encoder/nli-deberta-v3-small:
          - ~85 MB download
          - Labels: ENTAILMENT, NEUTRAL, CONTRADICTION
          - Fast enough for API latency
        """
        self.pipe = pipeline(
            "text-classification",
            model=model_name,
            truncation=True,
            max_length=512,
        )
        self.label_map = {
            "ENTAILMENT": 1.0,
            "NEUTRAL": 0.5,
            "CONTRADICTION": 0.0,
        }

    def score(self, answer: str, context_docs: list[str]) -> float:
        """
        Returns a groundedness score in [0, 1].
        1.0 = all docs strongly entail the answer.
        0.0 = all docs contradict the answer.
        """
        if not context_docs:
            return 0.5

        scores = []
        for doc in context_docs:
            # Premise = retrieved fact, Hypothesis = LLM answer
            result = self.pipe(
                f"{doc} [SEP] {answer}",
                truncation=True,
                max_length=512,
            )[0]

            label = result["label"].upper()
            confidence = result["score"]

            # Map label to [0,1] groundedness, weighted by model confidence
            base = self.label_map.get(label, 0.5)
            # Interpolate toward 0.5 when confidence is low
            weighted = 0.5 + (base - 0.5) * confidence
            scores.append(weighted)

        avg = float(np.mean(scores))
        return round(float(np.clip(avg, 0.0, 1.0)), 4)
