from app.managers import secrets as secrets_manager
from app.api.v1.web.secrets.utils import process_payload, build_query
from app.utils.utils import create_uuid, response_helper

async def add_secret(request, user, payload, background_tasks):
    db = user.get("db")
    workspace_id=request.path_params.get("workspace_id")
    project_id=request.path_params.get("project_id")
    query={
        "project_id":project_id,
        "workspace_id":workspace_id,
        "lower_title":payload.get("title").strip().lower(),
        "secret_type":payload.get("secret_type")
    }
    if secrets_manager.find_one(db,query):
        return response_helper( 
            status_code=400,
            message="Secret already exists"
        )

    data={
        "doc_id":create_uuid(),
        "title":payload.get("title"),
        "lower_title":payload.get("title").strip().lower(),
        "data":payload.get("data"),
        "description":payload.get("description"),
        "tags":payload.get("tags"),
        "secret_type":payload.get("secret_type"),
        "workspace_id":workspace_id,
        "project_id":project_id,
        "created_by":user.get("user_id"),
    }
    specific_data=process_payload(payload.get("secret_type"),payload.get("payload"),"create")
    data.update(specific_data)
    secrets_manager.insert_one(db,data)
    return response_helper(
        status_code=200,
        message="Secret added successfully",
        data=data
    )


async def get_secrets_details(request,user,doc_id):
    db=user.get("db")
    return secrets_manager.find_one(db,{"_id":doc_id})


async def get_secrets_list(request,user,payload):
    db=user.get("db")
    page=payload.get("page",1)
    limit=payload.get("limit",20)
    project_id=request.path_params.get("project_id")
    query={
        "project_id":project_id,
        "secret_type":payload.get("secret_type")
    }
    
    query.update(build_query(payload, query))
    skip = (page - 1) * limit
    if payload.get("sort_by"):
        sort = (payload.get("sort_by"), 1 if payload.get("sort_order") == "asc" else -1)
    else:
        sort = ("_id", 1)
    data=secrets_manager.find(db,query,sort,skip,limit)
    return response_helper(
        status_code=200,
        message="Secrets list loaded successfully",
        data=data,
        count=secrets_manager.count_documents(db,query),
        page=page,
        limit=limit
    )


async def update_secret(request,user,payload):
    db=user.get("db")
    doc_id=request.path_params.get("doc_id")
    return secrets_manager.update_one(db,{"_id":doc_id},payload)

async def delete_secret(request,user):
    db=user.get("db")
    doc_id=request.path_params.get("doc_id")
    if not secrets_manager.find_one(db,{"_id":doc_id}):
        return response_helper(
            status_code=400,
            message="Secret not found"
        )
    secrets_manager.delete_one(db,{"_id":doc_id})
    return response_helper(
        status_code=200,
        message="Secret deleted successfully"
    )