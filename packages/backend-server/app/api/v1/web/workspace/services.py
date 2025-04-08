from app.managers import workspace as workspace_manager
from app.managers import project as project_manager
from app.utils.utils import response_helper


def get_workspace(query, db):
    return response_helper(
        status_code=200,
        message="Workspace details loaded successfully",
        data=workspace_manager.find(db, query, {"_id": 0}),
        count=workspace_manager.count_documents(db, query),
    )


def load_initial_data(db, query):
    workspaces = workspace_manager.find(db, query)

    for workspace in workspaces:
        projects = project_manager.find(db, {"workspace_id": workspace["_id"]})
        workspace["projects"] = projects
    
    return response_helper(
        status_code=200, message="Initial data loaded successfully", data=workspaces,
        count=len(workspaces),
    )

