import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.database.mongodb import MongoDB
from app.database.qdrant import QdrantDB
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.chat_history import router as chat_history_router

# Setup logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.info("Initializing databases connections...")
    try:
        await MongoDB.connect()
        QdrantDB.connect()
        logger.info("Database initializations completed.")
    except Exception as e:
        logger.critical(f"Critical error on application startup: {str(e)}")
        raise e
        
    yield
    
    # Shutdown tasks
    logger.info("Shutting down database connections...")
    await MongoDB.close()
    logger.info("Application cleanup finished.")

app = FastAPI(
    title="Multi-Tenant Company Policy RAG Chatbot API",
    description="Backend API that isolates policy documents, user sessions, and vector stores per company (tenant).",
    version="1.0.0",
    lifespan=lifespan
)

# Setup CORS middleware
# In development, we allow localhost origins where the React/Next.js app runs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific origins in production e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error at {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact system administrator."}
    )

# Register routes
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(chat_history_router)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    from fastapi.openapi.utils import get_openapi
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    # Ensure array of UploadFile uses format: binary so Swagger UI renders file upload buttons
    for schema in openapi_schema.get("components", {}).get("schemas", {}).values():
        if isinstance(schema, dict) and "properties" in schema:
            for prop in schema["properties"].values():
                if isinstance(prop, dict) and prop.get("type") == "array" and "items" in prop:
                    items = prop["items"]
                    if isinstance(items, dict) and items.get("type") == "string":
                        items["format"] = "binary"
                elif isinstance(prop, dict) and prop.get("type") == "string":
                    if prop.get("contentMediaType"):
                        prop["format"] = "binary"
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.get("/")
def read_root():
    return {
        "title": app.title,
        "status": "healthy",
        "description": "Multi-Tenant RAG API is operational."
    }