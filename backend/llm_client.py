"""
llm_client.py
─────────────
100% local LLM using google/flan-t5-base via Hugging Face transformers.
No API key. No internet call at inference time.
Model is downloaded once (~1 GB) to ~/.cache/huggingface on first run.

Why flan-t5-base?
  - Free, open weights (Apache 2.0)
  - Runs on CPU in ~2-4 seconds per query
  - Good instruction-following for Q&A tasks
  - No GPU required
"""
from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch

MODEL_NAME = "google/flan-t5-base"

# Singleton — loaded once per process
_model = None
_tokenizer = None


def _load():
    global _model, _tokenizer
    if _model is None:
        print(f"[LLM] Loading {MODEL_NAME} … (first run downloads ~1 GB)")
        _tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)
        _model = T5ForConditionalGeneration.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float32,   # float32 for CPU stability
        )
        _model.eval()
        print("[LLM] Model ready.")


def generate_answer(query: str, max_new_tokens: int = 128) -> str:
    """
    Generate a factual answer to a query using Flan-T5.
    Returns a plain string answer.
    """
    _load()

    # Flan-T5 responds well to explicit instruction prompts
    prompt = (
        f"Answer the following question accurately and concisely. "
        f"If you are not sure, say so.\n\n"
        f"Question: {query}\n\n"
        f"Answer:"
    )

    inputs = _tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    )

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            num_beams=4,              # beam search for better quality
            early_stopping=True,
            no_repeat_ngram_size=3,
        )

    answer = _tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
    return answer if answer else "I don't know."


def get_multiple_responses(query: str, n: int = 5) -> list[str]:
    """
    Sample N diverse answers for self-consistency scoring.
    Uses nucleus sampling (do_sample=True) to get variation.
    """
    _load()

    prompt = (
        f"Answer the following question accurately and concisely.\n\n"
        f"Question: {query}\n\nAnswer:"
    )

    inputs = _tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    )

    responses = []
    with torch.no_grad():
        for _ in range(n):
            output = _model.generate(
                **inputs,
                max_new_tokens=80,
                do_sample=True,
                top_p=0.92,
                temperature=0.9,
            )
            text = _tokenizer.decode(output[0], skip_special_tokens=True).strip()
            responses.append(text if text else "I don't know.")

    return responses
