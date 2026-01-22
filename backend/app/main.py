from fastapi import FastAPI
from .database import engine, Base
from .routers import configuration, auth, devices, routeros, monitoring

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

@app.get("/")
def read_root():
    return {"message": "Welcome to NetworkWeaver API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
