from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from password_manager import UserManager, PasswordAnalyzer, AccountManager

app = FastAPI(title="Password Manager API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add root route
@app.get("/")
async def root():
    return {"message": "Password Manager API is running"}

# Initialize managers
user_manager = UserManager()
analyzer = PasswordAnalyzer()
account_manager = AccountManager(user_manager)

# Request models
class UserCredentials(BaseModel):
    username: str
    password: str

class AccountCreate(BaseModel):
    service: str
    username: str
    password: str
    has_2fa: bool = False

@app.post("/api/login")
async def login(credentials: UserCredentials):
    if user_manager.login(credentials.username, credentials.password):
        return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/register")
async def register(credentials: UserCredentials):
    if user_manager.register(credentials.username, credentials.password):
        return {"success": True}
    raise HTTPException(status_code=400, detail="Username already exists")

@app.post("/api/accounts")
async def add_account(account: AccountCreate):
    if account_manager.add_account(
        account.service, 
        account.username, 
        account.password, 
        account.has_2fa
    ):
        return {"success": True}
    raise HTTPException(status_code=401, detail="Not authenticated")

@app.get("/api/accounts")
async def get_accounts():
    accounts = account_manager.list_accounts()
    return {"accounts": accounts}

@app.post("/api/password/check")
async def check_password(password: str):
    strength_score, feedback = analyzer.check_strength(password)
    is_breached, count = analyzer.check_breach(password)
    return {
        "strength_score": strength_score,
        "feedback": feedback,
        "is_breached": is_breached,
        "breach_count": count
    }

@app.get("/api/password/generate")
async def generate_password(length: int = 16):
    password = analyzer.generate_password(length)
    return {"password": password}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)