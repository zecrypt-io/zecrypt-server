from fastapi import APIRouter, Depends
from app.api.v1.web.wallet_phrases.services import (
    get_wallet_phrases,
    add_wallet_phrase,
    update_wallet_phrase,
    delete_wallet_phrase,
)
from app.api.v1.web.wallet_phrases.schema import WalletPhrase, UpdateWalletPhrase
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user

router = APIRouter()
WALLET_PHRASES = "/{workspace_id}/{project_id}/wallet-phrases"
WALLET_PHRASE_DETAILS = "/{workspace_id}/{project_id}/wallet-phrases/{doc_id}"


@router.get(WALLET_PHRASES)
async def get_wallet_phrases_api(
    workspace_id: str,
    project_id: str,
    page: int = 1,
    limit: int = 20,
    user: UserDetails = Depends(get_current_user),
):
    query = {"project_id": project_id}
    return get_wallet_phrases(user.get("db"), query, page=page, limit=limit)


@router.post(WALLET_PHRASES)
async def create_wallet_phrase_api(
    workspace_id: str,
    project_id: str,
    payload: WalletPhrase,
    user: UserDetails = Depends(get_current_user),
):
    payload = payload.model_dump()
    payload.update({"project_id": project_id, "created_by": user.get("user_id")})
    return add_wallet_phrase(user.get("db"), payload)


@router.put(WALLET_PHRASE_DETAILS)
async def update_wallet_phrase_api(
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateWalletPhrase,
    user: UserDetails = Depends(get_current_user),
):
    payload = payload.model_dump()
    payload.update({"project_id": project_id, "updated_by": user.get("user_id")})
    return update_wallet_phrase(user.get("db"), doc_id, payload)


@router.delete(WALLET_PHRASE_DETAILS)
async def delete_wallet_phrase_api(
    workspace_id: str,
    project_id: str,
    doc_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return delete_wallet_phrase(user.get("db"), doc_id)
