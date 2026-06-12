from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import User
from app.core.security import hash_password, verify_password


async def get_users(
    db: AsyncSession,
    search: str = "",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[User], int]:
    query = select(User)
    if search:
        search_filter = or_(
            User.username.ilike(f"%{search}%"),
            User.name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = list(result.scalars().all())

    return users, total


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    username: str,
    name: str,
    email: str,
    role_id: str,
    password: str,
) -> User:
    user = User(
        username=username,
        name=name,
        email=email,
        role_id=role_id,
        password_hash=hash_password(password),
    )
    db.add(user)
    await db.flush()
    return user


async def update_user(db: AsyncSession, user: User, **kwargs) -> User:
    for key, value in kwargs.items():
        if value is not None:
            setattr(user, key, value)
    await db.flush()
    return user


async def delete_user(db: AsyncSession, user: User) -> None:
    await db.delete(user)
    await db.flush()


async def authenticate_user(db: AsyncSession, account: str, password: str) -> User | None:
    user = await get_user_by_username(db, account)
    if user is None:
        user = await get_user_by_email(db, account)
    if user is None:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def change_password(db: AsyncSession, user: User, new_password: str) -> None:
    user.password_hash = hash_password(new_password)
    await db.flush()
