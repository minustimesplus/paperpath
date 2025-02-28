from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import os
import json
import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env
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

# PostgreSQL connection parameters
PG_USER = os.getenv("user", "postgres")
PG_PASSWORD = os.getenv("password", "")
PG_HOST = os.getenv("host", "")
PG_PORT = os.getenv("port", "5432")
PG_DBNAME = os.getenv("dbname", "postgres")

# SQLAlchemy setup
# DATABASE_URL = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DBNAME}"
DATABASE_URL = "postgresql://neondb_owner:npg_b5C1sqJGtngN@ep-plain-union-a9t22r24-pooler.gwc.azure.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL)

# Initialize database
def init_db():
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            dbname=PG_DBNAME
        )
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
        print("PostgreSQL database initialized successfully")
    except Exception as e:
        print(f"Error initializing PostgreSQL database: {e}")

# Test database connection at startup
@app.on_event("startup")
async def startup_event():
    try:
        conn = psycopg2.connect(
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            dbname=PG_DBNAME
        )
        conn.close()
        print("Successfully connected to PostgreSQL database!")
    except Exception as e:
        print(f"PostgreSQL connection error: {e}")
    
    # Initialize database
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
    try:
        conn = psycopg2.connect(
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            dbname=PG_DBNAME
        )
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, password_hash FROM users WHERE username = %s", (username,))
        user_data = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user_data:
            return UserInDB(id=user_data[0], username=user_data[1], email=user_data[2], password_hash=user_data[3])
        return None
    except Exception as e:
        print(f"Error getting user from PostgreSQL: {e}")
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
    try:
        conn = psycopg2.connect(
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            dbname=PG_DBNAME
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if username already exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (user.username,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (user.username, user.email, hashed_password)
        )
        user_id = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error registering user"
        )

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
    try:
        conn = psycopg2.connect(
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            dbname=PG_DBNAME
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if user already has subjects saved
        cursor.execute("SELECT id FROM user_subjects WHERE user_id = %s", (current_user.id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing subjects
            cursor.execute(
                "UPDATE user_subjects SET subjects = %s WHERE user_id = %s",
                (json.dumps(subject_list.subjects), current_user.id)
            )
        else:
            # Create new subjects entry
            cursor.execute(
                "INSERT INTO user_subjects (user_id, subjects) VALUES (%s, %s)",
                (current_user.id, json.dumps(subject_list.subjects))
            )
        
        cursor.close()
        conn.close()
        
        return {"status": "success", "message": "Subjects saved successfully"}
    except Exception as e:
        print(f"Error saving subjects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving subjects"
        )

@app.get("/subjects")
async def get_subjects(current_user: UserInDB = Depends(get_current_user)):
    try:
        conn = psycopg2.connect(
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            dbname=PG_DBNAME
        )
        cursor = conn.cursor()
        
        cursor.execute("SELECT subjects FROM user_subjects WHERE user_id = %s", (current_user.id,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            subjects = json.loads(result[0])
            return {"subjects": subjects}
        else:
            return {"subjects": []}
    except Exception as e:
        print(f"Error getting subjects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving subjects"
        )

@app.post("/completion")
async def update_completion(status: CompletionStatus, current_user: UserInDB = Depends(get_current_user)):
    try:
        conn = psycopg2.connect(
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            dbname=PG_DBNAME
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if this specific paper status already exists
        cursor.execute(
            """
            SELECT id FROM completion_status 
            WHERE user_id = %s AND subject_id = %s AND year = %s AND session = %s AND paper = %s
            """, 
            (current_user.id, status.subject_id, status.year, status.session, status.paper)
        )
        existing = cursor.fetchone()
        
        if existing:
            # Update existing status
            cursor.execute(
                """
                UPDATE completion_status 
                SET is_completed = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
                """,
                (status.is_completed, existing[0])
            )
        else:
            # Create new status
            cursor.execute(
                """
                INSERT INTO completion_status 
                (user_id, subject_id, year, session, paper, is_completed) 
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (current_user.id, status.subject_id, status.year, status.session, status.paper, status.is_completed)
            )
        
        cursor.close()
        conn.close()
        
        return {"status": "success"}
    except Exception as e:
        print(f"Error updating completion status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating completion status"
        )

@app.get("/completion")
async def get_completion(current_user: UserInDB = Depends(get_current_user)):
    try:
        conn = psycopg2.connect(
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            dbname=PG_DBNAME
        )
        cursor = conn.cursor()
        
        cursor.execute(
            """
            SELECT subject_id, year, session, paper, is_completed 
            FROM completion_status 
            WHERE user_id = %s
            """, 
            (current_user.id,)
        )
        
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        completion_data = {}
        for row in results:
            key = f"{row[0]}-{row[1]}-{row[2]}-{row[3]}"
            completion_data[key] = row[4]
        
        return completion_data
    except Exception as e:
        print(f"Error getting completion data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving completion data"
        )

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)