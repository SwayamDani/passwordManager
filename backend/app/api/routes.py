from fastapi import FastAPI, HTTPException, Request, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

# Import our SQLite database models and managers
from app.core.password_manager import UserManager, PasswordAnalyzer, AccountManager
from app.utils.rate_limiter import FailsafeRateLimiter, setup_limiter
from app.utils.security import JWTHandler
from fastapi_limiter import FastAPILimiter
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    redis_client = await setup_limiter()
    await rate_limiter.init(redis_client)
    yield
    # Shutdown
    if redis_client:
        await redis_client.close()

app = FastAPI(title="Password Manager API", lifespan=lifespan)
rate_limiter = FailsafeRateLimiter()
jwt_handler = JWTHandler()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://password-manager-eight-lovat.vercel.app/", "https://password-manager-swayam-danis-projects.vercel.app/"],
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

class PasswordCheck(BaseModel):
    password: str

@app.post("/api/login")
async def login(credentials: UserCredentials, request: Request):
    try:
        await rate_limiter.check_rate_limit(request)
        
        if user_manager.login(credentials.username, credentials.password):
            await rate_limiter.reset_attempts(request)
            access_token = jwt_handler.create_access_token(
                data={"sub": credentials.username}
            )
            return {
                "access_token": access_token, 
                "token_type": "bearer", 
                "username": credentials.username
            }
        
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )

@app.post("/api/register")
async def register(credentials: UserCredentials, request: Request):
    try:
        await rate_limiter.check_rate_limit(request)
        
        if user_manager.create_user(credentials.username, credentials.password):
            await rate_limiter.reset_attempts(request)
            return {"message": "User created successfully"}
            
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Add a dependency for protected routes
async def get_current_user(token: HTTPAuthorizationCredentials = Security(HTTPBearer())):
    payload = jwt_handler.verify_token(token.credentials)
    username = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return username

# Example of a protected route
@app.get("/api/accounts")
async def get_accounts(username: str = Depends(get_current_user)):
    try:
        accounts = account_manager.get_accounts(username)
        return accounts
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/api/accounts")
async def create_account(
    account: AccountCreate,
    username: str = Depends(get_current_user)
):
    try:
        success = account_manager.add_account(
            username,
            account.service,
            account.username,
            account.password,
            account.has_2fa
        )
        if success:
            return {"message": "Account created successfully"}
        else:
            raise HTTPException(
                status_code=400, 
                detail="Account already exists for this service"
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/password/check")
async def check_password(password_data: PasswordCheck):
    strength_score, feedback = analyzer.check_strength(password_data.password)
    is_breached, count = analyzer.check_breach(password_data.password)
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

@app.delete("/api/accounts/{service}")
async def delete_account(
    service: str,
    username: str = Depends(get_current_user)
):
    try:
        success = account_manager.delete_account(username, service)
        if success:
            return {"message": "Account deleted successfully"}
        raise HTTPException(
            status_code=404,
            detail=f"Account for service '{service}' not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.put("/api/accounts/{service}")
async def update_account(
    service: str,
    account: AccountCreate,
    username: str = Depends(get_current_user)
):
    try:
        success = account_manager.update_account(
            username=username,
            service=service,
            new_username=account.username,
            new_password=account.password,
            new_has_2fa=account.has_2fa
        )
        if success:
            return {"message": "Account updated successfully"}
        raise HTTPException(
            status_code=404,
            detail=f"Account for service '{service}' not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/api/accounts/aging")
async def get_aging_passwords(
    username: str = Depends(get_current_user)
) -> List[dict]:
    try:
        aging_passwords = account_manager.check_password_age(username)
        return aging_passwords
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check password age: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)