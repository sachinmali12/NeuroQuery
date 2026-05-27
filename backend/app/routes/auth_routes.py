from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user_model import User
from app.schemas.auth_schema import UserRegister, UserLogin, TokenResponse, UserResponse
from app.auth.password_handler import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.auth.auth_handler import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=hash_password(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_418_IM_A_TEAPOT or status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token
    token_payload = {
        "user_id": user.id,
        "email": user.email
    }
    access_token = create_access_token(data=token_payload)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
