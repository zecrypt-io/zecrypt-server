import uuid

from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse


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
    return str(uuid.uuid5())


def is_uuid(uuid_string, version=5):
    try:
        # Convert the string to a UUID and check if it's version 4
        val = uuid.UUID(uuid_string, version=version)
    except ValueError:
        # If it's a ValueError, then the string is not a valid UUID4
        return False

    return str(val) == uuid_string.lower()
