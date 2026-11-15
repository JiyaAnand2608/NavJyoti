import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = os.getenv("NAVJYOTI_ENV_FILE", ".env")

load_dotenv(BASE_DIR / ENV_FILE, override=True)


def get_database_url() -> str:
    # Explicit DATABASE_URL (PostgreSQL, Neon, or SQLite for isolated tests)
    cloud_url = os.getenv("DATABASE_URL")

    if cloud_url:
        if cloud_url.startswith("postgresql://"):
            cloud_url = cloud_url.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )
        return cloud_url

    # Local PostgreSQL parameters
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_name = os.getenv("DB_NAME")

    if db_user and db_name:
        return str(URL.create(
            drivername="postgresql+psycopg",
            username=db_user,
            password=db_password,
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=db_name,
        ))

    # Safe fallback if unconfigured: default local postgresql URL string
    return "postgresql+psycopg://postgres:postgres@localhost:5432/navjyoti"


DATABASE_URL = get_database_url()

def create_app_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


engine = create_app_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def test_connection(custom_engine=None) -> bool:
    target_engine = custom_engine or engine
    try:
        with target_engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            return result.scalar() == 1
    except Exception:
        return False
