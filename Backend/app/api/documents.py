import os
import uuid
import hashlib
import logging
import tempfile
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.database.mongodb import get_documents_collection
from app.auth.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.document import Document
from app.rag.pdf_loader import load_document
from app.rag.text_splitter import RecursiveCharacterTextSplitter
from app.rag.vector_store import VectorStoreManager

logger = logging.getLogger("app.api.documents")
router = APIRouter(prefix="/documents", tags=["documents"])

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}

async def _process_single_file(file: UploadFile, current_admin: User) -> dict:
    """Helper to process, chunk, embed and index a single document file."""
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '{ext}'. Supported: {', '.join(SUPPORTED_EXTENSIONS)}")

    # 1. Compute SHA-256 hash of file content to detect duplicate uploads
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()

    # 2. Check if identical file (or file with same name/hash) is already uploaded for this tenant
    docs_col = get_documents_collection()
    existing_doc = await docs_col.find_one({
        "tenant_id": current_admin.tenant_id,
        "$or": [
            {"file_hash": file_hash},
            {"document_name": file.filename}
        ]
    })
    if existing_doc:
        existing_name = existing_doc.get("document_name", file.filename)
        raise ValueError(f"File '{file.filename}' has already been uploaded to your company memory (matches existing document '{existing_name}'). Skipping duplicate to save storage.")

    # 3. Save to temporary file for parser loading
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    try:
        temp_file.write(content)
        temp_file.close()

        logger.info(f"Parsing uploaded file: {file.filename} (SHA-256: {file_hash[:10]}...) for tenant {current_admin.tenant_id}")
        pages = load_document(temp_file.name)
        if not pages:
            raise ValueError("Document has no readable text content.")

        splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
        chunks = splitter.split_documents(pages)
        logger.info(f"Split {file.filename} into {len(chunks)} chunks.")

        document_id = str(uuid.uuid4())
        new_doc = Document(
            document_id=document_id,
            document_name=file.filename,
            tenant_id=current_admin.tenant_id,
            uploaded_by=current_admin.user_id,
            uploaded_at=datetime.utcnow(),
            file_size=len(content),
            file_hash=file_hash
        )
        await docs_col.insert_one(new_doc.model_dump(by_alias=True, exclude_none=True))

        await VectorStoreManager.add_document_chunks(
            tenant_id=current_admin.tenant_id,
            document_id=document_id,
            document_name=file.filename,
            chunks=chunks
        )

        logger.info(f"Successfully indexed document '{file.filename}' ({document_id}) with SHA-256 {file_hash[:10]}")
        return {
            "document_id": document_id,
            "document_name": file.filename,
            "chunks_count": len(chunks),
            "file_hash": file_hash
        }
    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_documents(
    files: List[UploadFile] = File(..., description="Upload one or multiple policy documents (PDF, DOCX, TXT, MD)"),
    current_admin: User = Depends(get_current_admin)
):
    """
    Upload one or multiple company policy documents at once.
    Checks SHA-256 checksums to reject duplicate files and save storage.
    Extracts text, splits into chunks, embeds, and loads into Qdrant & MongoDB.
    Requires administrator credentials.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided for upload."
        )

    processed_docs = []
    failed_docs = []

    for upload_file in files:
        try:
            res = await _process_single_file(upload_file, current_admin)
            processed_docs.append(res)
        except Exception as err:
            logger.error(f"Failed processing file '{upload_file.filename}': {str(err)}")
            failed_docs.append({"document_name": upload_file.filename, "error": str(err)})

    if not processed_docs and failed_docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=failed_docs[0]['error']
        )

    if len(processed_docs) == 1 and not failed_docs:
        return processed_docs[0]

    return {
        "uploaded": processed_docs,
        "failed": failed_docs,
        "total_uploaded": len(processed_docs),
        "total_failed": len(failed_docs),
        "chunks_count": sum(d["chunks_count"] for d in processed_docs)
    }

@router.get("", response_model=List[Document])
async def list_documents(current_user: User = Depends(get_current_user)):
    """
    List all documents uploaded for the authenticated user's company (tenant).
    Strictly isolated by current user's tenant_id.
    """
    docs_col = get_documents_collection()
    logger.info(f"User '{current_user.email}' requesting document list for tenant '{current_user.tenant_id}'")
    
    docs_cursor = docs_col.find({"tenant_id": current_user.tenant_id})
    documents = []
    async for doc in docs_cursor:
        documents.append(Document(**doc))
        
    return documents

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str, 
    current_admin: User = Depends(get_current_admin)
):
    """
    Delete a document and its embedded vectors.
    CRITICAL SECURITY STEP: Verifies the document belongs to the administrator's tenant_id before deletion.
    """
    docs_col = get_documents_collection()
    
    # 1. Fetch document to verify ownership
    doc_dict = await docs_col.find_one({"document_id": document_id})
    if not doc_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if doc_dict["tenant_id"] != current_admin.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Cannot delete document belonging to another company"
        )

    # 2. Delete vectors from Qdrant
    await VectorStoreManager.delete_document_vectors(
        tenant_id=current_admin.tenant_id,
        document_id=document_id
    )

    # 3. Delete document from MongoDB
    await docs_col.delete_one({"document_id": document_id})
    logger.info(f"Admin '{current_admin.email}' deleted document '{doc_dict['document_name']}' ({document_id}) from tenant '{current_admin.tenant_id}'")
    
    return None