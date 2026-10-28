import json
from datetime import timedelta
from uuid import uuid4

from groq import Groq

from ..config import settings
from ..schemas import TripRequest

ITEM_TYPES = {"attraction", "dining", "accommodation", "transport", "activity"}

SYSTEM_PROMPT = """You are a meticulous travel planner. Reply with ONE valid JSON object and nothing else.
Rules:
- Use real, well-known places, restaurants and neighbourhoods that exist in the destination.
- Costs are plain numbers in the traveller's currency, covering the WHOLE group, with no symbols.
- Order each day's items chronologically using 24-hour "HH:MM" times.
- Every day needs breakfast, lunch and dinner as type "dining" (unless the pace is relaxed and a meal is skipped on purpose).
- Add "transport" items when the traveller must move between areas or arrives/departs.
- Add one "accommodation" item per day except the last day (check-in on day 1, "Stay at ..." afterwards); its cost is that night's price for the whole group.
- Keep the total of all costs at or below the budget. Match the accommodation level and pace.
- Cluster nearby places on the same day to minimise travel time.
"""

DAY_SHAPE = """{"day": 1, "date": "YYYY-MM-DD", "theme": "short title for the day", "items": [
  {"time": "09:00", "type": "attraction|dining|accommodation|transport|activity",
   "title": "place or activity", "description": "1-2 helpful sentences",
   "location": "area or address", "cost": 0, "duration": "1h 30m"}]}"""

TRIP_SHAPE = (
    '{"summary": "2-3 sentence overview", "tips": ["3-5 short practical tips"], "days": [' + DAY_SHAPE + "]}"
)

_client: Groq | None = None


def _groq() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def _chat(system: str, user: str, max_tokens: int = 4000) -> dict:
    res = _groq().chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.7,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    return json.loads(res.choices[0].message.content)


def _dates(req: TripRequest) -> list[str]:
    return [(req.start_date + timedelta(days=i)).isoformat() for i in range(req.num_days)]


def _trip_brief(req: TripRequest) -> str:
    return (
        f"Destination: {req.destination}\n"
        f"Dates: {req.start_date} to {req.end_date} ({req.num_days} days): {', '.join(_dates(req))}\n"
        f"Total budget: {req.budget:g} {req.currency.upper()} for {req.travelers} traveller(s)\n"
        f"Travelling as: {req.travel_style}\n"
        f"Pace: {req.pace}\n"
        f"Accommodation level: {req.accommodation_level}\n"
        f"Interests: {', '.join(req.interests) or 'general sightseeing'}\n"
        f"Extra notes: {req.notes or 'none'}"
    )


def _num(value) -> float:
    try:
        return max(0.0, round(float(value), 2))
    except (TypeError, ValueError):
        return 0.0


def normalize(itinerary: dict, dates: list[str] | None = None) -> dict:
    """Clean AI/user output: stable ids, numeric costs and recomputed totals."""
    itinerary.setdefault("summary", "")
    itinerary.setdefault("tips", [])
    days = itinerary.get("days") or []
    for i, day in enumerate(days):
        day["day"] = i + 1
        if dates and i < len(dates):
            day["date"] = dates[i]
        day.setdefault("theme", "")
        items = day.get("items") or []
        for item in items:
            item["id"] = item.get("id") or uuid4().hex[:10]
            item["cost"] = _num(item.get("cost"))
            for key in ("time", "title", "description", "location", "duration"):
                item[key] = str(item.get(key) or "")
            if item.get("type") not in ITEM_TYPES:
                item["type"] = "activity"
        items.sort(key=lambda x: x["time"] or "99:99")
        day["items"] = items
        day["estimated_cost"] = round(sum(x["cost"] for x in items))
    itinerary["days"] = days
    itinerary["estimated_total_cost"] = sum(d["estimated_cost"] for d in days)
    return itinerary


def generate_itinerary(req: TripRequest, instruction: str = "") -> dict:
    user = (
        f"Plan this trip.\n{_trip_brief(req)}\n"
        + (f"Additional instruction: {instruction}\n" if instruction else "")
        + f"\nReturn JSON in exactly this shape, with {req.num_days} entries in 'days':\n{TRIP_SHAPE}"
    )
    data = _chat(SYSTEM_PROMPT, user)
    if not data.get("days"):
        raise ValueError("The AI returned an empty itinerary.")
    return normalize(data, _dates(req))


def regenerate_day(req: TripRequest, itinerary: dict, day_number: int, instruction: str = "") -> dict:
    days = itinerary.get("days", [])
    if day_number < 1 or day_number > len(days):
        raise ValueError("That day does not exist.")
    others = "; ".join(
        f"Day {d['day']}: " + ", ".join(i["title"] for i in d.get("items", []) if i.get("type") in ("attraction", "activity"))
        for d in days
        if d["day"] != day_number
    )
    per_day = req.budget / req.num_days
    user = (
        f"Rewrite ONLY day {day_number} of this trip with a fresh plan.\n{_trip_brief(req)}\n"
        f"Aim for roughly {per_day:.0f} {req.currency.upper()} for this day.\n"
        f"Do not repeat places already used on other days: {others or 'none'}\n"
        + (f"Traveller request for this day: {instruction}\n" if instruction else "")
        + f"\nReturn JSON in exactly this shape (a single day object):\n{DAY_SHAPE}"
    )
    day = _chat(SYSTEM_PROMPT, user, max_tokens=3000)
    if not day.get("items"):
        raise ValueError("The AI returned an empty day.")
    day["day"] = day_number
    day["date"] = days[day_number - 1].get("date", "")
    itinerary["days"][day_number - 1] = day
    return normalize(itinerary)
