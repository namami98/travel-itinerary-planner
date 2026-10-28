from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import trips

app = FastAPI(title="Personalized Travel Itinerary Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trips.router)
app.include_router(trips.shared_router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "groq_configured": bool(settings.GROQ_API_KEY),
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY),
        "unsplash_configured": bool(settings.UNSPLASH_ACCESS_KEY),
    }
