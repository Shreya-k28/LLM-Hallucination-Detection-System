"""
self_consistency.py
────────────────────
Samples the local Flan-T5 model N times at high temperature,
then measures pairwise agreement.

High agreement  → model is "sure" → low hallucination risk → high groundedness score
Low agreement   → model is "guessing" → high hallucination risk → low groundedness score
"""
from difflib import SequenceMatcher
from itertools import combinations
from llm_client import get_multiple_responses


def _pairwise_similarity(a: str, b: str) -> float:
    """Token-level sequence similarity in [0, 1]."""
    return SequenceMatcher(None, a.lower().split(), b.lower().split()).ratio()


def self_consistency_score(query: str, n: int = 5) -> float:
    """
    Returns a groundedness score in [0, 1].
    1.0 = all N samples are identical (perfectly consistent).
    0.0 = all N samples completely disagree (maximally inconsistent).
    """
    samples = get_multiple_responses(query, n=n)

    pairs = list(combinations(samples, 2))
    if not pairs:
        return 0.5   # neutral fallback

    similarities = [_pairwise_similarity(a, b) for a, b in pairs]
    return round(sum(similarities) / len(similarities), 4)
