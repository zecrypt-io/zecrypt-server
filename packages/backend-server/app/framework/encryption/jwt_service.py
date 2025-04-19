import jwt
from fastapi.exceptions import HTTPException

from app.core.config import settings
from app.utils.date_utils import get_expire_timestamp

jwt_secret = settings.JWT_SECRET
jwt_algo = settings.JWT_ALGORITHM


def encode_token(userid, days=7, ttl=None):
    user_id = userid
    payload = {
        "user": str(user_id),
        "exp": get_expire_timestamp(ttl=ttl, days=days),
    }
    encoded = jwt.encode(payload, str(jwt_secret), algorithm=str(jwt_algo))
    return encoded


def generate_jwt(
    data: dict,
    lifetime_seconds: int = 3600,
    secret: str = jwt_secret,
    algorithm: str = jwt_algo,
):
    payload = data.copy()
    payload["exp"] = get_expire_timestamp(lifetime_seconds)
    return jwt.encode(payload, secret, algorithm=algorithm)


def decode_jwt(token: str, secret: str = jwt_secret, algorithm: str = jwt_algo):
    try:
        return jwt.decode(
            token,
            secret,
            algorithms=[algorithm],
            options={"verify_exp": True, "verify_signature": True},
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=e.__str__())


def decode_jwt_without_signature(
    token: str, secret: str = jwt_secret, algorithm: str = jwt_algo
):
    try:
        return jwt.decode(
            token,
            secret,
            algorithm=algorithm,
            options={"verify_exp": False, "verify_signature": False},
        )
    except Exception:
        raise HTTPException(status_code=401, detail="invalid_token")
