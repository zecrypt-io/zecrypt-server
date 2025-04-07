from app.framework.mongo_db.base_model import BaseModel
from typing import Optional
from datetime import datetime


class WalletPhrase(BaseModel):
    """Represents a cryptocurrency wallet mnemonic phrase and associated metadata

    Attributes:
        name: Human-readable name for the wallet
        phrase: The mnemonic recovery phrase (BIP-39)
        wallet_address: Derived wallet address (optional)
        wallet_type: Blockchain type (e.g. 'EVM', 'Solana')
        tag: Categorization labels for organization
    """

    name: str
    phrase: str
    wallet_address: Optional[str] = None
    wallet_type: Optional[str] = None
    tag: Optional[list[str]] = None


class UpdateWalletPhrase(BaseModel):
    """Update schema allowing partial updates to WalletPhrase fields

    All fields are optional - only provided fields will be updated
    """

    name: Optional[str] = None
    phrase: Optional[str] = None
    wallet_address: Optional[str] = None
    wallet_type: Optional[str] = None
    tag: Optional[list[str]] = None
