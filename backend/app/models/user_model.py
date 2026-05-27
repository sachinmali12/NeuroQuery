from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    queries = relationship("QueryHistory", back_populates="user", cascade="all, delete-orphan")
    saved_queries = relationship("SavedQuery", back_populates="user", cascade="all, delete-orphan")
