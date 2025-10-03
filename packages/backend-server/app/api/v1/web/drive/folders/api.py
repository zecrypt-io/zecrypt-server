from fastapi import APIRouter,Depends
from app.api.v1.web.drive.folders.schema import CreateFolder, RenameFolder, MoveFolder, DeleteFolders
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.drive.folders.services import create_folder,delete_folders,rename_folder, move_folders

FOLDER_URL ="/folder"
router = APIRouter()

@router.post(FOLDER_URL+"/create")
async def create_folder_api(payload: CreateFolder, user: UserDetails = Depends(get_current_user)):
    return  await create_folder(user, payload.model_dump())


@router.delete(FOLDER_URL+"/delete")
async def delete_folder_api(payload: DeleteFolders, user: UserDetails = Depends(get_current_user)):
    return await delete_folders(user, payload.model_dump())


@router.post(FOLDER_URL+"/rename")
async def rename_folder_api(payload: RenameFolder, user: UserDetails = Depends(get_current_user)):
    return await rename_folder(user, payload.model_dump())


@router.post(FOLDER_URL+"/move")
async def move_folder_api(payload: MoveFolder, user: UserDetails = Depends(get_current_user)):
    return await move_folders(user, payload.model_dump())

