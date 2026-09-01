import logging
from typing import List

logger = logging.getLogger("app.rag.embeddings")

class EmbeddingManager:
    _model = None
    _is_fastembed: bool = False
    model_name = "sentence-transformers/all-MiniLM-L6-v2"

    @classmethod
    def get_model(cls):
        if cls._model is None:
            try:
                logger.info(f"Loading FastEmbed TextEmbedding model ({cls.model_name})...")
                from fastembed import TextEmbedding
                cls._model = TextEmbedding(model_name=cls.model_name)
                cls._is_fastembed = True
                logger.info("FastEmbed model loaded successfully (~40MB RAM).")
            except Exception as e:
                logger.warning(f"FastEmbed initialization failed ({str(e)}). Falling back to SentenceTransformer...")
                from sentence_transformers import SentenceTransformer
                cls._model = SentenceTransformer("all-MiniLM-L6-v2")
                cls._is_fastembed = False
                logger.info("SentenceTransformer model loaded successfully.")
        return cls._model

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        """Generate vector embedding for a single text string."""
        model = cls.get_model()
        if cls._is_fastembed:
            embeddings = list(model.embed([text]))
            return embeddings[0].tolist()
        else:
            embedding = model.encode(text, convert_to_numpy=True)
            return embedding.tolist()

    @classmethod
    def get_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings for a list of text strings."""
        if not texts:
            return []
        model = cls.get_model()
        if cls._is_fastembed:
            embeddings = list(model.embed(texts, batch_size=32))
            return [e.tolist() for e in embeddings]
        else:
            embeddings = model.encode(texts, batch_size=32, convert_to_numpy=True)
            return embeddings.tolist()