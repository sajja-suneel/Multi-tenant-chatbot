import logging
from typing import List
from sentence_transformers import SentenceTransformer

logger = logging.getLogger("app.rag.embeddings")

class EmbeddingManager:
    _model: SentenceTransformer = None
    model_name = "all-MiniLM-L6-v2"

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            logger.info(f"Loading SentenceTransformer model: {cls.model_name}...")
            cls._model = SentenceTransformer(cls.model_name)
            logger.info("SentenceTransformer model loaded successfully.")
        return cls._model

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        """Generate vector embedding for a single text string."""
        model = cls.get_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    @classmethod
    def get_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings for a list of text strings."""
        if not texts:
            return []
        model = cls.get_model()
        embeddings = model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()