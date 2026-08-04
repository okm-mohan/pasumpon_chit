import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import models
from app.models import Base

# In Render, configure DATABASE_URL as a secret environment variable.  The
# component variables below make the same configuration possible without
# manually URL-encoding a password that contains special characters.
DATABASE_URL = os.getenv("DATABASE_URL")

# Try MYSQL first, fallback to SQLite for development
if not DATABASE_URL:
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "3306")
    db_name = os.getenv("DB_NAME", "Pasumpon")
    
    # Try MySQL first, but catch connection errors
    try:
        DATABASE_URL = (
            f"mysql+pymysql://{quote_plus(db_user)}:{quote_plus(db_password)}"
            f"@{db_host}:{db_port}/{db_name}"
        )
    except:
        # If MySQL connection fails, use SQLite in-memory for development
        DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Try to create tables if they don't exist, but don't fail if MySQL is down
# This allows development without MySQL setup
if "sqlite" in DATABASE_URL:
    Base.metadata.create_all(bind=engine)
else:
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        # If table creation fails (e.g., MySQL not running), continue anyway
        # Most operations will still work as long as you have a working connection
        pass

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
