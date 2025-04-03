from fastapi import APIRouter, Request, Query

from app.framework.mongo_db.db import get_db

router = APIRouter()
db = get_db()
ACCOUNTS = "/accounts"
ACCOUNT_DETAILS = "/accounts/{doc_id}"


@router.get(ACCOUNTS)
async def get_accounts_api(
        request: Request,
        search_query: str = Query(None, description="Search query"),
        project_id: str = Query(None, description="Project ID"),
        page: int = Query(1, description="Page number", ge=1),
        limit: int = Query(20, description="Items per page", ge=1),
):
    return {}


@router.get(ACCOUNT_DETAILS)
async def get_account_details_api(
        request: Request,
        doc_id: str,
):
    return {}


@router.post(ACCOUNTS)
async def create_account_api(
        request: Request,
):
    return {}


@router.put(ACCOUNT_DETAILS)
async def update_account_api(
        request: Request,
        doc_id: str,
):
    return {}


@router.delete(ACCOUNT_DETAILS)
async def delete_account_api(
        request: Request,
        doc_id: str,
):
    return {}
