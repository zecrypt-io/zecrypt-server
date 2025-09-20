from fastapi import APIRouter,Request,Depends,Query, BackgroundTasks    
from app.api.v1.web.drive.folders.schema import Folder, RenameFolder
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.drive.folders.services import create_folder, get_folders, get_folder_by_id, delete_folder, rename_folder

router = APIRouter()

FOLDER_URL ="/folder"

@router.post(FOLDER_URL)
async def create_folder_api(payload: Folder, user: UserDetails = Depends(get_current_user)):
    return await create_folder(user, payload.model_dump())

@router.get(FOLDER_URL)
async def get_folders_api(
    request: Request,
    parent_id: str = Query(None, description="Parent folder ID"),
    user: UserDetails = Depends(get_current_user),
):
    return await get_folders(user, parent_id)


@router.get(FOLDER_URL+"/{folder_id}")
async def get_folder_by_id_api(
    request: Request,
    folder_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_folder_by_id(user, folder_id)

@router.delete(FOLDER_URL+"/{folder_id}")
async def delete_folder_api(
    request: Request,
    folder_id: str,
    background_task: BackgroundTasks,  
    user: UserDetails = Depends(get_current_user),
):
    return await delete_folder(user, folder_id, background_task)

@router.post(FOLDER_URL+"/rename")
async def rename_folder_api(payload: RenameFolder, user: UserDetails = Depends(get_current_user)):
    return await rename_folder(user, payload.model_dump())