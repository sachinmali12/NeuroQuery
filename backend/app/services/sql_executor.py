from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import SessionLocal

def execute_raw_sql(db: Session, query: str):
    """
    Executes a raw SQL query and returns the results.
    """
    # Execute raw SQL
    result = db.execute(text(query))
    
    # If the query returns rows (like SELECT), parse them
    if result.returns_rows:
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return {"columns": columns, "data": rows}
    
    # Commit in case of modifications (INSERT, UPDATE, DELETE)
    db.commit()
    
    return {"message": "Query executed successfully", "row_count": result.rowcount}


def execute_sql_query(query: str):
    """
    Executes a raw SQL query using a fresh standalone DB session and returns the results.
    """
    db = SessionLocal()
    try:
        # Execute raw SQL
        result = db.execute(text(query))
        
        # If the query returns rows (like SELECT), parse them
        if result.returns_rows:
            columns = list(result.keys())
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
            return {"columns": columns, "data": rows}
        
        # Commit in case of modifications (INSERT, UPDATE, DELETE)
        db.commit()
        
        return {"message": "Query executed successfully", "row_count": result.rowcount}
    finally:
        db.close()
