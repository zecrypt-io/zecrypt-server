from fastapi import APIRouter

router = APIRouter()
WALLET_PHRASES = "/{project_id}/wallet-phrases"
WALLET_PHRASE_DETAILS = "/{project_id}/wallet-phrases/{doc_id}"
@router.get(WALLET_PHRASES)
async def get_wallet_phrases(project_id: str):

    return {"message": "Hello, World!"}

@router.post(WALLET_PHRASES)
async def create_wallet_phrase():
    return {"message": "Hello, World!"}

@router.put(WALLET_PHRASE_DETAILS)
async def update_wallet_phrase(project_id: str, doc_id: str):
    return {"message": "Hello, World!"}

@router.delete(WALLET_PHRASE_DETAILS)
async def delete_wallet_phrase(project_id: str, doc_id: str):
    
    return {"message": "Hello, World!"}

