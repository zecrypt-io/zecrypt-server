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
from Crypto.Hash import HMAC, SHA256

from app.core.config import settings

jwt_secret = settings.JWT_SECRET
jwt_algo = settings.JWT_ALGORITHM

logger = logging.getLogger(__name__)




def generate_passphrase(length=16):
    # list of uppercase letters and digits
    chars = string.ascii_uppercase + string.digits
    # generate the passphrase by selecting random characters
    return "".join(random.choice(chars) for _ in range(length))


def generate_key():
    """Generates a secure 256-bit (32-byte) key using OS randomness"""
    try:
        return base64.b64encode(os.urandom(32)).decode('utf-8')
    except Exception as e:
        raise


def get_hmac(key, ciphertext):
    """Generate HMAC for message authentication"""
    hmac = HMAC.new(key, digestmod=SHA256)
    hmac.update(ciphertext)
    return hmac.digest()


def encrypt_message(message):
    if message is None:
        return None

    try:
        key = base64.b64decode(settings.AES_KEY)
        iv = os.urandom(16)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        
        padded_data = pad(message.encode(), AES.block_size)
        ciphertext = cipher.encrypt(padded_data)
        hmac = get_hmac(key, iv + ciphertext)
        
        combined = iv + ciphertext + hmac
        return b64encode(combined).decode('utf-8')
    except Exception as e:
        return None


def decrypt_message(encrypted_message):
    try:
        if not encrypted_message:
            raise ValueError("Empty ciphertext received")
            
        key = base64.b64decode(settings.AES_KEY)
        combined = b64decode(encrypted_message)
        
        if len(combined) < 48:  # IV(16) + HMAC(32) + minimum 1 byte ciphertext
            raise ValueError("Invalid ciphertext length")
            
        iv = combined[:16]
        ciphertext = combined[16:-32]
        received_hmac = combined[-32:]
        
        # Verify HMAC first
        expected_hmac = get_hmac(key, iv + ciphertext)
        if not hmac.compare_digest(received_hmac, expected_hmac):
            raise ValueError("HMAC validation failed")
            
        cipher = AES.new(key, AES.MODE_CBC, iv)
        plaintext = unpad(cipher.decrypt(ciphertext), AES.block_size)
        return plaintext.decode('utf-8')
        
    except Exception as e:
        logger.error(f"Decryption failed: {str(e)}")
        # Return original message if decryption fails
        return encrypted_message


def encrypt_payload(payload):
    """
    Encrypts a payload using AES encryption for a specific company.

    Parameters:
    payload (dict): The payload to be encrypted.
    """
    for key, value in payload.items():
        if key in ["user_name","password","api_key","phrase","wallet_address"]:
            payload[key] = encrypt_message(value)
    return payload


def decrypt_payload(payload):
    """
    Decrypts a payload using AES encryption for a specific company.
    payload (dict): The payload to be decrypted.
    """
    for key, value in payload.items():
        if key in ["user_name","password","api_key","phrase","wallet_address"]:
            payload[key] = decrypt_message(value)
    return payload


