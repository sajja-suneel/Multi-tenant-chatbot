import uuid
import logging
from typing import List, Dict, Any
from qdrant_client.http import models
from app.database.qdrant import QdrantDB
from app.rag.embeddings import EmbeddingManager

logger = logging.getLogger("app.rag.vector_store")

class VectorStoreManager:
    @classmethod
    async def add_document_chunks(
        cls, 
        tenant_id: str, 
        document_id: str, 
        document_name: str, 
        chunks: List[Dict[str, Any]]
    ):
        """
        Embed and upsert document chunks into Qdrant.
        Ensures tenant_id is attached to every chunk's payload.
        """
        if not chunks:
            logger.warning("No chunks provided to insert into Qdrant.")
            return

        client = QdrantDB.get_client()
        texts = [chunk["text"] for chunk in chunks]
        
        logger.info(f"Generating embeddings for {len(texts)} chunks of document {document_name}...")
        embeddings = EmbeddingManager.get_embeddings(texts)
        
        points = []
        for idx, (chunk, vector) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid4())
            payload = {
                "tenant_id": tenant_id,
                "document_id": document_id,
                "document_name": document_name,
                "text": chunk["text"],
                "page_number": chunk.get("page_number")
            }
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            )

        logger.info(f"Upserting {len(points)} points into Qdrant collection {QdrantDB.collection_name}...")
        client.upsert(
            collection_name=QdrantDB.collection_name,
            points=points
        )
        logger.info(f"Successfully upserted chunks for document {document_name} ({document_id}) for tenant {tenant_id}.")

    @classmethod
    async def delete_document_vectors(cls, tenant_id: str, document_id: str):
        """
        Delete document vectors from Qdrant.
        CRITICAL SECURITY STEP: Must filter by BOTH tenant_id and document_id to prevent cross-tenant operations.
        """
        client = QdrantDB.get_client()
        logger.info(f"Deleting vectors for document {document_id} and tenant {tenant_id} from Qdrant...")
        
        client.delete(
            collection_name=QdrantDB.collection_name,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="tenant_id",
                            match=models.MatchValue(value=tenant_id)
                        ),
                        models.FieldCondition(
                            key="document_id",
                            match=models.MatchValue(value=document_id)
                        )
                    ]
                )
            )
        )
        logger.info(f"Successfully deleted vectors for document {document_id} of tenant {tenant_id}.")