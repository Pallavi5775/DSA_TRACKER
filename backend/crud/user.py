import re
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models import User


async def _first_user_gets_admin(db: AsyncSession) -> str:
    result = await db.execute(select(User).limit(1))
    return "admin" if result.first() is None else "user"


def _sanitize_username(raw: str) -> str:
    """Replace non-alphanumeric characters and trim to 30 chars."""
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", raw).strip("_") or "user"
    return cleaned[:30]


async def _unique_username(db: AsyncSession, base: str) -> str:
    """Append an incrementing suffix until the username is not taken."""
    candidate = base
    counter = 1
    while True:
        result = await db.execute(select(User).where(User.username == candidate))
        if result.scalar_one_or_none() is None:
            return candidate
        candidate = f"{base}{counter}"
        counter += 1


async def get_or_create_oauth_user(
    db: AsyncSession,
    *,
    provider: str,
    oauth_id: str,
    email: str,
    username: str,
    avatar_url: str | None = None,
) -> User:
    # 1. Exact match by provider + provider user-id (returning user)
    result = await db.execute(
        select(User).where(User.oauth_provider == provider, User.oauth_id == oauth_id)
    )
    user = result.scalar_one_or_none()
    if user:
        if avatar_url and user.avatar_url != avatar_url:
            user.avatar_url = avatar_url
            await db.commit()
            await db.refresh(user)
        return user

    # 2. Same email already in DB — only link if it's already a passwordless OAuth account.
    #    Legacy password-auth users (hashed_password set) are NOT auto-merged; the email
    #    gets a numeric suffix so both accounts coexist independently.
    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        if existing.hashed_password is None:
            # Pure OAuth account — safe to link the new provider to it
            existing.oauth_provider = provider
            existing.oauth_id = oauth_id
            if avatar_url:
                existing.avatar_url = avatar_url
            await db.commit()
            await db.refresh(existing)
            return existing
        else:
            # Legacy password user shares this email — use a provider-scoped email
            # so we can create a new independent account without a unique-key clash
            email = f"{provider}_{oauth_id}@oauth.local"

    # 3. Brand-new user
    role = await _first_user_gets_admin(db)
    safe_username = await _unique_username(db, _sanitize_username(username))
    user = User(
        username=safe_username,
        email=email,
        hashed_password=None,
        oauth_provider=provider,
        oauth_id=oauth_id,
        avatar_url=avatar_url,
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
