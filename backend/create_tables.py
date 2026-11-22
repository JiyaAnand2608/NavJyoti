
import os

from database import engine
from models import Base

if os.getenv("ENVIRONMENT", "development").strip().lower() == "production":
    raise RuntimeError(
        "create_all is disabled in production; apply reviewed migrations instead."
    )

Base.metadata.create_all(bind=engine)

print("NavJyoti database tables created successfully!")
