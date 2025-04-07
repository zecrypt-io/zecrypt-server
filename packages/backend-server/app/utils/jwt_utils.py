from datetime import timedelta, datetime
import jwt

from app.core.config import settings
from app.utils.date_utils import get_expire_timestamp

def create_jwt_token(
    data: dict,
    expires_delta: timedelta = None,
):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=2)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt



def encode_token(userid, days=30, ttl=None, device_id=None):
    user_id = userid
    payload = {
        "user": str(user_id),
        "exp": get_expire_timestamp(ttl=ttl, days=days),
        "device_id": device_id,
    }
    encoded = jwt.encode(payload, str(jwt_secret), algorithm=str(jwt_algo))
    return encoded
