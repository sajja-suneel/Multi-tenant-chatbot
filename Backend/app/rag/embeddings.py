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
                try:
                    from sentence_transformers import SentenceTransformer
                    cls._model = SentenceTransformer("all-MiniLM-L6-v2")
                    cls._is_fastembed = False
                    logger.info("SentenceTransformer model loaded successfully.")
                except Exception as err:
                    logger.error(f"Both FastEmbed and SentenceTransformer failed to load: {str(err)}")
                    cls._model = None
        return cls._model

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        """Generate vector embedding safely for a single text string."""
        safe_text = str(text).strip() if text else ""
        if not safe_text:
            return [0.0] * 384

        embeddings = cls.get_embeddings([safe_text])
        if embeddings and len(embeddings) > 0:
            return embeddings[0]
        return [0.0] * 384

    @classmethod
    def get_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings safely for a list of text strings."""
        if not texts:
            return []

        # Sanitize texts to ensure all elements are valid non-None strings
        clean_texts = [str(t) if t is not None else "" for t in texts]

        model = cls.get_model()
        if model is None:
            logger.error("Embedding model is unavailable. Returning zero vectors.")
            return [[0.0] * 384 for _ in clean_texts]

        try:
            if cls._is_fastembed:
                embeddings = list(model.embed(clean_texts, batch_size=32))
                return [e.tolist() for e in embeddings]
            else:
                embeddings = model.encode(clean_texts, batch_size=32, convert_to_numpy=True)
                return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings during batch inference: {str(e)}. Attempting individual processing fallback...")
            fallback_embeddings = []
            for t in clean_texts:
                try:
                    if cls._is_fastembed:
                        e = list(model.embed([t]))[0].tolist()
                    else:
                        e = model.encode(t, convert_to_numpy=True).tolist()
                    fallback_embeddings.append(e)
                except Exception as inner_e:
                    logger.warning(f"Failed to embed text chunk: '{t[:30]}...': {str(inner_e)}. Substituting zero vector.")
                    fallback_embeddings.append([0.0] * 384)
            return fallback_embeddings