from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import wallet_phrase as wallet_phrase_manager
from app.api.v1.web.audit_logs.services import add_audit_log
from app.managers.collection_names import WALLET_PHRASE


def get_wallet_phrase_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="Wallet phrase details loaded successfully",
        data=wallet_phrase_manager.find_one(db, {"doc_id": doc_id}, {"_id": False}),
    )


def get_wallet_phrases(db, payload, request):
    page=payload.get("page",1)
    limit=payload.get("limit",20)
    tags=payload.get("tags",[])
    name=payload.get("name",None)
    wallet_type=payload.get("wallet_type",None)
    project_id=request.path_params.get("project_id")

    query={
        "project_id":project_id
    }
    if tags:
        query["tags"]={"$in":tags}
    if name:
        query["lower_name"]={"$regex":name.strip().lower()}

    if wallet_type:
        query["wallet_type"]=wallet_type
    skip = (page - 1) * limit
    
    sort = ("_id", 1)

    wallet_phrases = wallet_phrase_manager.find(
        db, query, sort=sort, skip=skip, limit=limit
    )

    return response_helper(
        status_code=200,
        message="Wallet phrases loaded successfully",
        data=wallet_phrases,
        page=page,
        limit=limit,
        count=len(wallet_phrases),
    )


def add_wallet_phrase(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    project_id = request.path_params.get("project_id")
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

    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        WALLET_PHRASE,
        "created",
        payload.get("doc_id"),
        user_id,
        request,
    )
    return response_helper(status_code=201, message="Wallet phrase added successfully", data=payload,)


def update_wallet_phrase(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    project_id = request.path_params.get("project_id")
    doc_id = request.path_params.get("doc_id")
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
    
    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        WALLET_PHRASE,
        "updated",
        doc_id,
        user_id,
        request,
    )
    return response_helper(status_code=200, message="Wallet phrase updated successfully", data=payload,)


def delete_wallet_phrase(request, user, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    doc_id = request.path_params.get("doc_id")
    if not wallet_phrase_manager.find_one(db, {"doc_id": doc_id}):
        return response_helper(
            status_code=404, message="Wallet phrase details not found",
        )
    wallet_phrase_manager.delete_one(db, {"doc_id": doc_id})
    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        WALLET_PHRASE,
        "deleted",
        doc_id,
        user_id,
        request,
    )
    return response_helper(status_code=200, message="Wallet phrase deleted successfully", data={},)
