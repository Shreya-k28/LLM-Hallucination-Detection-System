"""
train_classifier.py
───────────────────
Downloads TruthfulQA from Hugging Face, builds embeddings,
trains an SGDClassifier (logistic regression), and saves
the model to classifier_model.pkl.

Run once before deployment:
    pip install datasets scikit-learn sentence-transformers
    python train_classifier.py
"""
import pickle
import numpy as np
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import SGDClassifier
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
OUTPUT_PATH = "classifier_model.pkl"

print("=" * 60)
print("TruthfulQA Classifier Training")
print("=" * 60)

# ── 1. Load TruthfulQA ────────────────────────────────────────────
print("\n[1/5] Downloading TruthfulQA from Hugging Face...")
ds = load_dataset("domenicrosati/TruthfulQA", split="train")
print(f"      Loaded {len(ds)} rows")

# ── 2. Build labelled pairs ───────────────────────────────────────
# TruthfulQA columns: question, correct_answers, incorrect_answers, ...
# We create:
#   positive (hallucination=1): question + one incorrect answer
#   negative (hallucination=0): question + one correct answer

print("\n[2/5] Building labelled (question, answer) pairs...")
queries, answers, labels = [], [], []

for row in ds:
    q = row["question"]

    # Correct answers → grounded (label 0)
    for ans in row.get("correct_answers", [])[:2]:
        if ans.strip():
            queries.append(q)
            answers.append(ans.strip())
            labels.append(0)

    # Incorrect answers → hallucinated (label 1)
    for ans in row.get("incorrect_answers", [])[:2]:
        if ans.strip():
            queries.append(q)
            answers.append(ans.strip())
            labels.append(1)

queries  = np.array(queries)
answers  = np.array(answers)
labels   = np.array(labels)

print(f"      Total samples : {len(labels)}")
print(f"      Grounded (0)  : {(labels == 0).sum()}")
print(f"      Hallucinated (1): {(labels == 1).sum()}")

# ── 3. Embed ─────────────────────────────────────────────────────
print("\n[3/5] Generating sentence embeddings (this may take a few minutes)...")
model = SentenceTransformer(EMBEDDING_MODEL)

q_embs = model.encode(queries.tolist(),  show_progress_bar=True, batch_size=128)
a_embs = model.encode(answers.tolist(),  show_progress_bar=True, batch_size=128)

# Feature = concatenation of query + answer embeddings (dim = 2 × 384 = 768)
X = np.concatenate([q_embs, a_embs], axis=1).astype(np.float32)
y = labels

print(f"      Feature matrix shape: {X.shape}")

# ── 4. Train / Evaluate ───────────────────────────────────────────
print("\n[4/5] Training logistic regression classifier...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

clf = Pipeline([
    ("scaler", StandardScaler()),
    ("lr", SGDClassifier(
        loss="modified_huber",   # smooth approximation → gives probabilities
        alpha=1e-4,
        max_iter=200,
        random_state=42,
        class_weight="balanced",
    )),
])

clf.fit(X_train, y_train)

print("\n── Test set evaluation ──────────────────────────────────")
y_pred = clf.predict(X_test)
print(classification_report(y_test, y_pred, target_names=["Grounded", "Hallucinated"]))

cv_scores = cross_val_score(clf, X, y, cv=5, scoring="f1")
print(f"5-fold CV F1: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ── 5. Save ───────────────────────────────────────────────────────
print(f"\n[5/5] Saving classifier to {OUTPUT_PATH}...")
with open(OUTPUT_PATH, "wb") as f:
    pickle.dump(clf, f)

print("Done! ✓")
print(f"Model saved → {OUTPUT_PATH}")
print("\nNow run:  uvicorn main:app --reload")
