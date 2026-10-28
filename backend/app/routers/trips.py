import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response

from ..auth import current_user
from ..db import get_db
from ..schemas import RegenerateDay, RegenerateTrip, TripRequest, TripUpdate
from ..services import ai, images

router = APIRouter(prefix="/api/trips", tags=["trips"])
shared_router = APIRouter(prefix="/api/shared", tags=["shared"])

TABLE = "trips"
REQUEST_FIELDS = [
    "destination", "start_date", "end_date", "budget", "currency", "travelers",
    "travel_style", "pace", "accommodation_level", "interests", "notes",
]


def _owned(trip_id: str, user_id: str) -> dict:
    res = get_db().table(TABLE).select("*").eq("id", trip_id).eq("user_id", user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Trip not found.")
    return res.data[0]


def _request_from_row(row: dict) -> TripRequest:
    return TripRequest(**{k: row[k] for k in REQUEST_FIELDS})


def _save(trip_id: str, user_id: str, patch: dict) -> dict:
    patch["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = get_db().table(TABLE).update(patch).eq("id", trip_id).eq("user_id", user_id).execute()
    return res.data[0]


def _ai_call(fn, *args):
    try:
        return fn(*args)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception:
        raise HTTPException(status_code=502, detail="The AI service could not build this plan. Please try again.")


@router.get("")
def list_trips(user: dict = Depends(current_user)):
    res = get_db().table(TABLE).select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute()
    return res.data


@router.post("/generate", status_code=201)
def generate_trip(req: TripRequest, user: dict = Depends(current_user)):
    itinerary = _ai_call(ai.generate_itinerary, req)
    cover = images.search_photo(f"{req.destination} landmark travel")
    row = {
        "user_id": user["id"],
        "title": f"{req.num_days} days in {req.destination.strip().title()}",
        "destination": req.destination.strip(),
        "start_date": req.start_date.isoformat(),
        "end_date": req.end_date.isoformat(),
        "budget": req.budget,
        "currency": req.currency.upper(),
        "travelers": req.travelers,
        "travel_style": req.travel_style,
        "pace": req.pace,
        "accommodation_level": req.accommodation_level,
        "interests": req.interests,
        "notes": req.notes,
        "itinerary": itinerary,
        "cover": cover,
    }
    res = get_db().table(TABLE).insert(row).execute()
    return res.data[0]


@router.get("/{trip_id}")
def get_trip(trip_id: str, user: dict = Depends(current_user)):
    return _owned(trip_id, user["id"])


@router.put("/{trip_id}")
def update_trip(trip_id: str, body: TripUpdate, user: dict = Depends(current_user)):
    row = _owned(trip_id, user["id"])
    patch = body.model_dump(exclude_none=True)
    if "itinerary" in patch:
        patch["itinerary"] = ai.normalize(patch["itinerary"])
    return _save(row["id"], user["id"], patch) if patch else row


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: str, user: dict = Depends(current_user)):
    _owned(trip_id, user["id"])
    get_db().table(TABLE).delete().eq("id", trip_id).eq("user_id", user["id"]).execute()
    return Response(status_code=204)


@router.post("/{trip_id}/regenerate")
def regenerate_trip(trip_id: str, body: RegenerateTrip, user: dict = Depends(current_user)):
    row = _owned(trip_id, user["id"])
    itinerary = _ai_call(ai.generate_itinerary, _request_from_row(row), body.instruction)
    return _save(row["id"], user["id"], {"itinerary": itinerary})


@router.post("/{trip_id}/regenerate-day")
def regenerate_day(trip_id: str, body: RegenerateDay, user: dict = Depends(current_user)):
    row = _owned(trip_id, user["id"])
    itinerary = _ai_call(
        ai.regenerate_day, _request_from_row(row), row["itinerary"], body.day_number, body.instruction
    )
    return _save(row["id"], user["id"], {"itinerary": itinerary})


@router.post("/{trip_id}/share")
def toggle_share(trip_id: str, user: dict = Depends(current_user)):
    row = _owned(trip_id, user["id"])
    token = None if row.get("share_token") else secrets.token_urlsafe(9)
    return _save(row["id"], user["id"], {"share_token": token})


@shared_router.get("/{token}")
def get_shared(token: str):
    res = get_db().table(TABLE).select("*").eq("share_token", token).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="This shared trip is no longer available.")
    trip = res.data[0]
    for private in ("user_id", "share_token"):
        trip.pop(private, None)
    return trip
