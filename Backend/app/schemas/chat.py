from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None

class SourceDocument(BaseModel):
    document_name: str
    page_number: Optional[int] = None
    text: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceDocument]