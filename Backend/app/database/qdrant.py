import logging
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.config.settings import settings

logger = logging.getLogger("app.database.qdrant")

class QdrantDB:
    client: QdrantClient = None
    collection_name = "company_policies"
    vector_size = 384  # Dimension of sentence-transformers/all-MiniLM-L6-v2

    @classmethod
    def connect(cls):
        if cls.client is None:
            try:
                if settings.QDRANT_HOST and settings.QDRANT_HOST != "":
                    logger.info(f"Connecting to Qdrant Cloud at {settings.QDRANT_HOST}...")
                    cls.client = QdrantClient(
                        url=settings.QDRANT_HOST,
                        api_key=settings.QDRANT_API_KEY
                    )
                elif settings.QDRANT_URL == ":memory:":
                    logger.info("Connecting to transient in-memory Qdrant database...")
                    cls.client = QdrantClient(":memory:")
                else:
                    logger.info(f"Connecting to local Qdrant at {settings.QDRANT_URL}...")
                    cls.client = QdrantClient(url=settings.QDRANT_URL)
                
                # Check and initialize collection
                cls._init_collection()
                logger.info("Successfully connected to Qdrant and initialized collection.")
            except Exception as e:
                logger.error(f"Failed to connect to Qdrant: {str(e)}")
                raise e

    @classmethod
    def _init_collection(cls):
        try:
            # Check if collection exists
            collections = cls.client.get_collections().collections
            exists = any(c.name == cls.collection_name for c in collections)
            
            if not exists:
                logger.info(f"Creating Qdrant collection: {cls.collection_name} (Dim: {cls.vector_size})")
                cls.client.create_collection(
                    collection_name=cls.collection_name,
                    vectors_config=models.VectorParams(
                        size=cls.vector_size,
                        distance=models.Distance.COSINE
                    )
                )
                logger.info("Qdrant collection created successfully.")
            else:
                logger.info(f"Qdrant collection {cls.collection_name} already exists.")

            # Ensure payload indexes exist (idempotent calls)
            logger.info("Ensuring payload index for tenant_id exists...")
            cls.client.create_payload_index(
                collection_name=cls.collection_name,
                field_name="tenant_id",
                field_schema=models.PayloadSchemaType.KEYWORD
            )
            
            logger.info("Ensuring payload index for document_id exists...")
            cls.client.create_payload_index(
                collection_name=cls.collection_name,
                field_name="document_id",
                field_schema=models.PayloadSchemaType.KEYWORD
            )
            logger.info("Qdrant collection and payload indexes initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing Qdrant collection: {str(e)}")
            raise e

    @classmethod
    def get_client(cls) -> QdrantClient:
        if cls.client is None:
            cls.connect()
        return cls.client