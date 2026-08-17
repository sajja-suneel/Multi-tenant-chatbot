import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

logger = logging.getLogger("app.database.mongodb")

class MockCollection:
    """In-memory dictionary-based MongoDB collection mock for local testing."""
    def __init__(self, name: str):
        self.name = name
        self.data = {}

    async def insert_one(self, document: dict) -> dict:
        if "_id" not in document:
            document["_id"] = str(len(self.data) + 1)
        self.data[document["_id"]] = document
        return document

    async def find_one(self, filter_dict: dict) -> dict:
        for doc in self.data.values():
            match = True
            for k, v in filter_dict.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    def find(self, filter_dict: dict):
        results = []
        for doc in self.data.values():
            match = True
            for k, v in filter_dict.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                results.append(doc)

        class AsyncCursor:
            def __init__(self, items):
                self.items = items
                self.idx = 0
            def __aiter__(self):
                return self
            async def __anext__(self):
                if self.idx < len(self.items):
                    item = self.items[self.idx]
                    self.idx += 1
                    return item
                raise StopAsyncIteration
        return AsyncCursor(results)

    async def delete_one(self, filter_dict: dict) -> int:
        to_delete = []
        for _id, doc in self.data.items():
            match = True
            for k, v in filter_dict.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                to_delete.append(_id)
        for _id in to_delete:
            del self.data[_id]
        return len(to_delete)

    async def delete_many(self, filter_dict: dict) -> int:
        return await self.delete_one(filter_dict)


class MongoDB:
    client: AsyncIOMotorClient = None
    db = None
    is_mock = False
    mock_collections = {}

    @classmethod
    async def connect(cls):
        mongo_url = settings.MONGODB_URL
        is_cloud_env = os.getenv("RENDER") or os.getenv("VERCEL") or os.getenv("PORT")
        
        try:
            logger.info(f"Connecting to MongoDB at {mongo_url[:20]}... (DB: {settings.MONGODB_DB_NAME})")
            cls.client = AsyncIOMotorClient(
                mongo_url, 
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=45000
            )
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            # Ping database to verify connection
            await cls.client.admin.command('ping')
            cls.is_mock = False
            logger.info(">>> SUCCESS: Connected to live MongoDB database.")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {str(e)}")
            if is_cloud_env and ("localhost" in mongo_url or "127.0.0.1" in mongo_url):
                logger.error("!!! CLOUD DEPLOYMENT WARNING: MONGODB_URL is currently set to localhost!")
                logger.error("!!! Data will NOT persist across server restarts unless MONGODB_URL is set to your MongoDB Atlas URI in Render Environment Variables.")
            logger.warning(">>> FALLBACK: Launching Mock In-Memory MongoDB for temporary local fallback.")
            cls.is_mock = True
            cls.client = None
            cls.db = None

    @classmethod
    async def close(cls):
        if cls.client is not None:
            cls.client.close()
            cls.client = None
            cls.db = None
            logger.info("MongoDB connection closed.")

    @classmethod
    def get_collection(cls, name: str):
        if cls.is_mock:
            if name not in cls.mock_collections:
                cls.mock_collections[name] = MockCollection(name)
            return cls.mock_collections[name]
            
        if cls.db is None:
            raise RuntimeError("MongoDB is not initialized. Call connect() first.")
        return cls.db[name]

# Helper properties to access specific collections
def get_tenants_collection():
    return MongoDB.get_collection("tenants")

def get_users_collection():
    return MongoDB.get_collection("users")

def get_documents_collection():
    return MongoDB.get_collection("documents")

def get_chat_logs_collection():
    return MongoDB.get_collection(settings.CHAT_HISTORY_COLLECTION)