import json
import os
import math
from collections import Counter

_index = None

_STOPWORDS = {
    "was", "ist", "ein", "eine", "einer", "einem", "einen", "eines",
    "der", "die", "das", "dem", "den", "des",
    "und", "oder", "aber", "auch", "nicht", "noch",
    "in", "im", "an", "am", "auf", "aus", "bei", "mit", "nach",
    "von", "vor", "zu", "zum", "zur", "für", "über", "unter",
    "er", "sie", "es", "wir", "ihr", "ich", "du",
    "sein", "sind", "wird", "werden", "haben", "hat", "wurde",
    "kann", "wie", "als", "dann", "wenn", "sich", "je",
}


def _tokenize(text: str) -> list[str]:
    return [t for t in text.lower().split() if t not in _STOPWORDS and len(t) > 1]


def _build_index(chunks: list[dict]) -> dict:
    doc_tokens = [_tokenize(c["content"] + " " + c["title"] + " " + c["title"]) for c in chunks]

    N = len(chunks)
    df: Counter = Counter()
    for tokens in doc_tokens:
        for term in set(tokens):
            df[term] += 1

    idf = {term: math.log(N / (freq + 1)) for term, freq in df.items()}

    vectors = []
    for tokens in doc_tokens:
        tf = Counter(tokens)
        total = len(tokens) or 1
        vec = {term: (count / total) * idf.get(term, 0) for term, count in tf.items()}
        vectors.append(vec)

    return {"chunks": chunks, "vectors": vectors, "idf": idf}


def get_index() -> dict:
    global _index
    if _index is not None:
        return _index

    data_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", "mock_knowledge.json"
    )
    with open(data_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    _index = _build_index(chunks)
    return _index
