from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import padding

from app.managers import user_keys as user_keys_manager


def generate_aes_key():
    # Generate a 256-bit AES GCM key
    aes_key = AESGCM.generate_key(bit_length=256)
    return aes_key


def get_project_key(db, user_id):
    aes_key = generate_aes_key()
    key = user_keys_manager.get_public_key(db, user_id)
    if not key:
        return None
    public_key_pem = key.encode()
    public_key = serialization.load_pem_public_key(
        public_key_pem, backend=default_backend()
    )
    encrypted_aes_key = public_key.encrypt(aes_key, padding.PKCS1v15())
    return encrypted_aes_key
