from fastapi import APIRouter, HTTPException
from models.user.models import UserCreate, UserResponse, UserLogin, Token
from database.mongodb import db
from utils.auth.security import security
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    # Check if user already exists
    existing_user = db.get_collection("users").find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = security.hash_password(user.password)
    
    # Create user document
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    # Insert into database
    result = db.get_collection("users").insert_one(user_data)
    
    return {
        "id": str(result.inserted_id),
        "username": user.username,
        "email": user.email,
        "created_at": user_data["created_at"]
    }

@router.post("/login", response_model=Token)
async def login_user(user: UserLogin):
    # Find user in database
    user_data = db.get_collection("users").find_one({"email": user.email})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not security.verify_password(user.password, user_data["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = security.create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}