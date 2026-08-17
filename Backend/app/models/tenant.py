from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class Tenant(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    tenant_id: str
    company_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "tenant_id": "8f3a2c91-7d4b-4e21-a8c3-91d6f4b7e102",
                "company_name": "ABC Technologies",
                "created_at": "2026-08-12T16:33:42Z"
            }
        }
    }