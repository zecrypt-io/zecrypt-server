from fastapi import APIRouter, Request, Depends, BackgroundTasks

from app.api.v1.web.cards.schema import UpdateCard, AddCard, GetCardsList
from app.api.v1.web.cards.services import (
    delete_card,
    update_card,
    add_card,
    get_cards,
    get_card_details,
)
from app.api.v1.web.auth.schema import UserDetails
from app.framework.permission_services.service import get_current_user
from app.api.v1.web.route_constants import CARDS_LIST, CARD_DETAILS, CARDS

router = APIRouter()


@router.post(CARDS_LIST)
async def get_card_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: GetCardsList,
    user: UserDetails = Depends(get_current_user),
):

    return get_cards(user.get("db"), payload.model_dump(), request)


@router.get(CARD_DETAILS)
async def get_card_details_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    user: UserDetails = Depends(get_current_user),
):
    return get_card_details(user.get("db"), doc_id)


@router.post(CARDS)
async def create_cards_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    payload: AddCard,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return add_card(request, user, payload.model_dump(), background_tasks)


@router.put(CARD_DETAILS)
async def update_card_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    payload: UpdateCard,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return update_card(request, user, payload.model_dump(), background_tasks)


@router.delete(CARD_DETAILS)
async def delete_card_api(
    request: Request,
    workspace_id: str,
    project_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserDetails = Depends(get_current_user),
):
    return delete_card(request, user, background_tasks)
