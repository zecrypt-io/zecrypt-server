from app.utils.utils import response_helper
from app.managers import (
    secrets as secret_manager,
    project as project_manager,
    project_activity as project_activity_manager,
)
from app.utils.i8ns import translate


async def get_dashboard_overview(request, user):
    db = user.get("db")
    project_id = request.path_params.get("project_id")
    project_details = project_manager.find_one(db, {"doc_id": project_id})
    if not project_details:
        return response_helper(404, "Project not found")

    features = project_details.get("features", {})

    data = {}
    for key, value in features.items():
        print(key, value.get("enabled"))
        if value.get("enabled"):
            data[key] = secret_manager.get_project_secrets_count(db, key, project_id)

    return response_helper(200, translate("dashboard.overview"), data)


async def get_dashboard_recent_activity(request, user):
    db = user.get("db")
    project_id = request.path_params.get("project_id")
    project_details = project_manager.find_one(db, {"doc_id": project_id})
    if not project_details:
        return response_helper(404, "Project not found")

    data = project_activity_manager.find(db, {"project_id": project_id})
    for item in data:
        item["title"] = secret_manager.get_title(db, item.get("record_id"))
    return response_helper(200, translate("dashboard.recent_activity"), data)
