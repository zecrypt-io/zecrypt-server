import jwt
from fastapi import Header, HTTPException
from pydantic import ValidationError

from app.core.config import settings
from app.core.db import get_db

db = get_db()


def get_current_user(token: str = Header(...)):
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Header")

    try:
        user_id = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        ).get("user_id")
    except Exception:
        raise HTTPException(
            status_code=401, detail="Session Expired, Please login Again"
        )

    user = db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User details not found")

    if not token == user.get("token"):
        raise HTTPException(
            status_code=401, detail="Session Expired, Please login Again"
        )

    return user


def get_admin_user(token: str = Header(...)):
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Header")

    try:
        user_id = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        ).get("user_id")
    except ValidationError:
        raise HTTPException(
            status_code=401, detail="Session Expired, Please login Again"
        )

    user = db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User details not found")

    if not token == user.get("token"):
        raise HTTPException(
            status_code=401, detail="Session Expired, Please login Again"
        )

    if user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized User")

    return user


def get_editor(token: str = Header(...)):
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Header")

    try:
        user_id = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        ).get("user_id")
    except ValidationError:
        raise HTTPException(
            status_code=401, detail="Session Expired, Please login Again"
        )

    user = db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User details not found")

    if not token == user.get("token"):
        raise HTTPException(
            status_code=401, detail="Session Expired, Please login Again"
        )

    if user.get("role") not in ["editor", "admin"]:
        raise HTTPException(status_code=401, detail="Unauthorized User")

    return user
