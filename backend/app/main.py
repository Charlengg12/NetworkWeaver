from fastapi import FastAPI
from .database import engine, Base
from .routers import configuration, auth, devices, routeros

# ... existing code ...

app.include_router(configuration.router)
app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(routeros.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to ConfigWeaver API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
