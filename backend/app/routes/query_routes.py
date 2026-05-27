from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
import time

from app.database import get_db, SessionLocal
from app.models.query_model import QueryHistory, SavedQuery
from app.models.user_model import User
from app.auth.auth_handler import get_current_user

from app.schemas.query_schema import (
    QueryCreate,
    QueryResponse,
    AIQueryRequest,
    ExecuteQueryRequest,
    SavedQueryCreate,
    SavedQueryResponse,
    ExplainQueryRequest,
    FixQueryRequest
)

from app.services.ai_service import generate_sql_query, explain_sql_query, fix_sql_query
from app.services.sql_executor import execute_sql_query

router = APIRouter()


# ==============================
# Database Migrations on Startup
# ==============================
@router.on_event("startup")
def run_migrations():
    db = SessionLocal()
    try:
        # Alter table query_history to add execution_time, success_status and user_id dynamically
        db.execute(text("ALTER TABLE query_history ADD COLUMN IF NOT EXISTS execution_time FLOAT;"))
        db.execute(text("ALTER TABLE query_history ADD COLUMN IF NOT EXISTS success_status BOOLEAN DEFAULT TRUE;"))
        db.execute(text("ALTER TABLE query_history ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;"))
        
        # Alter table saved_queries to add user_id dynamically
        db.execute(text("ALTER TABLE saved_queries ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;"))
        db.commit()
        print("NovaSQL dynamic migration executed successfully.")
    except Exception as e:
        print("NovaSQL dynamic migration warning (could be running first-time setup):", e)
    finally:
        db.close()


# ==============================
# Generate SQL using Gemini AI
# ==============================
@router.post("/generate-sql")
def generate_sql(
    data: AIQueryRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        generated_sql = generate_sql_query(data.prompt)

        # Save to database query history scoped to the current user
        new_query = QueryHistory(
            user_id=current_user.id,
            user_prompt=data.prompt,
            generated_sql=generated_sql,
            database_type="PostgreSQL",
            execution_time=0.0,
            success_status=True
        )
        db.add(new_query)
        db.commit()
        db.refresh(new_query)

        return {
            "generated_sql": generated_sql
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==============================
# Execute SQL Query
# ==============================
@router.post("/execute_query")
def execute_query(
    data: ExecuteQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_time = time.perf_counter()
    success = True
    error_msg = None
    
    try:
        # Execute SQL
        result = execute_sql_query(data.sql)
        return result

    except Exception as e:
        success = False
        error_msg = str(e)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )
    finally:
        end_time = time.perf_counter()
        duration = round((end_time - start_time), 4)
        
        try:
            # Save query execution log in history scoped to current user
            history_log = QueryHistory(
                user_id=current_user.id,
                user_prompt="Run Query",
                generated_sql=data.sql,
                database_type="PostgreSQL",
                execution_time=duration,
                success_status=success
            )
            db.add(history_log)
            db.commit()
        except Exception as eh:
            print("Failed to save execute query history log:", eh)


# ==============================
# Saved Queries System (Feature 1)
# ==============================
@router.post("/save-query", response_model=SavedQueryResponse)
def save_query(
    data: SavedQueryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        new_saved = SavedQuery(
            user_id=current_user.id,
            title=data.title,
            query=data.query
        )
        db.add(new_saved)
        db.commit()
        db.refresh(new_saved)
        return new_saved

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==============================
# Get Query History
# ==============================
@router.get("/query-history")
def get_query_history(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    history = (
        db.query(QueryHistory)
        .filter(QueryHistory.user_id == current_user.id)
        .order_by(QueryHistory.id.desc())
        .all()
    )
    return history


# ==============================
# Delete Single Query History
# ==============================
@router.delete("/query-history/{query_id}")
def delete_query(
    query_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        query = db.query(QueryHistory).filter(
            QueryHistory.id == query_id,
            QueryHistory.user_id == current_user.id
        ).first()
        if not query:
            raise HTTPException(status_code=404, detail="Query not found")
        db.delete(query)
        db.commit()
        return {"message": "Query deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==============================
# Delete All Query History
# ==============================
@router.delete("/query-history")
def delete_all_queries(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        db.query(QueryHistory).filter(QueryHistory.user_id == current_user.id).delete()
        db.commit()
        return {"message": "All query history deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==============================
# Get Saved Queries (Feature 1)
# ==============================
@router.get("/saved-queries")
def get_saved_queries(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        queries = (
            db.query(SavedQuery)
            .filter(SavedQuery.user_id == current_user.id)
            .order_by(SavedQuery.id.desc())
            .all()
        )
        return queries
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==============================
# Delete Saved Query (Feature 1)
# ==============================
@router.delete("/saved-query/{query_id}")
def delete_saved_query(
    query_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        saved = db.query(SavedQuery).filter(
            SavedQuery.id == query_id,
            SavedQuery.user_id == current_user.id
        ).first()
        if not saved:
            raise HTTPException(status_code=404, detail="Saved query not found")
        db.delete(saved)
        db.commit()
        return {"message": "Saved query deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==============================
# Explain SQL Query (Feature 3)
# ==============================
@router.post("/explain-query")
def explain_query(
    data: ExplainQueryRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        explanation = explain_sql_query(data.sql)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==============================
# Fix SQL Query (Feature 4)
# ==============================
@router.post("/fix-query")
def fix_query(
    data: FixQueryRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        fix_result = fix_sql_query(data.sql)
        return fix_result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )