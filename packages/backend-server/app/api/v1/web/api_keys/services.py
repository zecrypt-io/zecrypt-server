from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import api_keys as api_key_manager
from app.managers.collection_names import API_KEY
from app.api.v1.web.audit_logs.services import add_audit_log


def get_api_key_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="API Key details loaded successfully",
        data=api_key_manager.find_one(db, {"doc_id": doc_id}, {"_id": False}),
    )


def get_api_keys(db, payload, request):
    page=payload.get("page",1)
    limit=payload.get("limit",20)
    tags=payload.get("tags",[])
    status=payload.get("status",None)
    env=payload.get("env",None)
    name=payload.get("name",None)
    project_id=request.path_params.get("project_id")
    
    query={
        "project_id":project_id
    }
    
    if tags:
        query["tags"]={"$in":tags}
    
    if status:
        query["status"]=status  
    
    if env:
        query["env"]=env
    
    skip = (page - 1) * limit
    
    sort = ("_id", 1)

    if name:
        query["lower_name"] = {"$regex": name.strip().lower()}

    api_keys = api_key_manager.find(
        db, query,  sort=sort, skip=skip, limit=limit
    )

    return response_helper(
        status_code=200,
        message="API Keys loaded successfully",
        data=api_keys,
        page=page,
        limit=limit,
        count=len(api_keys),
    )


def add_api_key(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    project_id = request.path_params.get("project_id")
    lower_name = payload.get("name").strip().lower()
    query= {
            "lower_name": lower_name,
            "created_by": user_id,
            "project_id": project_id,
        }
    
    api_key = api_key_manager.find_one(
        db,
        query,
    )
    if api_key:
        return response_helper(status_code=400, message="API Key already exists")

    timestamp = create_timestamp()
    payload.update(
        {
            "doc_id": create_uuid(),
            "created_by": user_id,
            "lower_name": lower_name,
            "created_at": timestamp,
            "updated_at": timestamp,
            "project_id": project_id,
        }
    )
    api_key_manager.insert_one(db, payload)

    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        API_KEY,
        "created",
        payload.get("doc_id"),
        user_id,
        request,
    )
    return response_helper(
        status_code=201, message="API Key added successfully", data=payload,
    )


def update_api_key(request, user, payload, background_tasks):
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

        existing_account = api_key_manager.find_one(
            db,
            {
                "project_id": project_id,
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

    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        API_KEY,
        "updated",
        doc_id,
        user_id,
        request,
    )
    return response_helper(status_code=200, message="API Key updated successfully",)


def delete_api_key(request, user, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    doc_id = request.path_params.get("doc_id")

    if not api_key_manager.find_one(db, {"doc_id": doc_id}):
        return response_helper(status_code=404, message="API Key details not found",)
    api_key_manager.delete_one(db, {"doc_id": doc_id})

    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        API_KEY,
        "deleted",
        doc_id,
        user_id,
        request,
    )
    return response_helper(status_code=200, message="API Key deleted successfully", data={},)
