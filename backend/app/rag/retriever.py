import math
from collections import Counter

from app.rag.knowledge_base import get_index, _tokenize
from app.models.schemas import SourceChunk


def _cosine_similarity(vec1: dict, vec2: dict) -> float:
    dot = sum(vec1.get(term, 0) * val for term, val in vec2.items())
    norm1 = math.sqrt(sum(v**2 for v in vec1.values()))
    norm2 = math.sqrt(sum(v**2 for v in vec2.values()))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


def retrieve(query: str, n_results: int = 5) -> list[SourceChunk]:
    index = get_index()
    chunks = index["chunks"]
    vectors = index["vectors"]
    idf = index["idf"]

    query_tokens = _tokenize(query)
    tf = Counter(query_tokens)
    total = len(query_tokens) or 1
    query_vec = {
        term: (count / total) * idf.get(term, 0) for term, count in tf.items()
    }

    scores = []
    for i, chunk in enumerate(chunks):
        tfidf_score = _cosine_similarity(vectors[i], query_vec)

        # Title keyword bonus: boost docs whose title contains query terms
        title_lower = chunk["title"].lower()
        category_lower = chunk["category"].lower()
        title_bonus = sum(
            0.3 for term in query_tokens
            if term in title_lower or term in category_lower
        )

        scores.append((i, tfidf_score + title_bonus))

    scores.sort(key=lambda x: x[1], reverse=True)

    sources = []
    for i, score in scores[:n_results]:
        chunk = chunks[i]
        sources.append(
            SourceChunk(
                id=chunk["id"],
                title=chunk["title"],
                content=chunk["content"],
                category=chunk["category"],
                relevance_score=round(min(score, 1.0), 4),
            )
        )

    return sources
