#!/bin/bash
# Railway build script — runs once on deploy
set -e

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Training ML classifier on TruthfulQA..."
python train_classifier.py

echo "Build complete."
