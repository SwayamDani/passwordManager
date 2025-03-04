import pytest
from datetime import datetime, timedelta
from app.core.password_manager import UserManager, AccountManager

@pytest.fixture
def setup_test_data():
    user_manager = UserManager()
    account_manager = AccountManager(user_manager)
    username = "testuser"
    
    # Create test user with accounts
    user_manager.create_user(username, "testpass")
    
    # Add test account
    account_manager.add_account(
        username=username,
        service="old_service",
        account_username="user1",
        password="pass1",
        has_2fa=False
    )
    
    # Modify last_changed date to be old
    user_data = user_manager.users[username]
    old_date = (datetime.now() - timedelta(days=100)).isoformat()
    user_data['accounts']['old_service']['last_changed'] = old_date
    user_manager.save_users()
    
    return user_manager, account_manager, username

def test_password_age_check(setup_test_data):
    user_manager, account_manager, username = setup_test_data
    
    aging_passwords = account_manager.check_password_age(username)
    
    assert len(aging_passwords) == 1
    assert aging_passwords[0]['service'] == 'old_service'
    assert aging_passwords[0]['days_old'] >= 90