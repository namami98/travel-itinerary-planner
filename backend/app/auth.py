import httpx
from fastapi import Header, HTTPException

from .config import settings


async def current_user(authorization: str | None = Header(default=None)) -> dict:
    """Validate the Supabase access token sent by the frontend."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    token = authorization.split(" ", 1)[1]
    key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_KEY
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}", "apikey": key},
            )
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Could not reach the auth service.")
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Your session expired. Please sign in again.")
    return res.json()
