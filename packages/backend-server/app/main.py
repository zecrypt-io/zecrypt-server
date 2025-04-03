import json

import firebase_admin
from firebase_admin import credentials as firebase_credentials
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.api.v1.api import api_router

from app.core.config import settings

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates (HTML)
templates = Jinja2Templates(directory="templates")

# Landing page route
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Initialize firebase for auth
firebase_access_key = json.loads(settings.FIREBASE_ACCESS_KEY)
cred = firebase_credentials.Certificate(firebase_access_key)
firebase_admin.initialize_app(credential=cred)
