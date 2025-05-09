import requests
from user_agents import parse
from pyotp import random_base32
import pyotp
from cryptography.fernet import Fernet
from app.core.config import settings
from app.managers import login_activity as login_activity_manager
from app.utils.date_utils import create_timestamp


from app.api.v1.web.projects.services import create_project_at_signup
from app.managers import user as user_manager
from app.utils.jwt_utils import create_jwt_token
from app.utils.utils import (
    response_helper,
    create_uuid,
)
from app.utils.jwt_utils import encode_token


def encrypt_totp_secret(totp_secret):
    cipher = Fernet(settings.TOTP_SECRET.encode())
    encrypted_secret = cipher.encrypt(totp_secret.encode())
    return encrypted_secret


def decrypt_totp_secret(encrypted_secret):
    cipher = Fernet(settings.TOTP_SECRET.encode())
    totp_secret = cipher.decrypt(encrypted_secret)
    return totp_secret.decode()


def create_profision_uri(totp_secret, email):
    provisioning_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(
        name=email, issuer_name="Zecrypt-Server"
    )
    return provisioning_uri


def validate_stack_auth_token(token):
    endpoint = "https://api.stack-auth.com/api/v1/users/me"

    try:
        res = requests.request(
            "GET",
            endpoint,
            headers={
                "x-stack-access-type": "server",
                "x-stack-project-id": settings.STACK_AUTH_PROJECT_ID,
                "x-stack-publishable-client-key": settings.STACK_AUTH_CLIENT_ID,
                "x-stack-secret-server-key": settings.STACK_AUTH_CLIENT_SECRET,
                "x-stack-access-token": token,
            },
        )
        if res.status_code >= 400:
            return None
        return res.json()
    except Exception as e:
        print(f"Token validation failed: {e}")
        return None


def record_login_event(request, db, user):
    # Get IP Address
    client_ip = request.client.host
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0]

    user_agent = request.headers.get("user-agent")
    ua = parse(user_agent)
    data = {
        "ip_address": client_ip,
        "created_by": user.get("user_id"),
        "created_at": create_timestamp(),
        "user_agent": user_agent,
        "browser": ua.browser.family,
        "os": f"{ua.os.family} {ua.os.version_string}",
        "device": {
            "type": ua.device.family,
            "is_mobile": ua.is_mobile,
            "is_tablet": ua.is_tablet,
            "is_pc": ua.is_pc,
        },
    }
    login_activity_manager.insert_one(db, data)


def create_user(request, db, auth_data, back_ground_tasks):
    user_id = create_uuid()
    totp_secret = random_base32()
    new_user_data = {
        "uid": auth_data.get("id"),
        "name": auth_data.get("display_name"),
        "created_at": create_timestamp(),
        "updated_at": create_timestamp(),
        "email": auth_data.get("primary_email"),
        "user_id": user_id,
        "profile_url": auth_data.get("profile_image_url"),
        "language": "en",
        "auth": {
            "has_password": auth_data.get("has_password"),
            "otp_auth_enabled": auth_data.get("otp_auth_enabled"),
            "auth_with_email": auth_data.get("auth_with_email"),
            "requires_totp_mfa": auth_data.get("requires_totp_mfa"),
            "passkey_auth_enabled": auth_data.get("passkey_auth_enabled"),
            "oauth_providers": auth_data.get("oauth_providers"),
        },
        "2fa": {"totp_secret": encrypt_totp_secret(totp_secret),},
    }
    user_manager.insert_one(db, new_user_data)
    back_ground_tasks.add_task(create_project_at_signup, request, db, user_id)
    data = {
        "user_id": user_id,
        "language": "en",
        "is_new_user": True,
        "provisioning_uri": create_profision_uri(
            totp_secret, auth_data.get("primary_email")
        ),
    }

    return response_helper(
        status_code=200, message="User signed up successfully", data=data
    )


def user_login(db, user):
    data = {
        "user_id": user.get("user_id"),
        "language": user.get("language", "en"),
        "is_new_user": False,
    }
    if not user.get("2fa", {}).get("enabled"):
        totp_secret = random_base32()
        data["provisioning_uri"] = create_profision_uri(totp_secret, user.get("email"))
        data["is_new_user"] = True
        user_manager.update_one(
            db,
            {"user_id": user.get("user_id")},
            {"$set": {"2fa": {"totp_secret": encrypt_totp_secret(totp_secret)}}},
        )
    return response_helper(
        status_code=200, message="User logged in successfully", data=data
    )


def verify_two_factor_auth(request, db, payload, response, back_ground_tasks):
    user = user_manager.find_one(db, {"user_id": payload.get("user_id")})

    if not user:
        return response_helper(status_code=400, message="User details not found")

    totp = pyotp.TOTP(decrypt_totp_secret(user.get("2fa", {}).get("totp_secret")))
    if not totp.verify(payload.get("code")):
        return response_helper(status_code=400, message="Invalid code, Pease try again")

    token = create_jwt_token({"user": user.get("user_id")})
    refresh_token = encode_token(user.get("user_id"))

    back_ground_tasks.add_task(record_login_event, request, db, user)

    user_manager.update_one(
        db,
        {"user_id": user.get("user_id")},
        {
            "$set": {
                "token": token,
                "last_login": create_timestamp(),
                "device_id": payload.get("device_id"),
                "2fa": {
                    "enabled": True,
                    "totp_secret": user.get("2fa", {}).get("totp_secret"),
                },
            }
        },
    )

    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True, samesite="strict"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
    )
    data = {
        "user_id": user.get("user_id"),
        "language": "en",
        "token": token,
        "refresh_token": refresh_token,
    }
    return response_helper(
        status_code=200,
        message="Two factor authentication verified successfully",
        data=data,
    )
