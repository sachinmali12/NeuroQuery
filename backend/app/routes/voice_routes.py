from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.query_model import QueryHistory
from app.models.user_model import User
from app.auth.auth_handler import get_current_user
from app.services.speech_service import process_voice_text
from app.services.ai_service import generate_sql_query
from app.services.ai_voice_service import explain_sql_for_voice

router = APIRouter()

class VoiceQueryRequest(BaseModel):
    voice_text: str

@router.post("/voice-query")
def voice_query(
    data: VoiceQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Voice AI query generation route.
    1. Sanitizes and normalizes the user's spoken voice transcript (handling Hinglish, stutters).
    2. Compiles the cleaned natural language prompt into an executable PostgreSQL query using AI.
    3. Formats an extremely concise audio-friendly explanation of the query.
    4. Automatically stores the compilation event in the query history log for the active user.
    """
    raw_text = data.voice_text.strip()
    if not raw_text:
        raise HTTPException(
            status_code=400,
            detail="Speech recognition did not capture any text. Please try speaking again."
        )

    try:
        # Step 1: Normalize, sanitize, and translate Hinglish/Marathi/Hindi speech
        processed_prompt = process_voice_text(raw_text)
        if not processed_prompt:
            processed_prompt = raw_text # Fallback to original text if empty

        # Step 2: Generate SQL using LLM compiler
        generated_sql = generate_sql_query(processed_prompt)

        # Step 3: Generate a concise, spoken-narrator explanation
        voice_explanation = explain_sql_for_voice(generated_sql)

        # Step 4: Register compilation event in historical database metrics
        new_query = QueryHistory(
            user_id=current_user.id,
            user_prompt=processed_prompt,
            generated_sql=generated_sql,
            database_type="PostgreSQL",
            execution_time=0.0,
            success_status=True
        )
        db.add(new_query)
        db.commit()
        db.refresh(new_query)

        return {
            "voice_text": raw_text,
            "processed_prompt": processed_prompt,
            "generated_sql": generated_sql,
            "explanation": voice_explanation
        }

    except Exception as e:
        print("Voice Query Processing Error:", e)
        raise HTTPException(
            status_code=500,
            detail=f"Voice Assistant compilation failed: {str(e)}"
        )
