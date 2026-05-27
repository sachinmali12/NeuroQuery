from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class QueryCreate(BaseModel):
    user_prompt: str
    generated_sql: str
    database_type: str = "PostgreSQL"
    execution_time: Optional[float] = None
    success_status: Optional[bool] = None


class QueryResponse(QueryCreate):
    id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# NEW
class AIQueryRequest(BaseModel):
    prompt: str


class ExecuteQueryRequest(BaseModel):
    sql: str


class SavedQueryCreate(BaseModel):
    title: str
    query: str


class SavedQueryResponse(SavedQueryCreate):
    id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class ExplainQueryRequest(BaseModel):
    sql: str


class FixQueryRequest(BaseModel):
    sql: str