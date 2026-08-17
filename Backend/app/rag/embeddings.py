import logging
from typing import List

logger = logging.getLogger("app.rag.embeddings")

class EmbeddingManager:
    _model = None
    model_name = "BAAI/bge-small-en-v1.5"

    @classmethod
    def get_model(cls):
        if cls._model is None:
            logger.info(f"Loading FastEmbed ONNX model: {cls.model_name}...")
            try:
                from fastembed import TextEmbedding
                cls._model = TextEmbedding(model_name=cls.model_name)
                logger.info("FastEmbed model loaded successfully (Lightweight ONNX runtime).")
            except Exception as e:
                logger.warning(f"FastEmbed load failed ({str(e)}), trying sentence_transformers fallback...")
                from sentence_transformers import SentenceTransformer
                cls._model = SentenceTransformer("all-MiniLM-L6-v2")
        return cls._model

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        """Generate vector embedding for a single text string."""
        model = cls.get_model()
        if hasattr(model, "embed"):
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
        if hasattr(model, "embed"):
            embeddings = list(model.embed(texts))
            return [e.tolist() for e in embeddings]
        else:
            embeddings = model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()