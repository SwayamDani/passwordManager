from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import sys
import os

# Add the backend directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend'))

# Import your FastAPI app
from app.api.routes import app

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://password-manager-eight-lovat.vercel.app",
        "http://localhost:3000"
        ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a handler for AWS Lambda
handler = Mangum(app)