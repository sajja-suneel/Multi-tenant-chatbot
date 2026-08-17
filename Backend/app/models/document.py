from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class Document(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    document_id: str
    document_name: str
    tenant_id: str
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    file_size: int
    file_hash: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "document_id": "doc_uuid_123",
                "document_name": "leave_policy.pdf",
                "tenant_id": "ABC_UUID",
                "uploaded_by": "user_uuid_456",
                "uploaded_at": "2026-08-12T16:33:42Z",
                "file_size": 154200,
                "file_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            }
        }
    }