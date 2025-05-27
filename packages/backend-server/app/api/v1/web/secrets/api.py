from fastapi import APIRouter
from app.api.v1.web.secrets.accounts import api as accounts_router
from app.api.v1.web.secrets.api_keys import api as api_keys_router
from app.api.v1.web.secrets.wallet_phrases import api as wallet_phrases_router
from app.api.v1.web.secrets.emails import api as emails_router
from app.api.v1.web.secrets.identity import api as identity_router
from app.api.v1.web.secrets.cards import api as cards_router
from app.api.v1.web.secrets.wifi import api as wifi_router
from app.api.v1.web.secrets.licenses import api as licenses_router
from app.api.v1.web.secrets.ssh_keys import api as ssh_keys_router
from app.api.v1.web.secrets.notes import api as notes_router
from app.api.v1.web.secrets.password_history import api as password_history_router

secrets_router = APIRouter()


secrets_router.include_router(accounts_router.router, tags=["Secrets: Accounts"])
secrets_router.include_router(api_keys_router.router, tags=["Secrets: API Keys"])
secrets_router.include_router(cards_router.router, tags=["Secrets: Cards"])
secrets_router.include_router(emails_router.router, tags=["Secrets: Emails"])
secrets_router.include_router(identity_router.router, tags=["Secrets: Identities"])
secrets_router.include_router(licenses_router.router, tags=["Secrets: Licenses"])
secrets_router.include_router(notes_router.router, tags=["Secrets: Notes"])
secrets_router.include_router(ssh_keys_router.router, tags=["Secrets: SSH Keys"])
secrets_router.include_router(wallet_phrases_router.router, tags=["Secrets: Wallet Phrases"])
secrets_router.include_router(wifi_router.router, tags=["Secrets: Wifi"])
secrets_router.include_router(password_history_router.router, tags=["Secrets: Password History"])