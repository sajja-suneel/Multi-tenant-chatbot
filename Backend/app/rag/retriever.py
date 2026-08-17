import logging
from typing import List, Dict, Any
from qdrant_client.http import models
from app.database.qdrant import QdrantDB
from app.rag.embeddings import EmbeddingManager

logger = logging.getLogger("app.rag.retriever")

class Retriever:
    @classmethod
    def retrieve(
        cls, 
        tenant_id: str, 
        query: str, 
        limit: int = 5, 
        score_threshold: float = 0.35
    ) -> List[Dict[str, Any]]:
        """
        Search Qdrant with an absolute filter on tenant_id.
        Will NEVER return records belonging to other tenants.
        """
        client = QdrantDB.get_client()
        
        # 1. Generate query embedding
        query_vector = EmbeddingManager.get_embedding(query)
        
        # 2. Build tenant isolation filter
        tenant_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="tenant_id",
                    match=models.MatchValue(value=tenant_id)
                )
            ]
        )
        
        # 3. Perform Qdrant query search
        logger.info(f"Retrieving from Qdrant for tenant {tenant_id} (threshold={score_threshold}, limit={limit})...")
        response = client.query_points(
            collection_name=QdrantDB.collection_name,
            query=query_vector,
            query_filter=tenant_filter,
            limit=limit,
            score_threshold=score_threshold
        )
        results = response.points
        
        retrieved_docs = []
        for hit in results:
            payload = hit.payload
            retrieved_docs.append({
                "text": payload.get("text", ""),
                "document_name": payload.get("document_name", "Unknown"),
                "document_id": payload.get("document_id", ""),
                "page_number": payload.get("page_number"),
                "score": hit.score
            })
            
        logger.info(f"Retrieved {len(retrieved_docs)} matching documents for tenant {tenant_id}.")
        return retrieved_docs