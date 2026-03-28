"""
═══ Nanoneuron CRM MVP ═══
nanoneuron.ai

Core loop: Search → Discover → Unlock → Track → Close
Combined: Claude + Gemini + ChatGPT best ideas
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.database import engine, Base
from app.auth import auth
from app.search import search
from app.deals import deals, ai, dashboard, payment
from app.ai_router import claude
from app.routers_discovery import discovery

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("🚀 Nanoneuron CRM MVP — Live")
    print("📍 Core: Search → Discover → Unlock → Track → Close")
    yield
    await engine.dispose()

app = FastAPI(title="Nanoneuron CRM", version="1.0.0", lifespan=lifespan, docs_url="/docs",
    description="Find leads. Track deals. Stay compliant. — nanoneuron.ai")

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth, prefix="/api")
app.include_router(search, prefix="/api")
app.include_router(deals, prefix="/api")
app.include_router(ai, prefix="/api")
app.include_router(dashboard, prefix="/api")
app.include_router(payment, prefix="/api")
app.include_router(claude, prefix="/api")
app.include_router(discovery, prefix="/api")

@app.get("/api/health")
async def health():
    return {"status": "healthy", "app": "Nanoneuron CRM MVP", "version": "1.0.0", "core": "Search → Discover → Unlock → Track → Close"}

@app.get("/")
async def root():
    return {"message": "Nanoneuron CRM — Find leads. Track deals. Stay compliant.", "website": "nanoneuron.ai", "docs": "/docs"}
