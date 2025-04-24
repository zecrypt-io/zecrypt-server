from fastapi import APIRouter, Depends, BackgroundTasks, Request
from app.api.v1.web.wallet_phrases.services import (
    get_wallet_phrases,
    add_wallet_phrase,
    update_wallet_phrase,
    delete_wallet_phrase,
)
from app.api.v1.web.wallet_phrases.schema import WalletPhrase, UpdateWalletPhrase,GetWalletPhrasesList
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user

router = APIRouter()
WALLET_PHRASES = "/{workspace_id}/{project_id}/wallet-phrases"
WALLET_PHRASE_LIST = "/{workspace_id}/{project_id}/wallet-phrases/list"
WALLET_PHRASE_DETAILS = "/{workspace_id}/{project_id}/wallet-phrases/{doc_id}"


@router.post(WALLET_PHRASE_LIST)
async def get_wallet_phrases_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: GetWalletPhrasesList,
    user: UserDetails = Depends(get_current_user),
):
    return get_wallet_phrases(user.get("db"), payload.model_dump(), request)


@router.post(WALLET_PHRASES)
async def create_wallet_phrase_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: WalletPhrase,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_wallet_phrase(request, user, payload.model_dump(), background_tasks)


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
    return update_wallet_phrase(request, user, payload.model_dump(), background_tasks)


@router.delete(WALLET_PHRASE_DETAILS)
async def delete_wallet_phrase_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_wallet_phrase(request, user, background_tasks)
