from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from exceptions import CustomHTTPException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
import jwt
from jwt.exceptions import DecodeError, ExpiredSignatureError

import time
from database import execute_query

SECRET_KEY = "super_secret_key"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Member(BaseModel):
    id: int
    username: str
    email: str

class Token(BaseModel):
    token: str

# when register new member be more strict on validating the input value
class UserRegister(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=1)
    
class UserLogin(BaseModel):
    email: str
    password: str
    
class CurrentMember(BaseModel):
    id: int
    username: str
    email: EmailStr
    
# Verify password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Authenticate member
def authenticate_member(email: str, password: str):
    query = "SELECT id, username, email, password FROM members WHERE email = %s"
    result = execute_query(query, (email,))
    if result and verify_password(password, result[0]['password']):
        return result[0]
    return None

# Create JWT token
def create_access_token(data: dict, expires_delta: int = 3600):
    to_encode = data.copy()
    expire = time.time() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

# Decode JWT token get id.email
def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except DecodeError:
        return None
    except ExpiredSignatureError:
        return None
    except Exception as e:
        print(f"Error decoding token: {e}")
        return None
    
def get_current_member(token: str = Depends(oauth2_scheme)):
    decoded_token = decode_access_token(token)
    if not decoded_token:
        raise CustomHTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = decoded_token.get("email")
    if not email:        
        raise CustomHTTPException(
            status_code=401,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    query = "SELECT id, username, email FROM members WHERE email = %s"
    member = execute_query(query, (email,))
    if not member:
        raise CustomHTTPException(
            status_code=401,
            detail="Member not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return member[0]

def check_if_member_exist(user: UserRegister) -> bool:
    query = "SELECT id, email, username FROM members WHERE email = %s"
    member = execute_query(query, (user.email,))
    print(member)
    return len(member) > 0

def hash_pass_save_into_db(login_user: UserLogin):
    hashed_password = pwd_context.hash(login_user.password)
    execute_query(
        "INSERT INTO members (username, email, password) VALUES (%s, %s, %s)",
        (login_user.name, login_user.email, hashed_password),
        commit=True
    )
