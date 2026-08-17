from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, EmailStr, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class User(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    email: EmailStr
    password_hash: str
    tenant_id: str
    role: str = "employee"  # "admin" or "employee"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "user_id": "USER_UUID",
                "email": "employee@abc.com",
                "tenant_id": "ABC_UUID",
                "role": "employee",
                "created_at": "2026-08-12T16:33:42Z"
            }
        }
    }