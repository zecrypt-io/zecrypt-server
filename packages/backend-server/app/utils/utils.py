import string
from uuid_extensions import uuid7
import random

from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse


def id_generator(size=10, chars=string.ascii_uppercase + string.digits + string.digits):
    return "".join(random.choice(chars) for _ in range(size))


def response_helper(
    status_code: int,
    message: any,
    data=None,
    description: str = None,
    error: str = None,
    **kwargs
):
    result = {
        "status_code": status_code,
        "message": message
    }
    if description is not None:
        result["description"] = description
    if data is not None:
        result["data"] = data
    if error is not None:
        result["error"] = error
    
    # Add any extra fields, but do not overwrite existing keys
    for key, value in kwargs.items():
        if key not in result:
            result[key] = value
    
    return JSONResponse(status_code=status_code, content=jsonable_encoder(result))


def filter_payload(data):
    return {k: v for k, v in data.items() if v not in [None, '', [], {}]}

def create_uuid():
    return str(uuid7())
