from app.managers import workspace as workspace_manager
from app.managers import project as project_manager
from app.utils.date_utils import create_timestamp
from app.utils.utils import response_helper
from app.api.v1.web.audit_logs.services import add_audit_log

def create_initial_workspace_on_signup(db,request, user_id, workspace_id):
    timestamp = create_timestamp()
    workspace_manager.insert_one(
        db,
        {
            "created_by": user_id,
            "doc_id": workspace_id,
            "name": "Personal Workspace",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
    )
    # Add audit log
    add_audit_log(
        db,
        "workspace",
        "created",
        workspace_id,
        user_id,
        request,
    )
    

def get_workspace(query, db):
    return response_helper(
        status_code=200,
        message="Workspace details loaded successfully",
        data=workspace_manager.find(db, query, {"_id": 0}),
        count=workspace_manager.count_documents(db, query),
    )


def load_initial_data(request, user):
    db = user.get("db")
    user_id = user.get("user_id")
    query = {
        "created_by": user_id,
    }
    workspaces = workspace_manager.find(db, query)

    for workspace in workspaces:
        projects = project_manager.find(db, {"workspace_id": workspace.get("doc_id")})
        workspace["projects"] = projects

    return response_helper(
        status_code=200,
        message="Initial data loaded successfully",
        data=workspaces,
        count=len(workspaces),
    )
