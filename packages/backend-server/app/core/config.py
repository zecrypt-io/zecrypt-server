from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGO_DB_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str
    ENV: str
    PUBLIC_KEY: str
    PRIVATE_KEY: str
    STACK_AUTH_PROJECT_ID: str
    STACK_AUTH_CLIENT_ID: str
    STACK_AUTH_CLIENT_SECRET: str

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
