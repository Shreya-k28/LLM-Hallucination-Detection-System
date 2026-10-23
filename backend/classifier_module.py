"""
ML Classifier Module
Trains a lightweight classifier on TruthfulQA embeddings.
Uses sentence-transformer embeddings as features.
Outputs: P(hallucination) in [0, 1].

Training is done once via train_classifier.py; the model
is saved to classifier_model.pkl and loaded at startup.
"""
import os
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer


MODEL_PATH = os.path.join(os.path.dirname(__file__), "classifier_model.pkl")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"


class ClassifierModule:
    def __init__(self):
        self.embedder = SentenceTransformer(EMBEDDING_MODEL)
        self.clf = None
        self._load()

    def _load(self):
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, "rb") as f:
                self.clf = pickle.load(f)
        else:
            # Fallback: rule-based heuristic (no trained model yet)
            self.clf = None

    def _embed(self, query: str, answer: str) -> np.ndarray:
        """Concatenate query + answer embeddings as feature vector."""
        q_emb = self.embedder.encode(query, convert_to_numpy=True)
        a_emb = self.embedder.encode(answer, convert_to_numpy=True)
        return np.concatenate([q_emb, a_emb]).reshape(1, -1)

    def score(self, query: str, answer: str) -> float:
        """
        Returns P(hallucination) in [0, 1].
        1.0 = classifier is certain this is hallucinated.
        0.0 = classifier is certain this is grounded.
        """
        if self.clf is None:
            return self._heuristic(query, answer)

        feat = self._embed(query, answer)
        try:
            proba = self.clf.predict_proba(feat)[0]
            # proba[1] = probability of class 1 = hallucination
            classes = list(self.clf.classes_)
            hal_idx = classes.index(1) if 1 in classes else -1
            if hal_idx >= 0:
                return round(float(proba[hal_idx]), 4)
            return 0.5
        except Exception:
            return self._heuristic(query, answer)

    def _heuristic(self, query: str, answer: str) -> float:
        """
        Simple fallback when no trained model is available.
        Flags common hallucination patterns based on keywords.
        """
        answer_lower = answer.lower()
        query_lower = query.lower()

        red_flags = [
            "i'm not sure but",
            "i believe",
            "i think",
            "it might be",
            "approximately",
            "i cannot verify",
            "as far as i know",
        ]
        uncertainty_score = sum(1 for f in red_flags if f in answer_lower) * 0.12

        contradiction_pairs = [
            ("visible from space", "great wall"),
            ("10% of our brain", "brain"),
            ("evolved from chimps", "chimpanzee"),
            ("relativity", "nobel"),
        ]
        contradiction_score = 0.0
        for kw1, kw2 in contradiction_pairs:
            if kw1 in answer_lower and kw2 in query_lower:
                contradiction_score = 0.75
                break

        score = min(1.0, uncertainty_score + contradiction_score)
        return round(score, 4)
