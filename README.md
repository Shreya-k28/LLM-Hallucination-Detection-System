# HalluciCheck — Free Edition
### 100% local · Zero paid APIs · Zero API keys

```
User Query
   ↓
Flan-T5 (local) generates answer
   ↓
Hallucination Detector
   ├── Self-consistency  (sample local model ×5, measure agreement)
   ├── Similarity        (sentence-transformers + FAISS)
   ├── NLI               (DeBERTa cross-encoder)
   └── ML Classifier     (trained on TruthfulQA)
   ↓
Output:
   - Hallucination label  (Hallucination | Grounded)
   - Confidence score     (0.0 – 1.0)
   - Per-module breakdown
```

---

## What's free and how

| Component | Model | Size | Cost |
|---|---|---|---|
| LLM answer generation | `google/flan-t5-base` | ~1 GB | FREE |
| Embeddings + similarity | `all-MiniLM-L6-v2` | ~90 MB | FREE |
| NLI entailment | `cross-encoder/nli-deberta-v3-small` | ~85 MB | FREE |
| ML classifier | SGDClassifier (you train it) | ~2 MB | FREE |
| Dataset | `domenicrosati/TruthfulQA` (HF) | ~5 MB | FREE |
| Frontend hosting | Vercel | — | FREE tier |
| Backend hosting | Railway / Render | — | FREE tier |

**Total cost: $0.00**

---

## Requirements

```
Python  3.10+
Node.js 18+
RAM     4 GB minimum (8 GB recommended)
Disk    ~1.5 GB  (for all downloaded models)
GPU     NOT required — all models run on CPU
```

---

## Local Development — Step by Step

### Step 1 — Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install all dependencies (no API keys needed)
pip install -r requirements.txt

# Train the ML classifier on TruthfulQA (~5 min, one-time)
python train_classifier.py

# Start the API server
uvicorn main:app --reload --port 8000
```

On first startup, Flan-T5 and the other models download automatically
to `~/.cache/huggingface`. This takes a few minutes the first time only.

Swagger docs: http://localhost:8000/docs

### Step 2 — Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

---

## Project Structure

```
hallucicheck-free/
├── backend/
│   ├── main.py               # FastAPI — POST /detect, GET /examples
│   ├── detector.py           # Orchestrator + weighted ensemble
│   ├── llm_client.py         # Flan-T5 local inference (NO API KEY)
│   ├── self_consistency.py   # Sample ×5, measure agreement
│   ├── knowledge_base.py     # FAISS dense retrieval
│   ├── similarity_module.py  # Cosine similarity
│   ├── nli_module.py         # DeBERTa NLI entailment
│   ├── classifier_module.py  # SGDClassifier inference
│   ├── train_classifier.py   # One-time training on TruthfulQA
│   └── requirements.txt      # No openai package
└── frontend/
    ├── src/app/page.tsx       # Main UI
    └── src/components/
        ├── ResultPanel.tsx    # Verdict banner
        ├── ScoreMeter.tsx     # SVG gauge
        ├── ModuleBreakdown.tsx # 4 module score bars
        ├── ContextDocs.tsx    # Retrieved KB docs
        └── LoadingState.tsx   # Pipeline step animator
```

---

## Deployment (Free)

### Backend → Railway (recommended for ML models)

Railway free tier gives 500 hours/month and 512 MB RAM
(upgrade to ~$5/mo Hobby plan for 1 GB RAM if needed for Flan-T5).

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login        # browser OAuth — no API key
cd backend
railway init
railway up
```

Create a `Procfile` in `backend/`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Also add a `build.sh` to run training on deploy:
```bash
#!/bin/bash
pip install -r requirements.txt
python train_classifier.py
```

Set in Railway dashboard: `BUILD_COMMAND = bash build.sh`

### Backend → Render (alternative free option)

1. Push `backend/` to GitHub
2. New Web Service on render.com (free tier)
3. Build command: `pip install -r requirements.txt && python train_classifier.py`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. No environment variables needed

### Frontend → Vercel

```bash
cd frontend

# Install CLI
npm i -g vercel
vercel login         # browser OAuth — no API key

# Set backend URL (from Railway/Render above)
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-backend.railway.app

vercel --prod
```

---

## Ensemble Weights

```
Final hallucination score =
    0.20 × (1 - self_consistency)   ← inconsistent = suspicious
  + 0.25 × (1 - similarity)         ← semantically distant = suspicious
  + 0.35 × (1 - nli_entailment)     ← not entailed = suspicious
  + 0.20 × classifier_score         ← TruthfulQA classifier
```

---

## Performance Notes

| Operation | Time (CPU, 8 GB RAM) |
|---|---|
| First startup (model downloads) | 5–10 min (one-time) |
| Subsequent startups | ~15 seconds |
| Single detection (all 4 modules) | ~8–15 seconds |
| Self-consistency (×5 samples) | ~10–20 seconds |

For faster inference, swap `flan-t5-base` → `flan-t5-small` in `llm_client.py`.
For better accuracy, swap to `flan-t5-large` (requires ~4 GB RAM).

---

## Dataset

TruthfulQA by domenicrosati:
https://huggingface.co/datasets/domenicrosati/TruthfulQA

---

## License

MIT — use freely in any project.
