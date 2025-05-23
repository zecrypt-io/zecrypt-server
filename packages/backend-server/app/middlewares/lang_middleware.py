from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.utils.i8ns import set_language


class LanguageMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        lang = request.headers.get("Accept-Language", "en").split(",")[0]
        set_language(lang.lower())
        response = await call_next(request)
        return response
