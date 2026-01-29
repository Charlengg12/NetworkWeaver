from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/networkweaver")

engine = create_engine(DATABASE_URL)

# Retry loop to wait for DB to be ready
def wait_for_db(max_retries=30, wait_seconds=2):
    import time
    from sqlalchemy.exc import OperationalError
    
    retries = max_retries
    while retries > 0:
        try:
            with engine.connect() as connection:
                print("Database connection successful.")
                return
        except OperationalError as e:
            retries -= 1
            print(f"Database not ready, waiting... ({retries} retries left)")
            time.sleep(wait_seconds)
            if retries == 0:
                raise e

wait_for_db()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
