import hashlib
from datetime import datetime, timedelta
from typing import Optional
import jwt
from dotenv import load_dotenv
import os

load_dotenv()

class Security:
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY", "fallback-secret-key")
        self.algorithm = "HS256"
    
    def hash_password(self, password: str) -> str:
        """Hash a password for storing"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a stored password against one provided by user"""
        return self.hash_password(plain_password) == hashed_password
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=30)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str):
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

# Create global security instance
security = Security()