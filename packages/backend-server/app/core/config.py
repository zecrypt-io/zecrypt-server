from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGO_DB_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS512"
    ENV: str
    DB_NAME: str

    STACK_AUTH_PROJECT_ID: str
    STACK_AUTH_CLIENT_ID: str
    STACK_AUTH_CLIENT_SECRET: str
    TOTP_SECRET: str

    VALKEY_URL: str

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
