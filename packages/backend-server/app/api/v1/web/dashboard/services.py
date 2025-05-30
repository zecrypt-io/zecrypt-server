from app.utils.utils import response_helper
from app.managers import secrets as secret_manager
from app.managers import project as project_manager

async def get_dashboard_overview(request, user):
    db=user.get("db")
    project_id = request.path_params.get("project_id")
    project_details = project_manager.find_one(db, {"project_id": project_id})
    if not project_details:
        return response_helper(404, "Project not found")
    
    features = project_details.get("features", {})

    data = {}
    for key, value in features.items():
        data[key] = secret_manager.get_project_secrets_count(user.get("db"), key, project_id)

    return response_helper(200, "Dashboard overview fetched successfully", data)

