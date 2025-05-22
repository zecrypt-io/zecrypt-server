from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.middlewares.lang_middleware import LanguageMiddleware
from app.utils.i8ns import load_translations, translate

load_translations()

app = FastAPI(
    title="Zecrypt API Documentation",
    version="v1",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.zecrypt.io", "http://localhost:3000"],
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
