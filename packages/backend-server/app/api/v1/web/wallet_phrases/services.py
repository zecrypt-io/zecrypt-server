from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import wallet_phrase as wallet_phrase_manager


def get_wallet_phrase_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="Wallet phrase details loaded successfully",
        data=wallet_phrase_manager.find_one(db, {"doc_id": doc_id}, {"_id": False}),
    )


def get_wallet_phrases(db, query, sort=None, projection=None, page=1, limit=20):
    skip = (page - 1) * limit
    if not sort:
        sort = ("_id", 1)

    wallet_phrases = wallet_phrase_manager.find(
        db, query, projection, sort=sort, skip=skip, limit=limit
    )

    return response_helper(
        status_code=200,
        message="Wallet phrases loaded successfully",
        data=wallet_phrases,
        page=page,
        limit=limit,
        count=len(wallet_phrases),
    )


def add_wallet_phrase(user, workspace_id, project_id, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    wallet_phrase = wallet_phrase_manager.find_one(
        db,
        {
            "lower_name": payload.get("name").strip().lower(),
            "created_by": user_id,
            "project_id": project_id,
        },
    )
    if wallet_phrase:
        return response_helper(status_code=400, message="Wallet phrase already exists")

    timestamp = create_timestamp()
    payload.update(
        {
            "doc_id": create_uuid(),
            "created_by": user_id,
            "lower_name": payload.get("name").strip().lower(),
            "created_at": timestamp,
            "updated_at": timestamp,
            "project_id": project_id,
        }
    )
    wallet_phrase_manager.insert_one(db, payload)

    return response_helper(
        status_code=201, message="Wallet phrase added successfully", data=payload,
    )


def update_wallet_phrase(user, workspace_id, project_id, doc_id, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    payload = filter_payload(payload)
    payload.update({"updated_at": create_timestamp(), "updated_by": user_id})

    # Process name if it exists in the payload
    if payload.get("name"):
        lower_name = payload["name"].strip().lower()
        payload["lower_name"] = lower_name

        existing_wallet_phrase = wallet_phrase_manager.find_one(
            db,
            {
                "project_id": project_id,
                "lower_name": lower_name,
                "doc_id": {"$ne": doc_id},
            },
        )
        if existing_wallet_phrase:
            return response_helper(
                status_code=400, message="Wallet phrase already exists"
            )
    # Update wallet phrase
    wallet_phrase_manager.update_one(
        db, {"doc_id": doc_id}, {"$set": payload,},
    )
    return response_helper(
        status_code=200, message="Wallet phrase updated successfully",
    )


def delete_wallet_phrase(user, workspace_id, project_id, doc_id, background_tasks):
    db = user.get("db")
    if not wallet_phrase_manager.find_one(db, {"doc_id": doc_id}):
        return response_helper(
            status_code=404, message="Wallet phrase details not found",
        )
    wallet_phrase_manager.delete_one(db, {"doc_id": doc_id})
    return response_helper(
        status_code=200, message="Wallet phrase deleted successfully", data={},
    )
