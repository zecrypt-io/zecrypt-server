import string
from uuid_extensions import uuid7
import random

from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse


def id_generator(size=10, chars=string.ascii_uppercase + string.digits + string.digits):
    return "".join(random.choice(chars) for _ in range(size))


def response_helper(
    status_code,
    message: any,
    data=None,
    description: str = None,
    error: str = None,
    **kwargs
):
    result = {"status_code": status_code, "message": message}
    if description:
        result["description"] = description

    result["data"] = data

    for key, value in kwargs.items():
        result[key] = value
    if error:
        result["error"] = error
    return JSONResponse(status_code=status_code, content=jsonable_encoder(result))


def filter_payload(data):
    return {k: v for k, v in data.items() if v is not None}


def create_uuid():
    return str(uuid7())
