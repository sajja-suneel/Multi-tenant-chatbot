from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "employee"  # "admin" or "employee"

class UserResponse(BaseModel):
    user_id: str
    email: EmailStr
    tenant_id: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "user_id": "USER-UUID",
                "email": "employee@abc.com",
                "tenant_id": "TENANT-UUID",
                "role": "employee",
                "created_at": "2026-08-12T16:33:42Z"
            }
        }