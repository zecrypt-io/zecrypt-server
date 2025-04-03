import structlog
import logfire

from app.core.config import settings

logfire.configure(token=settings.LOGFIRE_TOKEN, environment=settings.ENV)


def get_logger(logger_name):
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S", utc=False),
            logfire.StructlogProcessor(),
            structlog.dev.ConsoleRenderer(),
        ],
    )
    logger = structlog.get_logger()
    return logger
