import pytest
import shutil
import json
import secrets
from pathlib import Path
from fastapi.testclient import TestClient
from app.api.routes import app
from app.core.password_manager import UserManager

client = TestClient(app)
user_manager = UserManager()

@pytest.fixture(autouse=True)
def setup_test_environment():
    # Setup test environment
    data_dir = Path(__file__).parent.parent / "data"
    users_file = data_dir / "users.json"
    salt_file = data_dir / ".salt"

    # Create fresh data directory
    if data_dir.exists():
        shutil.rmtree(data_dir)
    data_dir.mkdir(exist_ok=True)

    # Initialize salt file
    with open(salt_file, 'wb') as f:
        f.write(secrets.token_bytes(32))

    # Initialize empty users file
    with open(users_file, 'w') as f:
        json.dump({}, f)
    
    # Create test user
    user_manager.create_user("testuser", "testpass")
    
    yield
    
    # Cleanup
    try:
        if data_dir.exists():
            shutil.rmtree(data_dir)
    except Exception as e:
        print(f"Cleanup error: {e}")

def test_login_and_protected_route():
    # Test login
    login_response = client.post("/api/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
    
    token = login_response.json()["access_token"]
    
    # Test protected route with token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/accounts", headers=headers)
    assert response.status_code == 200
    
    # Test protected route without token
    response = client.get("/api/accounts")
    assert response.status_code == 403

def test_invalid_token():
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/accounts", headers=headers)
    assert response.status_code == 401