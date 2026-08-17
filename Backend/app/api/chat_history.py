import logging
from typing import List
from fastapi import APIRouter, Depends, status
from app.database.mongodb import get_chat_logs_collection
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.chat_log import ChatLog

logger = logging.getLogger("app.api.chat_history")
router = APIRouter(prefix="/chat/history", tags=["chat_history"])

@router.get("", response_model=List[ChatLog])
async def get_chat_history(current_user: User = Depends(get_current_user)):
    """
    Retrieve all conversation history logs for the current logged-in employee/admin.
    Strictly isolated by user_id and tenant_id.
    """
    chat_logs_col = get_chat_logs_collection()
    logger.info(f"User '{current_user.email}' (Tenant: '{current_user.tenant_id}') retrieving chat history logs...")
    
    logs_cursor = chat_logs_col.find({
        "tenant_id": current_user.tenant_id,
        "$or": [
            {"user_id": current_user.user_id},
            {"user_id": current_user.email}
        ]
    })
    
    logs = []
    async for doc in logs_cursor:
        logs.append(ChatLog(**doc))
    
    # Sort logs by timestamp ascending
    logs.sort(key=lambda x: x.timestamp)
    return logs

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_chat_history(current_user: User = Depends(get_current_user)):
    """
    Clear all conversation history logs for the current logged-in user.
    Strictly isolates deletion within the user's own tenant and identity.
    """
    chat_logs_col = get_chat_logs_collection()
    logger.info(f"User '{current_user.email}' (Tenant: '{current_user.tenant_id}') clearing chat history...")
    
    await chat_logs_col.delete_many({
        "tenant_id": current_user.tenant_id,
        "user_id": current_user.user_id
    })
    return None

@router.delete("/session/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a specific conversation session log.
    Strictly isolated by user_id, tenant_id, and session_id.
    """
    chat_logs_col = get_chat_logs_collection()
    logger.info(f"User '{current_user.email}' (Tenant: '{current_user.tenant_id}') deleting chat session '{session_id}'...")
    
    await chat_logs_col.delete_many({
        "tenant_id": current_user.tenant_id,
        "user_id": current_user.user_id,
        "session_id": session_id
    })
    return None