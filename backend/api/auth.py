from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.session import get_db
from backend.crud import user as crud
from backend.schemas.auth import UserRegister, UserLogin, Token
from backend.core.security import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    user = await crud.create_user(db, data.username, data.email, data.password)
    return Token(
        access_token=create_access_token(user.id, user.username, user.role),
        username=user.username,
        user_id=user.id,
        role=user.role,
    )


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await crud.authenticate_user(db, data.username, data.password)
    return Token(
        access_token=create_access_token(user.id, user.username, user.role),
        username=user.username,
        user_id=user.id,
        role=user.role,
    )


@router.get("/me")
async def me(current: dict = Depends(get_current_user)):
    return current
