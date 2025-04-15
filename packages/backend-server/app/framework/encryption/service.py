import base64
import hashlib
import random
import re
import string
from base64 import b64encode, b64decode
import os
import logging
import hmac

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Hash import HMAC, SHA256, SHA512

from app.core.config import settings

jwt_secret = settings.JWT_SECRET
jwt_algo = settings.JWT_ALGORITHM

logger = logging.getLogger(__name__)


sensitive_fields = ["user_name", "password", "api_key", "phrase", "wallet_address"]


def generate_passphrase(length=16):
    # list of uppercase letters and digits
    chars = string.ascii_uppercase + string.digits
    
    # generate the passphrase by selecting random characters
    return "".join(random.choice(chars) for _ in range(length))


def generate_key():
    """Generates a secure 256-bit (32-byte) key using OS randomness"""
    try:
        return base64.b64encode(os.urandom(32)).decode("utf-8")
    except Exception as e:
        raise


def get_hmac(key, ciphertext):
    """Generate HMAC for message authentication"""
    hmac = HMAC.new(key, digestmod=SHA512)
    hmac.update(ciphertext)
    return hmac.digest()


def encrypt_message(message):
    if message is None:
        return None

    try:
        key = base64.b64decode(settings.AES_KEY)
        cipher = AES.new(key, AES.MODE_GCM)
        ciphertext, tag = cipher.encrypt_and_digest(message.encode())
        return b64encode(cipher.nonce + tag + ciphertext).decode("utf-8")
    except Exception as e:
        logger.error(f"Encryption error: {e}")
        return None


def decrypt_message(encrypted_message):
    try:
        key = base64.b64decode(settings.AES_KEY)
        data = b64decode(encrypted_message)

        if len(data) < 28:  # 16-byte nonce + 16-byte tag + minimum ciphertext
            raise ValueError("Invalid ciphertext")

        nonce = data[:16]
        tag = data[16:32]
        ciphertext = data[32:]

        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        return plaintext.decode("utf-8")
    except Exception as e:
        logger.error(f"Decryption error: {e}")
        return None


def encrypt_payload(payload):
    """Returns new dict instead of modifying in-place"""
    return {
        key: encrypt_message(value) if key in sensitive_fields else value
        for key, value in payload.items()
    }


def decrypt_payload(payload):
    """Returns new dict with decrypted values"""
    return {
        key: decrypt_message(value) if key in sensitive_fields else value
        for key, value in payload.items()
    }
