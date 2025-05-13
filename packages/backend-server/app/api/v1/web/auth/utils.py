from passlib.context import CryptContext
from app.managers import user_keys as user_keys_manager

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str):
    return pwd_context.hash(password)


def check_password(password: str, hashed_password: str):
    return pwd_context.verify(password, hashed_password)


def get_public_key(db, user_id):
    user_keys = user_keys_manager.find_one(db, {"user_id": user_id})
    if not user_keys:
        return None
    return user_keys.get("public_key")


def get_private_key(db, user_id):
    user_keys = user_keys_manager.find_one(db, {"user_id": user_id})
    if not user_keys:
        return None
    return user_keys.get("private_key")
