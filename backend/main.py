"""
main.py — FastAPI app (100% local, zero paid APIs)
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from detector import HallucinationDetector

app = FastAPI(title="HalluciCheck API — Free Edition", version="2.0.0")

# ✅ CORS (no issue here, just cleaned formatting)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Singleton detector (loads once)
_detector: Optional[HallucinationDetector] = None


def get_detector() -> HallucinationDetector:
    global _detector
    if _detector is None:
        print("🔄 Loading Hallucination Detector... (first time)")
        _detector = HallucinationDetector()
        print("✅ Detector Loaded Successfully")
    return _detector


# ── Schemas ───────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str
    answer: Optional[str] = None


class DetectionResult(BaseModel):
    query: str
    answer: str
    label: str
    confidence: float
    self_consistency: float
    similarity_score: float
    nli_score: float
    classifier_score: float
    explanation: str
    retrieved_context: List[str]


# ── Routes ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "mode": "fully-local, no paid APIs"}


@app.post("/detect", response_model=DetectionResult)
def detect(req: QueryRequest):
    try:
        print("\n📥 Incoming Request")
        print("Query:", req.query)
        print("Answer:", req.answer)

        detector = get_detector()

        result = detector.detect(
            query=req.query,
            provided_answer=req.answer
        )

        print("📤 Result Generated Successfully\n")

        return result

    except Exception as e:
        import traceback
        print("❌ ERROR OCCURRED:")
        traceback.print_exc()   # 🔥 FULL ERROR in terminal

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/examples")
def get_examples():
    return {
        "examples": [
            {"query": "Did Einstein win the Nobel Prize for the theory of relativity?", "category": "Science"},
            {"query": "Who invented the telephone?", "category": "History"},
            {"query": "What is the boiling point of water at sea level?", "category": "Science"},
            {"query": "Was the Eiffel Tower built in 1850?", "category": "History"},
            {"query": "Is the Great Wall of China visible from space?", "category": "Myth vs Fact"},
            {"query": "Who wrote Romeo and Juliet?", "category": "Literature"},
            {"query": "Did Napoleon Bonaparte have a very short height?", "category": "Myth vs Fact"},
            {"query": "Do humans only use 10 percent of their brain?", "category": "Myth vs Fact"},
        ]
    }
