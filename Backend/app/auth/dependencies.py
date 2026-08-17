from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.jwt import decode_access_token
from app.database.mongodb import get_users_collection
from app.models.user import User

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Dependency to authenticate a user from their JWT.
    Returns a trusted User object containing tenant_id.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject identity",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Load user from MongoDB to ensure they are active and retrieve their true tenant_id
    users_collection = get_users_collection()
    user_dict = await users_collection.find_one({"user_id": user_id})
    
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return User(**user_dict)

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to check if the current user is an admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permissions required to perform this action",
        )
    return current_user