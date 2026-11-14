
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker


# Use local PostgreSQL by default.
# Select .env.neon explicitly only when needed.
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = os.getenv("NAVJYOTI_ENV_FILE", ".env")

load_dotenv(BASE_DIR / ENV_FILE, override=True)


def get_database_url():
    # Neon or another cloud PostgreSQL provider.
    cloud_url = os.getenv("DATABASE_URL")

    if cloud_url:
        # NavJyoti uses the psycopg PostgreSQL driver.
        if cloud_url.startswith("postgresql://"):
            cloud_url = cloud_url.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )

        return cloud_url

    # Existing local PostgreSQL connection.
    return URL.create(
        drivername="postgresql+psycopg",
        username=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME"),
    )


DATABASE_URL = get_database_url()

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def test_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return result.scalar() == 1
