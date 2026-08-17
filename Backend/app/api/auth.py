import uuid
import logging
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.database.mongodb import get_tenants_collection, get_users_collection
from app.auth.jwt import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_admin, get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.tenant import CompanyRegistrationRequest, TenantResponse
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, TokenResponse

logger = logging.getLogger("app.api.auth")
router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user details.
    """
    return current_user


@router.post("/register-company", status_code=status.HTTP_201_CREATED)
async def register_company(payload: CompanyRegistrationRequest):
    """
    Register a new tenant company and its initial administrator.
    Generates a secure UUID tenant_id.
    """
    tenants_col = get_tenants_collection()
    users_col = get_users_collection()

    # 1. Check if email is already taken
    existing_user = await users_col.find_one({"email": payload.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2. Check if company name is already registered (optional clean restriction)
    existing_tenant = await tenants_col.find_one({"company_name": payload.company_name})
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name already registered"
        )

    # 3. Create Tenant
    tenant_id = str(uuid.uuid4())
    new_tenant = Tenant(
        tenant_id=tenant_id,
        company_name=payload.company_name,
        created_at=datetime.utcnow()
    )
    await tenants_col.insert_one(new_tenant.model_dump(by_alias=True, exclude_none=True))
    logger.info(f"Registered company '{payload.company_name}' with tenant_id '{tenant_id}'")

    # 4. Create Admin User
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(payload.password)
    new_admin = User(
        user_id=user_id,
        email=payload.email.lower(),
        password_hash=hashed_pwd,
        tenant_id=tenant_id,
        role="admin",
        created_at=datetime.utcnow()
    )
    await users_col.insert_one(new_admin.model_dump(by_alias=True, exclude_none=True))
    logger.info(f"Registered admin user '{payload.email}' for tenant '{tenant_id}'")

    # Format return fields manually to bypass Dict import if typing isn't imported
    return {
        "tenant_id": tenant_id,
        "company_name": payload.company_name,
        "admin": {
            "user_id": user_id,
            "email": payload.email.lower(),
            "role": "admin"
        }
    }

@router.post("/register-user", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserCreate, 
    current_admin: User = Depends(get_current_admin)
):
    """
    Allow an authenticated admin to register a new user (employee or admin)
    for their OWN company (tenant). The tenant_id is automatically copied
    from the current_admin object (preventing frontend spoofing).
    """
    users_col = get_users_collection()

    # 1. Check if email is already taken
    existing_user = await users_col.find_one({"email": payload.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2. Hash password and insert
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(payload.password)
    
    new_user = User(
        user_id=user_id,
        email=payload.email.lower(),
        password_hash=hashed_pwd,
        tenant_id=current_admin.tenant_id, # Strict tenant copy
        role=payload.role,
        created_at=datetime.utcnow()
    )
    await users_col.insert_one(new_user.model_dump(by_alias=True, exclude_none=True))
    logger.info(f"Admin '{current_admin.email}' registered user '{payload.email}' with role '{payload.role}' for tenant '{current_admin.tenant_id}'")

    return new_user

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    """
    Authenticate email & password and return a JWT access token.
    """
    users_col = get_users_collection()
    user_dict = await users_col.find_one({"email": payload.email.lower()})
    
    if not user_dict or not verify_password(payload.password, user_dict["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = User(**user_dict)
    
    # Generate token payload containing identity details
    token_data = {
        "sub": user.user_id,
        "role": user.role,
        "tenant_id": user.tenant_id
    }
    
    access_token = create_access_token(data=token_data)
    logger.info(f"User '{user.email}' logged in successfully for tenant '{user.tenant_id}'")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }