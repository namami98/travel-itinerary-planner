from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

MAX_DAYS = 14


class TripRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    start_date: date
    end_date: date
    budget: float = Field(gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    travelers: int = Field(default=1, ge=1, le=50)
    travel_style: Literal["solo", "couple", "friends", "family"] = "solo"
    pace: Literal["relaxed", "balanced", "packed"] = "balanced"
    accommodation_level: Literal["budget", "mid-range", "premium"] = "mid-range"
    interests: list[str] = Field(default_factory=list, max_length=12)
    notes: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after the start date.")
        if (self.end_date - self.start_date).days + 1 > MAX_DAYS:
            raise ValueError(f"Trips can be at most {MAX_DAYS} days long.")
        return self

    @property
    def num_days(self) -> int:
        return (self.end_date - self.start_date).days + 1


class TripUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=160)
    itinerary: Optional[dict] = None


class RegenerateDay(BaseModel):
    day_number: int = Field(ge=1)
    instruction: str = Field(default="", max_length=400)


class RegenerateTrip(BaseModel):
    instruction: str = Field(default="", max_length=400)
