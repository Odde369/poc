import json
import os
import math
from collections import Counter

_index = None


def _tokenize(text: str) -> list[str]:
    return text.lower().split()


def _build_index(chunks: list[dict]) -> dict:
    doc_tokens = [_tokenize(c["content"] + " " + (c["title"] + " ") * 3) for c in chunks]

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
