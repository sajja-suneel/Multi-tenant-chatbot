import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.database.mongodb import get_users_collection
from app.auth.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.user import UserResponse

logger = logging.getLogger("app.api.users")
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user details.
    """
    return current_user

@router.get("", response_model=List[UserResponse])
async def list_company_users(current_admin: User = Depends(get_current_admin)):
    """
    List all users belonging to the admin's company (tenant).
    Strictly isolated by the admin's tenant_id.
    """
    users_col = get_users_collection()
    logger.info(f"Admin '{current_admin.email}' listing users for tenant '{current_admin.tenant_id}'")
    
    users_cursor = users_col.find({"tenant_id": current_admin.tenant_id})
    users = []
    async for u in users_cursor:
        users.append(User(**u))
        
    return users

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company_user(user_id: str, current_admin: User = Depends(get_current_admin)):
    """
    Delete a user from the company.
    CRITICAL SECURITY STEP: Verifies the target user belongs to the admin's tenant.
    """
    users_col = get_users_collection()
    
    # 1. Fetch user to verify tenant
    target_user = await users_col.find_one({"user_id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if target_user["tenant_id"] != current_admin.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Cannot delete user from another tenant"
        )
        
    # Prevent admin from deleting themselves
    if target_user["user_id"] == current_admin.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete own administrator account"
        )
        
    # 2. Perform deletion
    await users_col.delete_one({"user_id": user_id})
    logger.info(f"Admin '{current_admin.email}' deleted user '{target_user['email']}' from tenant '{current_admin.tenant_id}'")
    return None