from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship

from app.database import Base

class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    user_prompt = Column(Text, nullable=False)
    generated_sql = Column(Text, nullable=False)
    database_type = Column(String, default="PostgreSQL")
    execution_time = Column(Float, nullable=True)
    success_status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="queries")


class SavedQuery(Base):
    __tablename__ = "saved_queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    query = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="saved_queries")