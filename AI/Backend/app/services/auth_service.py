from datetime import datetime, timedelta
import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db
from app.utils.settings import get_settings

settings = get_settings()

# OAuth2 scheme: will look for Authorization header with Bearer token.
# We don't strict-restrict tokenUrl since it can be different, but api/v1/auth/login is default.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)  # Default 7 days
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def get_or_create_default_user(db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.username == "default_user").first()
    if not user:
        user = models.User(
            username="default_user",
            password_hash=get_password_hash("default_password"),
            full_name="Default User",
            email="default@example.com",
            avatar_color="#00685f"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    if not token:
        return get_or_create_default_user(db)

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        username: str | None = payload.get("sub")
        if username is None:
            return get_or_create_default_user(db)
    except jwt.PyJWTError:
        return get_or_create_default_user(db)

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        return get_or_create_default_user(db)
    return user
