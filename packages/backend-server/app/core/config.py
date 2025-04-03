from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGO_DB_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str
    ENV: str
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_PASSWORD: str
    FIREBASE_ACCESS_KEY: str
    PUBLIC_KEY: str
    PRIVATE_KEY: str

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
