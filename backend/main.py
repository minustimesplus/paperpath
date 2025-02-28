# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import sqlite3
import os
import json
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import psycopg2

load_dotenv()

# Initialize FastAPI
app = FastAPI(title="IB Paper Tracker API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_NAME = "ib_tracker.db"

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ib_tracker.db")
# For SQLite local development
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # For PostgreSQL production
    engine = create_engine(DATABASE_URL)

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class
Base = declarative_base()



def init_db():
    if DATABASE_URL.startswith("sqlite"):
        # SQLite initialization
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create subjects table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subjects TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        # Create completion status table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS completion_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject_id TEXT NOT NULL,
            year INTEGER NOT NULL,
            session TEXT NOT NULL,
            paper TEXT NOT NULL,
            is_completed BOOLEAN NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        conn.commit()
        conn.close()
    else:
        # PostgreSQL initialization
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create subjects table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_subjects (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            subjects TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        # Create completion status table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS completion_status (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            subject_id TEXT NOT NULL,
            year INTEGER NOT NULL,
            session TEXT NOT NULL,
            paper TEXT NOT NULL,
            is_completed BOOLEAN NOT NULL DEFAULT FALSE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        cursor.close()
        conn.close()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-for-development")  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Models
class User(BaseModel):
    username: str
    email: str
    password: str

class UserInDB(BaseModel):
    id: int
    username: str
    email: str
    password_hash: str

class Token(BaseModel):
    access_token: str
    token_type: str

class SubjectList(BaseModel):
    subjects: List[str]

class CompletionStatus(BaseModel):
    subject_id: str
    year: int
    session: str
    paper: str
    is_completed: bool

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user:
        return UserInDB(**dict(user))
    return None

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = get_user(username=username)
    if user is None:
        raise credentials_exception
        
    return user

# Routes
@app.post("/register", response_model=Token)
async def register_user(user: User):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Check if username already exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    cursor.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        (user.username, user.email, hashed_password)
    )
    conn.commit()
    
    # Get the user id
    cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
    user_id = cursor.fetchone()[0]
    
    conn.close()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}

@app.post("/subjects")
async def save_subjects(subject_list: SubjectList, current_user: UserInDB = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Check if user already has subjects saved
    cursor.execute("SELECT id FROM user_subjects WHERE user_id = ?", (current_user.id,))
    existing = cursor.fetchone()
    
    if existing:
        # Update existing subjects
        cursor.execute(
            "UPDATE user_subjects SET subjects = ? WHERE user_id = ?",
            (json.dumps(subject_list.subjects), current_user.id)
        )
    else:
        # Create new subjects entry
        cursor.execute(
            "INSERT INTO user_subjects (user_id, subjects) VALUES (?, ?)",
            (current_user.id, json.dumps(subject_list.subjects))
        )
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Subjects saved successfully"}

@app.get("/subjects")
async def get_subjects(current_user: UserInDB = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT subjects FROM user_subjects WHERE user_id = ?", (current_user.id,))
    result = cursor.fetchone()
    
    conn.close()
    
    if result:
        subjects = json.loads(result[0])
        return {"subjects": subjects}
    else:
        return {"subjects": []}

@app.post("/completion")
async def update_completion(status: CompletionStatus, current_user: UserInDB = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Check if this specific paper status already exists
    cursor.execute(
        """
        SELECT id FROM completion_status 
        WHERE user_id = ? AND subject_id = ? AND year = ? AND session = ? AND paper = ?
        """, 
        (current_user.id, status.subject_id, status.year, status.session, status.paper)
    )
    existing = cursor.fetchone()
    
    if existing:
        # Update existing status
        cursor.execute(
            """
            UPDATE completion_status 
            SET is_completed = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
            """,
            (status.is_completed, existing[0])
        )
    else:
        # Create new status
        cursor.execute(
            """
            INSERT INTO completion_status 
            (user_id, subject_id, year, session, paper, is_completed) 
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (current_user.id, status.subject_id, status.year, status.session, status.paper, status.is_completed)
        )
    
    conn.commit()
    conn.close()
    
    return {"status": "success"}

@app.get("/completion")
async def get_completion(current_user: UserInDB = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute(
        """
        SELECT subject_id, year, session, paper, is_completed 
        FROM completion_status 
        WHERE user_id = ?
        """, 
        (current_user.id,)
    )
    
    results = cursor.fetchall()
    conn.close()
    
    completion_data = {}
    for row in results:
        key = f"{row['subject_id']}-{row['year']}-{row['session']}-{row['paper']}"
        completion_data[key] = row['is_completed']
    
    return completion_data

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)