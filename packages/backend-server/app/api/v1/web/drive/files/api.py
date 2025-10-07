from fastapi import APIRouter,Request,Depends,UploadFile
from app.api.v1.web.drive.files.schema import RenameFile, MoveFile, DeleteFiles, GetPresignedUrl
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.drive.files.services import rename_file, get_presigned_url, delete_files, move_files

router = APIRouter()

FILE_URL ="/file"

@router.post(FILE_URL+"/get-presigned-url")
async def get_presigned_url_api(payload: GetPresignedUrl, user: UserDetails = Depends(get_current_user)):
    return await get_presigned_url(user, payload.model_dump())

@router.post(FILE_URL+"/rename")
async def rename_file_api(payload: RenameFile, user: UserDetails = Depends(get_current_user)):
    return await rename_file(user, payload.model_dump())


@router.delete(FILE_URL+"/delete")
async def delete_files_api(payload: DeleteFiles, user: UserDetails = Depends(get_current_user)):
    return await delete_files(user, payload.model_dump())


@router.post(FILE_URL+"/move")
async def move_files_api(payload: MoveFile, user: UserDetails = Depends(get_current_user)):
    return await move_files(user, payload.model_dump())
