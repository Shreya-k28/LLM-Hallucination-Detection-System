"""
Similarity Module
Measures semantic similarity between the LLM's answer
and the retrieved knowledge-base documents.
High score → answer is semantically close to known facts → less likely hallucinated.
"""
import numpy as np
from sentence_transformers import SentenceTransformer, util


class SimilarityModule:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def score(self, answer: str, context_docs: list[str]) -> float:
        """
        Returns a groundedness score in [0, 1].
        1.0 = answer is perfectly aligned with retrieved context.
        0.0 = answer has nothing in common with context.
        """
        if not context_docs:
            return 0.5  # neutral if no context

        answer_emb = self.model.encode(answer, convert_to_tensor=True)
        context_embs = self.model.encode(context_docs, convert_to_tensor=True)

        # Cosine similarities: shape (len(context_docs),)
        cosine_scores = util.cos_sim(answer_emb, context_embs)[0].cpu().numpy()

        # Max-pooled similarity (most relevant doc drives the score)
        max_sim = float(np.max(cosine_scores))

        # Normalise from [-1,1] to [0,1]
        normalized = (max_sim + 1.0) / 2.0
        return round(float(np.clip(normalized, 0.0, 1.0)), 4)
