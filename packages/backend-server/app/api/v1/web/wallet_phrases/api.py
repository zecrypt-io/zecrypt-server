from fastapi import APIRouter, Depends, BackgroundTasks, Request
from app.api.v1.web.secrets.services import (
    get_secrets,
    add_secret,
    update_secret,
    delete_secret,
)
from app.api.v1.web.wallet_phrases.schema import (
    WalletPhrase,
    UpdateWalletPhrase,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import (
    WALLET_PHRASES,
    WALLET_PHRASE_DETAILS,
)
from app.utils.constants import SECRET_TYPE_WALLET_PHRASE as data_type

router = APIRouter()


@router.get(WALLET_PHRASES)
async def get_wallet_phrases_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return await get_secrets(request, user, data_type)


@router.post(WALLET_PHRASES)
async def create_wallet_phrase_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: WalletPhrase,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await add_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


@router.put(WALLET_PHRASE_DETAILS)
async def update_wallet_phrase_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateWalletPhrase,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await update_secret(
        request, user, data_type, payload.model_dump(), background_tasks
    )


@router.delete(WALLET_PHRASE_DETAILS)
async def delete_wallet_phrase_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return await delete_secret(request, user, data_type, background_tasks)
