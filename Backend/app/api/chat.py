import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, SourceDocument
from app.rag.retriever import Retriever
from app.rag.generator import Generator
from app.database.mongodb import get_chat_logs_collection
from app.models.chat_log import ChatLog, ChatSource

logger = logging.getLogger("app.api.chat")
router = APIRouter(prefix="/chat", tags=["chat"])

def is_generic_followup(question: str) -> bool:
    """
    Detect if the question is a conversational follow-up/continuation query.
    """
    q = question.lower().strip().strip("?").strip("!").strip(".")
    followups = {
        "tell me more", "tell me more information", "continue", "explain more", 
        "elaborate", "tell me why", "why", "explain", "go on", "more details",
        "tell me more about it", "explain this more"
    }
    return q in followups or "more information" in q or "tell me more" in q

@router.post("", response_model=ChatResponse)
async def chat_with_policies(
    payload: ChatRequest, 
    current_user: User = Depends(get_current_user)
):
    """
    RAG chatbot endpoint. 
    1. Authenticates user and fetches secure tenant_id.
    2. Searches Qdrant vectors matching only the user's tenant_id.
    3. Feeds matching chunks into LLM to generate domain-restricted answers.
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    tenant_id = current_user.tenant_id
    logger.info(f"User '{current_user.email}' (Tenant: '{tenant_id}') submitted question: '{question[:60]}...'")

    try:
        # Fetch last 5 chat logs from MongoDB Atlas to act as conversation history context
        chat_logs_col = get_chat_logs_collection()
        history_cursor = chat_logs_col.find(
            {"tenant_id": tenant_id, "user_id": current_user.user_id}
        ).sort("timestamp", -1).limit(5)
        
        history_logs = []
        async for log in history_cursor:
            history_logs.append(log)
        # Reverse to get chronological order (oldest to newest)
        history_logs.reverse()

        # Contextualize query: if user asks a generic follow-up like "tell me more",
        # search Qdrant using the previous query so we get the correct documents.
        search_query = question
        if is_generic_followup(question) and len(history_logs) > 0:
            search_query = history_logs[-1].get("question", question)
            logger.info(f"Generic follow-up query detected. Using previous query for document search: '{search_query}'")

        # 1. Retrieve tenant-specific documents
        context_docs = Retriever.retrieve(
            tenant_id=tenant_id,
            query=search_query,
            limit=5,
            score_threshold=0.35
        )

        # 2. Call generator to build answer, passing the history logs context
        answer = Generator.generate_answer(question=question, context_docs=context_docs, history=history_logs)

        # 3. Format sources list for the response
        sources = [
            SourceDocument(
                document_name=doc["document_name"],
                page_number=doc.get("page_number"),
                text=doc["text"]
            )
            for doc in context_docs
        ]

        # 4. Save conversation log in MongoDB Atlas
        try:
            chat_logs_col = get_chat_logs_collection()
            log_id = str(uuid.uuid4())
            chat_log = ChatLog(
                log_id=log_id,
                tenant_id=tenant_id,
                user_id=current_user.user_id,
                question=question,
                answer=answer,
                sources=[
                    ChatSource(
                        document_name=src.document_name,
                        page_number=src.page_number,
                        text=src.text
                    )
                    for src in sources
                ]
            )
            await chat_logs_col.insert_one(chat_log.model_dump(by_alias=True, exclude_none=True))
            logger.info(f"Successfully saved chat log {log_id} to MongoDB.")
        except Exception as log_err:
            logger.error(f"Failed to log conversation to MongoDB: {str(log_err)}")

        logger.info(f"Generated answer for user '{current_user.email}' (Tenant: '{tenant_id}'), returning {len(sources)} source items.")
        return ChatResponse(
            answer=answer,
            sources=sources
        )

    except Exception as e:
        logger.error(f"Chat pipeline error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred in the RAG chatbot: {str(e)}"
        )