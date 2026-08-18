import logging
from typing import List, Dict, Any
from groq import Groq
from app.config.settings import settings
from app.prompts.prompts import RAG_SYSTEM_PROMPT, RAG_USER_TEMPLATE

logger = logging.getLogger("app.rag.generator")

def is_greeting_or_identity(question: str) -> bool:
    """
    Check if the user input is a common greeting or question about the bot's identity.
    """
    q = question.lower().strip().strip("?").strip("!").strip(".")
    greetings = {
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
        "who are you", "what is your name", "how are you", "whats up", "what's up", "yo"
    }
    if q in greetings:
        return True
    
    # Also catch simple multi-word greeting variations (e.g. "hello there")
    words = q.split()
    if len(words) > 0 and len(words) <= 3 and any(words[0] == g for g in ["hello", "hi", "hey"]):
        return True
    return False

class Generator:
    @classmethod
    def generate_answer(cls, question: str, context_docs: List[Dict[str, Any]], history: List[Dict[str, Any]] = None) -> str:
        """
        Generate answer from retrieved documents using Groq's llama-3.3-70b-versatile model.
        Supports passing past conversation history.
        """
        # Rule: If no documents were retrieved AND this is not a greeting, return fallback
        if not context_docs and not is_greeting_or_identity(question):
            logger.info("No context docs retrieved and not a greeting. Returning fallback text.")
            return "I couldn't find information about this topic in the available company documents."

        # Format context text (truncate long chunks to manage token budget)
        context_str = ""
        for idx, doc in enumerate(context_docs):
            text_content = doc.get('text', '')
            if len(text_content) > 1500:
                text_content = text_content[:1500] + "... [truncated]"
            context_str += f"[Source: {doc['document_name']}, Page: {doc.get('page_number', 1)}]\n"
            context_str += f"{text_content}\n\n"

        user_prompt = RAG_USER_TEMPLATE.format(context=context_str, question=question)

        if not settings.GROQ_API_KEY:
            logger.error("GROQ_API_KEY is not set in environments.")
            return "Error: Groq API Key is missing. Please configure it in your .env file."

        try:
            logger.info("Initializing Groq Client...")
            client = Groq(api_key=settings.GROQ_API_KEY)
            
            # Construct message list with system prompt and history context
            messages = [
                {"role": "system", "content": RAG_SYSTEM_PROMPT}
            ]
            
            # Add past user questions and assistant answers (limited to last 3 logs, max 300 chars per answer)
            if history:
                for log in history[-3:]:
                    q_hist = log.get("question", "")
                    a_hist = log.get("answer", "")
                    if len(a_hist) > 300:
                        a_hist = a_hist[:300] + "..."
                    if q_hist and a_hist:
                        messages.append({"role": "user", "content": q_hist})
                        messages.append({"role": "assistant", "content": a_hist})
            
            # Append current query block
            messages.append({"role": "user", "content": user_prompt})

            # Supported candidate models on Groq
            models_to_try = [
                "groq/compound",
                "groq/compound-mini",
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant"
            ]

            completion = None
            last_err = None

            for model_name in models_to_try:
                try:
                    logger.info(f"Generating response using Groq model: {model_name}...")
                    completion = client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=0.0,
                    )
                    if completion:
                        break
                except Exception as model_err:
                    logger.warning(f"Model '{model_name}' failed: {str(model_err)}. Trying next candidate...")
                    last_err = model_err

            if not completion:
                raise last_err or RuntimeError("All candidate Groq models failed.")

            return completion.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}")
            return f"Error occurred during response generation: {str(e)}"