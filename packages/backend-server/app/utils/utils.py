from uuid_extensions import uuid7

from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse
import hashlib
import json

def response_helper(
    status_code: int,
    message: any,
    data=None,
    description: str = None,
    error: str = None,
    **kwargs,
):
    result = {"status_code": status_code, "message": message}
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
    return {k: v for k, v in data.items() if v not in [None, "", [], {}]}


def create_uuid():
    return str(uuid7())


def get_origins(env):
    data = {
        "production": ["https://app.zecrypt.io"],
        "dev": ["http://localhost:3000", "https://preview.app.zecrypt.io"],
    }
    return data.get(env, ["*"])

def generate_query_hash(query, projection=None):
    """Generate a unique hash for a given query."""
    query_string = json.dumps(query, sort_keys=True)
    if projection:
        projection_str = json.dumps(projection, sort_keys=True)
    else:
        projection_str = ""
    combined_str = query_string + projection_str

    return hashlib.md5(combined_str.encode()).hexdigest()

