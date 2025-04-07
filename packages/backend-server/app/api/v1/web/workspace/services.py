from app.managers import workspace as workspace_manager
from app.utils.utils import response_helper


def get_workspace(query, db):
    print(query)
    print(db)
    return response_helper(
        status_code=200,
        message="Workspace details loaded successfully",
        data=workspace_manager.find(db,query, {"_id": 0}),
    )
