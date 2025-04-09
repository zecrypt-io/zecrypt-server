from app.utils.date_utils import create_timestamp
from app.utils.utils import create_uuid, response_helper, filter_payload
from app.managers import project as project_manager
from app.managers.collection_names import PROJECT
from app.api.v1.web.auditlogs.services import add_audit_log
from app.api.v1.web.workspace.services import create_initial_workspace_on_signup
from app.managers import audit_log as audit_log_manager

def create_project_at_signup(request, db, user_id):
    workspace_id = create_uuid()
    timestamp = create_timestamp()
    create_initial_workspace_on_signup(db,request, user_id, workspace_id)
    data = {
        "created_by": user_id,
        "name": "Primary Vault",
        "lower_name": "primary vault",
        "created_at": timestamp,
        "updated_at": timestamp,    
        "is_default": True,
        "doc_id": create_uuid(),
        "workspace_id": workspace_id,
    }
    project_manager.insert_one(db, data)
    audit_log = {
        "collection_name": "project",
        "action": "created",
        "created_at": create_timestamp(),
        "created_by": user_id,
        "record_id": data.get("doc_id"),
        "doc_id": create_uuid(),
        "message": "Project is created.",
        "ip_address": request.client.host if request else None,
        "user_agent": request.headers.get('User-Agent') if request else None,
        "workspace_id": workspace_id,
        "project_id": data.get("doc_id")
    }
    audit_log_manager.insert_one(db, audit_log)

def get_project_details(db, doc_id):
    return response_helper(
        status_code=200,
        message="Project details loaded successfully",
        data=project_manager.find_one(db, {"doc_id": doc_id}, {"_id": False}),
    )


def get_projects(db, query, sort=None, projection=None, page=1, limit=20):
    skip = (page - 1) * limit
    if not sort:
        sort = ("_id", 1)

    projects = project_manager.find(
        db, query, projection, sort=sort, skip=skip, limit=limit
    )

    return response_helper(
        status_code=200,
        message="Projects loaded successfully",
        data=projects,
        page=page,
        limit=limit,
        count=len(projects),
    )


def add_project(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    workspace_id = request.path_params.get("workspace_id")
    project = project_manager.find_one(
        db,
        {
            "workspace_id": workspace_id,
            "lower_name": payload.get("lower_name").strip().lower(),
            "created_by": user_id,
        },
    )
    if project:
        return response_helper(status_code=400, message="Project already exists")

    timestamp = create_timestamp()
    payload.update(
        {
            "doc_id": create_uuid(),
            "created_by": user_id,
            "lower_name": payload.get("name").strip().lower(),
            "created_at": timestamp,
            "updated_at": timestamp,
            "workspace_id": workspace_id,
        }
    )
    project_manager.insert_one(db, payload)
    
    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        PROJECT,
        "created",
        payload.get("doc_id"),
        user_id,
        request,
    )
    return response_helper(status_code=201, message="Project added successfully", data=payload,)


def update_project(request, user, payload, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    workspace_id = request.path_params.get("workspace_id")
    doc_id = request.path_params.get("doc_id")
    payload = filter_payload(payload)
    payload.update({"updated_by": user_id, "updated_at": create_timestamp()})
    
    # Process name if it exists in the payload
    if payload.get("name"):
        lower_name = payload["name"].strip().lower()
        payload["lower_name"] = lower_name

        existing_project = project_manager.find_one(
            db,
            {
                "workspace_id": workspace_id,
                "lower_name": lower_name,
                "doc_id": {"$ne": doc_id},
            },
        )
        if existing_project:
            return response_helper(status_code=400, message="project already exists")
    
    # Update account
    project_manager.update_one(
        db, {"doc_id": doc_id}, {"$set": payload},
        )
    
    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        PROJECT,
        "updated",
        doc_id,
        user_id,
        request,
    )
    return response_helper(status_code=200, message="Project updated successfully",)


def delete_project(request, user, background_tasks):
    db = user.get("db")
    user_id = user.get("user_id")
    doc_id = request.path_params.get("doc_id")
    if not project_manager.find_one(db, {"doc_id": doc_id}):
        return response_helper(status_code=404, message="Project details not found",)
    
    project_manager.delete_one(db, {"doc_id": doc_id})
    
    # Add audit log
    background_tasks.add_task(
        add_audit_log,
        db,
        PROJECT,
        "deleted",
        doc_id,
        user_id,
        request,
    )
    return response_helper(status_code=200, message="Project deleted successfully", data={},)