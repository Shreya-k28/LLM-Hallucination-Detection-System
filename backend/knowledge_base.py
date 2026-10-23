"""
Closed-domain Knowledge Base
Uses FAISS + sentence-transformers for dense retrieval.
Corpus is seeded from TruthfulQA reference answers.
"""
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

CORPUS = [
    # Science
    "Einstein won the Nobel Prize in Physics in 1921 for his discovery of the law of the photoelectric effect, not for the theory of relativity.",
    "The speed of light in a vacuum is approximately 299,792,458 metres per second.",
    "Water boils at 100°C (212°F) at standard atmospheric pressure (1 atm).",
    "DNA has a double-helix structure, discovered by Watson and Crick in 1953 using X-ray data from Rosalind Franklin.",
    "The human body has 206 bones in adulthood.",
    "Gravity on Earth causes objects to accelerate at approximately 9.8 m/s².",
    "The sun is approximately 150 million kilometres (93 million miles) from Earth.",
    "The chemical formula for water is H₂O — two hydrogen atoms and one oxygen atom.",
    "Penicillin was discovered by Alexander Fleming in 1928.",
    "The Great Wall of China is NOT visible from space with the naked eye; this is a common myth.",
    "Lightning can and does strike the same place twice — tall structures like the Empire State Building are struck many times per year.",
    "We use far more than 10% of our brains; brain imaging shows all regions are active.",
    "Humans and chimpanzees share approximately 98–99% of their DNA.",
    "The Earth is approximately 4.5 billion years old.",
    "Oxygen makes up about 21% of Earth's atmosphere by volume.",
    # History
    "Alexander Graham Bell is credited with inventing the telephone in 1876.",
    "The Eiffel Tower was built between 1887 and 1889 for the 1889 World's Fair in Paris.",
    "World War I began in 1914 and ended in 1918. World War II began in 1939 and ended in 1945.",
    "The first moon landing occurred on July 20, 1969 with Apollo 11; Neil Armstrong was the first human to walk on the moon.",
    "The Berlin Wall fell on November 9, 1989.",
    "The American Declaration of Independence was signed in 1776.",
    "Christopher Columbus reached the Americas in 1492.",
    "The French Revolution began in 1789.",
    "Napoleon Bonaparte was exiled to Elba in 1814 and later to Saint Helena in 1815, where he died in 1821.",
    # Geography
    "Mount Everest is the highest mountain on Earth at 8,848.86 metres (29,031.7 feet) above sea level.",
    "The Amazon River is the largest river by water discharge in the world.",
    "The Nile River is often cited as the longest river in the world, though the Amazon is a close rival.",
    "Russia is the largest country by land area in the world.",
    "The Sahara is the largest hot desert in the world; Antarctica is the largest desert overall.",
    "Australia is both a country and a continent.",
    "The Pacific Ocean is the largest and deepest of Earth's oceanic divisions.",
    # Literature & Art
    "William Shakespeare wrote Romeo and Juliet, Hamlet, Macbeth, Othello, and 37 other plays.",
    "The Mona Lisa was painted by Leonardo da Vinci, likely between 1503 and 1519.",
    "George Orwell wrote 1984 and Animal Farm.",
    "Mary Shelley wrote Frankenstein, published in 1818.",
    "Charles Darwin published On the Origin of Species in 1859.",
    # Technology
    "The World Wide Web was invented by Tim Berners-Lee in 1989.",
    "Python was created by Guido van Rossum and first released in 1991.",
    "The first iPhone was released by Apple in June 2007.",
    "ENIAC, completed in 1945, is often considered one of the first general-purpose electronic computers.",
    # Common misconceptions / TruthfulQA-style
    "Humans did NOT evolve from chimpanzees; rather, humans and chimpanzees share a common ancestor.",
    "Napoleon Bonaparte was of average height for his time (~5 ft 7 in); the 'short Napoleon' is a myth partly due to a misunderstanding of French units.",
    "Bulls are NOT enraged by the color red; they are red-green colorblind and react to the movement of the matador's cape.",
    "Goldfish have memory spans longer than three seconds; they can remember things for months.",
    "There is no evidence that humans swallow spiders in their sleep; this is an urban myth.",
    "The Great Fire of London in 1666 destroyed much of the city but killed fewer people than commonly believed — official records show only six deaths.",
    "Frankenstein is the name of the scientist (Victor Frankenstein), not the monster, in Mary Shelley's novel.",
    "Vitamin C does NOT cure the common cold, though it may reduce the duration slightly.",
]


class KnowledgeBase:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.corpus = CORPUS
        self._build_index()

    def _build_index(self):
        embeddings = self.model.encode(self.corpus, convert_to_numpy=True, show_progress_bar=False)
        embeddings = embeddings.astype(np.float32)
        faiss.normalize_L2(embeddings)
        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)  # inner product after L2 norm = cosine similarity
        self.index.add(embeddings)

    def retrieve(self, query: str, top_k: int = 3) -> list[str]:
        q_emb = self.model.encode([query], convert_to_numpy=True).astype(np.float32)
        faiss.normalize_L2(q_emb)
        _, indices = self.index.search(q_emb, top_k)
        return [self.corpus[i] for i in indices[0] if i < len(self.corpus)]
