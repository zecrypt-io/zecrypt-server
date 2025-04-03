import binascii
import hashlib
import os
from base64 import b64decode

import jwt
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
from fastapi import Header, HTTPException, Response
from pydantic import ValidationError

from app.core.config import settings
from app.framework.mongo_db.db import get_db
from app.repository import user_details as user_repo


jwt_secret = settings.JWT_SECRET
jwt_algo = settings.JWT_ALGORITHM



def get_user(token: str):
    user_id = jwt.decode(token, str(jwt_secret), algorithms=[str(jwt_algo)]).get("user")
    user = user_repo.redis_find_one({"user_id": user_id})
    return user


def get_current_user(response: Response, token: str = Header(...)):
    if not token:
        raise HTTPException(status_code=401, detail="invalid_header")
    user_id = None
    try:
        user_id = jwt.decode(
            token,
            jwt_secret,
            algorithms=[str(jwt_algo)],
        ).get("user")
    except ValidationError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="invalid_token")
    except jwt.ExpiredSignatureError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="new_token_required")
    except jwt.PyJWTError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Unable to decode JWT token")

    user = user_repo.redis_find_one({"user_id": user_id})
    if not user:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=404, detail="User details not found")

    # adding customer db to user object
    user["db"] = get_db()

    if token == user.get("token"):
        return user
    else:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="session_expired")


def check_if_user(user_email):
    return user_repo.redis_find_one({"user_email": user_email})


def decrypt_password(credentials):
    encrypted_user_email, email_iv, encrypted_password, password_iv = credentials.split(
        "."
    )
    key = settings.LOGIN_ENCRYPTION_KEY.encode("utf-8")

    emailCipher = AES.new(
        key,
        AES.MODE_CBC,
        iv=binascii.unhexlify(email_iv),
    )
    passwordCipher = AES.new(
        key,
        AES.MODE_CBC,
        iv=binascii.unhexlify(password_iv),
    )
    ct_user_name = b64decode(encrypted_user_email)
    ct_password = b64decode(encrypted_password)
    user_email = unpad(emailCipher.decrypt(ct_user_name), 16).decode("utf-8")
    password = unpad(passwordCipher.decrypt(ct_password), 16).decode("utf-8")
    return user_email, password
