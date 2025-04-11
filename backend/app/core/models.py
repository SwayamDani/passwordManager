from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base, engine

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    salt = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    totp_secret = Column(String, nullable=True)  # Secret for TOTP-based 2FA
    totp_enabled = Column(Boolean, default=False)  # Whether 2FA is enabled
    email = Column(String, nullable=True)  # Email for password reset
    reset_token = Column(String, nullable=True)  # Store password reset token
    reset_token_expires = Column(DateTime, nullable=True)  # Token expiration
    
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")

class Account(Base):
    __tablename__ = 'accounts'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    service = Column(String, nullable=False)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    has_2fa = Column(Boolean, default=False)
    last_changed = Column(DateTime, default=datetime.utcnow)
    password_strength = Column(Integer, default=0)
    password_breach = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="accounts")

def create_tables():
    """Create all database tables if they don't exist"""
    Base.metadata.create_all(engine)