from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import api_keys as api_key_manager


def get_api_key_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="API Key details loaded successfully",
        data=api_key_manager.find_one(db, {"doc_id": doc_id}, {"_id": False}),
    )


def get_api_keys(db, query, sort=None, projection=None, page=1, limit=20):
    skip = (page - 1) * limit
    if not sort:
        sort = ("_id", 1)

    api_keys = api_key_manager.find(
        db, query, projection, sort=sort, skip=skip, limit=limit
    )

    return response_helper(
        status_code=200,
        message="API Keys loaded successfully",
        data=api_keys,
        page=page,
        limit=limit,
        count=len(api_keys),
    )


def add_api_key(db, payload):
    api_key = api_key_manager.find_one(
        db,
        {
            "lower_name": payload.get("lower_name").strip().lower(),
            "created_by": payload.get("created_by"),
            "project_id": payload.get("project_id"),
        },
    )
    if api_key:
        return response_helper(status_code=400, message="Project already exists")

    timestamp = create_timestamp()
    payload.update(
        {
            "doc_id": create_uuid(),
            "updated_by": payload.get("created_by"),
            "lower_name": payload.get("name").strip().lower(),
            "created_at": timestamp,
            "updated_at": timestamp,
        }
    )
    api_key_manager.insert_one(db, payload)

    return response_helper(
        status_code=201, message="API Key added successfully", data=payload,
    )


def update_api_key(db, doc_id, payload):
    payload = filter_payload(payload)
    payload["updated_at"] = create_timestamp()
    # Process name if it exists in the payload
    if payload.get("name"):
        lower_name = payload["name"].strip().lower()
        payload["lower_name"] = lower_name

        existing_account = api_key_manager.find_one(
            db,
            {
                "project_id": payload.get("project_id"),
                "lower_name": lower_name,
                "doc_id": {"$ne": doc_id},
            },
        )
        if existing_account:
            return response_helper(status_code=400, message="API Key already exists")
    # Update account
    api_key_manager.update_one(
        db, {"doc_id": doc_id}, {"$set": payload,},
    )
    return response_helper(status_code=200, message="API Key updated successfully",)


def delete_api_key(db, doc_id):
    if not api_key_manager.find_one(db, {"doc_id": doc_id}):
        return response_helper(status_code=404, message="API Key details not found",)
    api_key_manager.delete_one(db, {"doc_id": doc_id})
    return response_helper(
        status_code=200, message="API Key deleted successfully", data={},
    )
