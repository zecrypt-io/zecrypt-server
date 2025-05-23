from enum import Enum
from typing import Optional, List, Literal, Union, Annotated
from pydantic import BaseModel, Field
from datetime import datetime
from app.utils.constants import (
    SECRET_TYPE_ACCOUNT,
    SECRET_TYPE_API_KEY,
    SECRET_TYPE_CARD,
    SECRET_TYPE_EMAIL,
    SECRET_TYPE_IDENTITY,
    SECRET_TYPE_LICENSE,
    SECRET_TYPE_SSH_KEY,
    SECRET_TYPE_WALLET_PHRASE,
    SECRET_TYPE_WIFI,
)


# -------------------------
# Enum
# -------------------------


class SecretType(str, Enum):
    ACCOUNT = SECRET_TYPE_ACCOUNT
    API_KEY = SECRET_TYPE_API_KEY
    CARD = SECRET_TYPE_CARD
    EMAIL = SECRET_TYPE_EMAIL
    IDENTITY = SECRET_TYPE_IDENTITY
    LICENSE = SECRET_TYPE_LICENSE
    SSH_KEY = SECRET_TYPE_SSH_KEY
    WALLET_PHRASE = SECRET_TYPE_WALLET_PHRASE
    WIFI = SECRET_TYPE_WIFI


# -------------------------
# Base Models
# -------------------------


class BaseSecretSchema(BaseModel):
    title: str
    type: SecretType
    data: Optional[dict] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    model_config = {"extra": "forbid"}  # Optional, for stricter validation


# -------------------------
# Create Models
# -------------------------


class AccountSecret(BaseSecretSchema):
    type: Literal[SecretType.ACCOUNT] = SecretType.ACCOUNT
    url: Optional[str] = None


class ApiKeySecret(BaseSecretSchema):
    type: Literal[SecretType.API_KEY] = SecretType.API_KEY
    env: Optional[
        Literal["Development", "Production", "Staging", "Testing", "Local", "UAT"]
    ] = "Development"


class CardSecret(BaseSecretSchema):
    type: Literal[SecretType.CARD] = SecretType.CARD
    brand: Optional[str] = None


class EmailSecret(BaseSecretSchema):
    type: Literal[SecretType.EMAIL] = SecretType.EMAIL


class IdentitySecret(BaseSecretSchema):
    type: Literal[SecretType.IDENTITY] = SecretType.IDENTITY


class LicenseSecret(BaseSecretSchema):
    type: Literal[SecretType.LICENSE] = SecretType.LICENSE
    expires_at: Optional[datetime] = None


class SshKeySecret(BaseSecretSchema):
    type: Literal[SecretType.SSH_KEY] = SecretType.SSH_KEY


class WalletPhraseSecret(BaseSecretSchema):
    type: Literal[SecretType.WALLET_PHRASE] = SecretType.WALLET_PHRASE
    wallet_type: Optional[str] = None


class WifiSecret(BaseSecretSchema):
    type: Literal[SecretType.WIFI] = SecretType.WIFI
    security_type: Optional[str] = None


# Discriminated Union for FastAPI
SecretCreateSchema = Annotated[
    Union[
        AccountSecret,
        ApiKeySecret,
        CardSecret,
        EmailSecret,
        IdentitySecret,
        LicenseSecret,
        SshKeySecret,
        WalletPhraseSecret,
        WifiSecret,
    ],
    Field(discriminator="type"),
]


# -------------------------
# Update Models
# -------------------------


class BaseSecretUpdateSchema(BaseModel):
    title: Optional[str] = None
    data: Optional[dict] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class UpdateAccountSecret(BaseSecretUpdateSchema):
    url: Optional[str] = None


class UpdateApiKeySecret(BaseSecretUpdateSchema):
    env: Optional[
        Literal["Development", "Production", "Staging", "Testing", "Local", "UAT"]
    ] = None


class UpdateCardSecret(BaseSecretUpdateSchema):
    brand: Optional[str] = None


class UpdateEmailSecret(BaseSecretUpdateSchema):
    pass


class UpdateIdentitySecret(BaseSecretUpdateSchema):
    pass


class UpdateLicenseSecret(BaseSecretUpdateSchema):
    expires_at: Optional[datetime] = None


class UpdateSshKeySecret(BaseSecretUpdateSchema):
    pass


class UpdateWalletPhraseSecret(BaseSecretUpdateSchema):
    wallet_type: Optional[str] = None


class UpdateWifiSecret(BaseSecretUpdateSchema):
    security_type: Optional[str] = None


SecretUpdateSchema = Annotated[
    Union[
        UpdateAccountSecret,
        UpdateApiKeySecret,
        UpdateCardSecret,
        UpdateEmailSecret,
        UpdateIdentitySecret,
        UpdateLicenseSecret,
        UpdateSshKeySecret,
        UpdateWalletPhraseSecret,
        UpdateWifiSecret,
    ],
    Field(discriminator="type"),
]
