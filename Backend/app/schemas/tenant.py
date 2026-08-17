from datetime import datetime
from pydantic import BaseModel

class TenantCreate(BaseModel):
    company_name: str

class TenantResponse(BaseModel):
    tenant_id: str
    company_name: str
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "tenant_id": "8f3a2c91-7d4b-4e21-a8c3-91d6f4b7e102",
                "company_name": "ABC Technologies",
                "created_at": "2026-08-12T16:33:42Z"
            }
        }
    
class CompanyRegistrationRequest(BaseModel):
    company_name: str
    admin_name: str
    email: str
    password: str