from datetime import datetime
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class ChatSource(BaseModel):
    document_name: str
    page_number: Optional[int] = None
    text: str

class ChatLog(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    log_id: str
    tenant_id: str
    user_id: str
    session_id: str = "default"
    question: str
    answer: str
    sources: List[ChatSource] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "log_id": "log_uuid_123",
                "tenant_id": "ABC_UUID",
                "user_id": "user_uuid_456",
                "question": "What is the vacation policy?",
                "answer": "Employees get 25 days of vacation per year.",
                "sources": [
                    {
                        "document_name": "leave_policy.pdf",
                        "page_number": 4,
                        "text": "Employees are entitled to 25 days of annual leave..."
                    }
                ],
                "timestamp": "2026-08-13T11:33:59Z"
            }
        }
    }