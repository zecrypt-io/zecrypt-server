import requests
from app.framework.encryption.service import (
    generate_key,
    encrypt_message,
    decrypt_message,
    encrypt_payload,
    decrypt_payload,
)


def run():
    a = encrypt_message("1234567890")
    print(a)
    print(decrypt_message(a))

    payload = {
        "user_name": "1234567890",
        "password": "1234567890",
        "api_key": "1234567890",
        "phrase": "1234567890",
        "wallet_address": "1234567890",
        "company_id": "1234567890",
        "project_id": "1234567890",
        "user_id": "1234567890",
        "user_email": "1234567890",
    }
    encrypted_payload = encrypt_payload(payload)
    print(encrypted_payload)
    decrypted_payload = decrypt_payload(encrypted_payload)
    print(decrypted_payload)


if __name__ == "__main__":
    run()
