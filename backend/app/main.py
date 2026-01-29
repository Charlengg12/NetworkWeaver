from fastapi import FastAPI
from .database import engine, Base
from .routers import configuration, auth, devices, routeros, monitoring, prometheus_metrics

# Create tables (In production, use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NetworkWeaver API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins like ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(configuration.router)
app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(routeros.router)
app.include_router(monitoring.router)
app.include_router(prometheus_metrics.router)
# Explicitly import and include scripts router 
from .routers.routeros import scripts
app.include_router(scripts.router, prefix="/routeros/scripts")

@app.get("/")
def read_root():
    return {"message": "Welcome to NetworkWeaver API"}

@app.get("/health")
def health_check():
    try:
        from sqlalchemy import text
        # Check DB connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
