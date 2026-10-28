import httpx

from ..config import settings


def search_photo(query: str) -> dict | None:
    """Return a landscape Unsplash photo (with attribution) or None."""
    if not settings.UNSPLASH_ACCESS_KEY:
        return None
    try:
        res = httpx.get(
            "https://api.unsplash.com/search/photos",
            params={"query": query, "per_page": 1, "orientation": "landscape"},
            headers={"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"},
            timeout=10,
        )
        res.raise_for_status()
        results = res.json().get("results", [])
        if not results:
            return None
        photo = results[0]
        return {
            "url": photo["urls"]["regular"],
            "thumb": photo["urls"]["small"],
            "credit": photo["user"]["name"],
            "credit_link": photo["links"]["html"] + "?utm_source=travel_planner&utm_medium=referral",
        }
    except (httpx.HTTPError, KeyError, ValueError):
        return None
