from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.middlewares.lang_middleware import LanguageMiddleware
from app.utils.i8ns import load_translations, translate
from app.core.config import settings
from app.utils.utils import get_origins

load_translations()

# Configure documentation URLs based on environment
docs_url = "/docs" if settings.ENV != "production" else None
redoc_url = "/redoc" if settings.ENV != "production" else None
openapi_url = "/openapi.json" if settings.ENV != "production" else None

app = FastAPI(
    title="Zecrypt API Documentation",
    version="v1",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_origins(settings.ENV),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LanguageMiddleware)

# Templates (HTML)
templates = Jinja2Templates(directory="templates")

# Static files
static_files = StaticFiles(directory="static")
app.mount("/static", static_files)


# Landing page route
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/health")
async def health():
    return {"status": translate("health.status")}
