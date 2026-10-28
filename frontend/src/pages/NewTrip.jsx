import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const INTERESTS = ["Food", "Sightseeing", "History", "Nature", "Adventure", "Nightlife", "Shopping", "Art & culture", "Beaches", "Wellness", "Photography", "Local markets"];
const STYLES = [
  ["solo", "Solo"],
  ["couple", "Couple"],
  ["friends", "Friends"],
  ["family", "Family"],
];
const today = new Date().toISOString().slice(0, 10);

export default function NewTrip() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    destination: "",
    start_date: today,
    end_date: today,
    budget: 30000,
    currency: "INR",
    travelers: 1,
    travel_style: "solo",
    pace: "balanced",
    accommodation_level: "mid-range",
    interests: ["Food", "Sightseeing"],
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleInterest = (i) =>
    set("interests", form.interests.includes(i) ? form.interests.filter((x) => x !== i) : [...form.interests, i]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const trip = await api.generate({
        ...form,
        budget: Number(form.budget),
        travelers: Number(form.travelers),
      });
      nav(`/trips/${trip.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="narrow">
      <header className="page-head">
        <div>
          <h1>Plan a trip</h1>
          <p className="muted">The more you tell us, the better the plan fits you.</p>
        </div>
      </header>

      <form className="panel form-grid" onSubmit={submit}>
        <label className="span-2">Destination
          <input className="input" required minLength={2} value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Goa, India" />
        </label>
        <label>Start date
          <input className="input" type="date" required min={today} value={form.start_date} onChange={(e) => { set("start_date", e.target.value); if (e.target.value > form.end_date) set("end_date", e.target.value); }} />
        </label>
        <label>End date
          <input className="input" type="date" required min={form.start_date} value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
        </label>
        <label>Total budget
          <input className="input" type="number" required min="1" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
        </label>
        <label>Currency
          <select className="input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
            {["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "AUD"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <fieldset className="span-2">
          <legend>Who's going</legend>
          <div className="seg">
            {STYLES.map(([v, l]) => (
              <button type="button" key={v} className={form.travel_style === v ? "on" : ""} onClick={() => set("travel_style", v)}>{l}</button>
            ))}
          </div>
        </fieldset>
        <label>Number of travellers
          <input className="input" type="number" min="1" max="50" value={form.travelers} onChange={(e) => set("travelers", e.target.value)} />
        </label>
        <label>Pace
          <select className="input" value={form.pace} onChange={(e) => set("pace", e.target.value)}>
            <option value="relaxed">Relaxed, few stops a day</option>
            <option value="balanced">Balanced</option>
            <option value="packed">Packed, see everything</option>
          </select>
        </label>
        <label className="span-2">Where you'd like to stay
          <select className="input" value={form.accommodation_level} onChange={(e) => set("accommodation_level", e.target.value)}>
            <option value="budget">Budget</option>
            <option value="mid-range">Mid-range</option>
            <option value="premium">Premium</option>
          </select>
        </label>

        <fieldset className="span-2">
          <legend>Interests</legend>
          <div className="chips">
            {INTERESTS.map((i) => (
              <button type="button" key={i} className={form.interests.includes(i) ? "pill on" : "pill"} aria-pressed={form.interests.includes(i)} onClick={() => toggleInterest(i)}>{i}</button>
            ))}
          </div>
        </fieldset>

        <label className="span-2">Anything else we should know?
          <textarea className="input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Vegetarian, travelling with a toddler, want a sunrise spot…" />
        </label>

        {error && <p className="alert span-2" role="alert">{error}</p>}
        <div className="span-2">
          <button className="btn primary big" disabled={busy}>
            {busy ? "Building your itinerary… this takes 10–20 seconds" : "Generate itinerary"}
          </button>
        </div>
      </form>
    </div>
  );
}
