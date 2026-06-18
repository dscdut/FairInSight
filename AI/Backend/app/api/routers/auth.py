from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db
from app.services import auth_service

router = APIRouter(tags=["auth"])


# ── Request / Response schemas ────────────────────────────────────────────────

class UserAuth(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str


class UserProfileResponse(BaseModel):
    id: int
    username: str
    full_name: str | None = None
    email: str | None = None
    bio: str | None = None
    avatar_color: str | None = None
    created_at: str
    updated_at: str | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=254)
    bio: str | None = Field(default=None, max_length=500)
    avatar_color: str | None = Field(default=None, max_length=20)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/auth/register", response_model=TokenResponse)
def register(payload: UserAuth, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(models.User).filter(models.User.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    hashed_pwd = auth_service.get_password_hash(payload.password)
    new_user = models.User(username=payload.username, password_hash=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth_service.create_access_token(data={"sub": new_user.username})
    return TokenResponse(access_token=token, token_type="bearer", username=new_user.username)


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: UserAuth, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not auth_service.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token = auth_service.create_access_token(data={"sub": user.username})
    return TokenResponse(access_token=token, token_type="bearer", username=user.username)


@router.get("/auth/me", response_model=UserProfileResponse)
def get_me(
    current_user: models.User = Depends(auth_service.get_current_user),
) -> UserProfileResponse:
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        bio=current_user.bio,
        avatar_color=current_user.avatar_color,
        created_at=current_user.created_at.strftime("%Y-%m-%d"),
        updated_at=current_user.updated_at.strftime("%Y-%m-%d") if current_user.updated_at else None,
    )


@router.put("/auth/me", response_model=UserProfileResponse)
def update_me(
    payload: UserProfileUpdate,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip() or None
    if payload.email is not None:
        current_user.email = payload.email.strip() or None
    if payload.bio is not None:
        current_user.bio = payload.bio.strip() or None
    if payload.avatar_color is not None:
        current_user.avatar_color = payload.avatar_color.strip() or None

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        bio=current_user.bio,
        avatar_color=current_user.avatar_color,
        created_at=current_user.created_at.strftime("%Y-%m-%d"),
        updated_at=current_user.updated_at.strftime("%Y-%m-%d") if current_user.updated_at else None,
    )
