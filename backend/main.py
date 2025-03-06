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

# test

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

# Database connection string from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)

# IB Subject Groups
IB_SUBJECT_GROUPS = {
    "Group 1 - Studies in Language and Literature": [
        "English A Literature", "English A Language and Literature", "German A"
    ],
    "Group 2 - Language Acquisition": [
        "English B", "French B", "Spanish B", "German B", "Mandarin B"
    ],
    "Group 3 - Individuals and Societies": [
        "History", "Geography", "Economics", "Psychology", "Business Management", "Environmental Systems and Societies (ESS)"
    ],
    "Group 4 - Sciences": [
        "Biology", "Chemistry", "Physics", "Computer Science", "Environmental Systems and Societies (ESS)"
    ],
    "Group 5 - Mathematics": [
        "Mathematics: Analysis and Approaches", "Mathematics: Applications and Interpretation"
    ],
    "Group 6 - The Arts": [
        "Visual Arts", "Music", "Theatre", "Film", "Dance", "Design"
    ]
}

# Load timezone configuration from JSON file
TIMEZONE_CONFIG = {}
try:
    with open('timezone-config.json', 'r') as f:
        TIMEZONE_CONFIG = json.load(f)
except Exception as e:
    print(f"Warning: Could not load timezone-config.json: {e}")
    # If the file doesn't exist, the TIMEZONE_CONFIG will remain empty
    # The application will still function but without timezone support

# Initialize database
def init_db():
    try:
        # Connect to PostgreSQL
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
        
        # Create completion status table with timezone field and score
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS completion_status (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            subject_id TEXT NOT NULL,
            year INTEGER NOT NULL,
            session TEXT NOT NULL,
            paper TEXT NOT NULL,
            timezone TEXT,
            is_completed BOOLEAN NOT NULL DEFAULT FALSE,
            score INTEGER CHECK (score >= 0 AND score <= 100),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')

        # Check if score column exists and add it if it doesn't
        cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='completion_status' AND column_name='score'
        """)
        
        if not cursor.fetchone():
            print("[DEBUG] Adding score column to completion_status table...")
            cursor.execute("""
            ALTER TABLE completion_status 
            ADD COLUMN score INTEGER CHECK (score >= 0 AND score <= 100)
            """)
            print("[DEBUG] Score column added successfully")
        
        cursor.close()
        conn.close()
        print("PostgreSQL database initialized successfully")
    except Exception as e:
        print(f"Error initializing PostgreSQL database: {e}")

def migrate_completion_data():
    """
    Migrate existing completion data to support timezone field.
    This function should be run once after updating the database schema.
    """
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # First, make sure the timezone column exists
        cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='completion_status' AND column_name='timezone'
        """)
        
        if not cursor.fetchone():
            print("Adding timezone column to completion_status table...")
            cursor.execute("ALTER TABLE completion_status ADD COLUMN timezone TEXT")
        
        # Now migrate the data
        # Get all completion status records
        cursor.execute("""
        SELECT id, subject_id, paper FROM completion_status WHERE timezone IS NULL
        """)
        
        records = cursor.fetchall()
        print(f"Found {len(records)} records to migrate")
        
        # Process each record
        updated_count = 0
        for record_id, subject_id, paper in records:
            paper_key = paper.lower().replace(' ', '')
            
            # Check if this subject-paper has TZ variants
            if subject_id in TIMEZONE_CONFIG and paper_key in TIMEZONE_CONFIG[subject_id]:
                if TIMEZONE_CONFIG[subject_id][paper_key]:
                    # This paper should have TZ variants, set to TZ1 as default
                    cursor.execute("""
                    UPDATE completion_status SET timezone = 'TZ1' WHERE id = %s
                    """, (record_id,))
                    updated_count += 1
            
        print(f"Updated {updated_count} records")
        
        cursor.close()
        conn.close()
        print("Migration completed successfully")
        
    except Exception as e:
        print(f"Error during migration: {e}")

# Test database connection at startup
@app.on_event("startup")
async def startup_event():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.close()
        print("Successfully connected to PostgreSQL database!")
    except Exception as e:
        print(f"PostgreSQL connection error: {e}")
    
    # Initialize database
    init_db()
    
    # Run migration for existing data
    migrate_completion_data()

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development")  # Change in production
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
    timezone: Optional[str] = None
    is_completed: bool
    score: Optional[int] = None

class BulkCompletionStatus(BaseModel):
    completion_data: Dict[str, Dict[str, Any]]

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    try:
        conn = psycopg2.connect(DATABASE_URL)
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
        conn = psycopg2.connect(DATABASE_URL)
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
        conn = psycopg2.connect(DATABASE_URL)
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
        conn = psycopg2.connect(DATABASE_URL)
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

@app.get("/subject-groups")
async def get_subject_groups():
    """Return all available IB subject groups and their subjects"""
    return {"subject_groups": IB_SUBJECT_GROUPS}

@app.get("/timezone-config")
async def get_timezone_config():
    """Return the timezone configuration for all subjects"""
    return {"timezone_config": TIMEZONE_CONFIG}

@app.post("/completion")
async def update_completion(status: CompletionStatus, current_user: UserInDB = Depends(get_current_user)):
    try:
        print(f"[DEBUG] Updating completion status for user {current_user.id}:")
        print(f"[DEBUG] Status data: {status}")
        
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if this specific paper status already exists
        query = """
            SELECT id FROM completion_status 
            WHERE user_id = %s AND subject_id = %s AND year = %s 
            AND session = %s AND paper = %s
        """
        params = [current_user.id, status.subject_id, status.year, status.session, status.paper]
        
        # Add timezone to query if provided
        if status.timezone:
            query += " AND timezone = %s"
            params.append(status.timezone)
        else:
            query += " AND (timezone IS NULL OR timezone = '')"
            
        print(f"[DEBUG] Executing query: {query}")
        print(f"[DEBUG] With params: {params}")
        cursor.execute(query, params)
        existing = cursor.fetchone()
        
        if existing:
            # Update existing status
            print(f"[DEBUG] Updating existing status ID {existing[0]}")
            cursor.execute(
                """
                UPDATE completion_status 
                SET is_completed = %s, score = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
                """,
                (status.is_completed, status.score, existing[0])
            )
        else:
            # Create new status
            print(f"[DEBUG] Creating new status")
            cursor.execute(
                """
                INSERT INTO completion_status 
                (user_id, subject_id, year, session, paper, timezone, is_completed, score) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (current_user.id, status.subject_id, status.year, status.session, 
                 status.paper, status.timezone, status.is_completed, status.score)
            )
            print(f"[DEBUG] New status created successfully")
        
        cursor.close()
        conn.close()
        
        return {"status": "success"}
    except Exception as e:
        print(f"[ERROR] Error updating completion status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating completion status"
        )

@app.post("/completion/bulk")
async def bulk_update_completion(data: BulkCompletionStatus, current_user: UserInDB = Depends(get_current_user)):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        for key, value in data.completion_data.items():
            # Parse the composite key
            subject_id, year, session, paper, *timezone_part = key.split('-')
            timezone = timezone_part[0] if timezone_part else None
            
            # Check if this specific paper status already exists
            query = """
                SELECT id FROM completion_status 
                WHERE user_id = %s AND subject_id = %s AND year = %s 
                AND session = %s AND paper = %s
            """
            params = [current_user.id, subject_id, int(year), session, paper]
            
            if timezone:
                query += " AND timezone = %s"
                params.append(timezone)
            else:
                query += " AND (timezone IS NULL OR timezone = '')"
                
            cursor.execute(query, params)
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute(
                    """
                    UPDATE completion_status 
                    SET is_completed = %s, score = %s, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = %s
                    """,
                    (value['is_completed'], value.get('score'), existing[0])
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO completion_status 
                    (user_id, subject_id, year, session, paper, timezone, is_completed, score) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (current_user.id, subject_id, int(year), session, paper, 
                     timezone, value['is_completed'], value.get('score'))
                )
        
        cursor.close()
        conn.close()
        
        return {"status": "success", "message": "Bulk completion status updated"}
    except Exception as e:
        print(f"[ERROR] Error updating bulk completion status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating bulk completion status"
        )

@app.get("/completion")
async def get_completion(current_user: UserInDB = Depends(get_current_user)):
    try:
        print(f"[DEBUG] Fetching completion data for user {current_user.id}")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        query = """
            SELECT subject_id, year, session, paper, timezone, is_completed, score
            FROM completion_status 
            WHERE user_id = %s
        """
        print(f"[DEBUG] Executing query: {query}")
        cursor.execute(query, (current_user.id,))
        
        results = cursor.fetchall()
        print(f"[DEBUG] Found {len(results)} completion records")
        
        completion_data = {}
        for row in results:
            subject_id, year, session, paper, timezone, is_completed, score = row
            # Include timezone in the key if it exists
            if timezone:  # timezone
                key = f"{subject_id}-{year}-{session}-{paper}-{timezone}"
            else:
                key = f"{subject_id}-{year}-{session}-{paper}"
                
            # Always return an object with is_completed and score properties
            completion_data[key] = {
                "is_completed": bool(is_completed),  # Ensure boolean
                "score": score if score is not None else None
            }
            print(f"[DEBUG] Record {key}: {completion_data[key]}")
        
        cursor.close()
        conn.close()
        
        return completion_data
    except Exception as e:
        print(f"[ERROR] Error getting completion data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving completion data"
        )

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)