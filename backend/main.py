from fastapi import FastAPI
from app.api.routes import app
from app.core.models import Base, setup_database

# Initialize the database on startup
engine, _ = setup_database()
Base.metadata.create_all(engine)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)