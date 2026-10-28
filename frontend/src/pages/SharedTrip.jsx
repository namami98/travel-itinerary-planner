import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ItineraryView from "../components/ItineraryView";
import { api } from "../lib/api";
import { dateRange, money } from "../lib/format";

export default function SharedTrip() {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const [day, setDay] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getShared(token).then(setTrip).catch((e) => setError(e.message));
  }, [token]);

  return (
    <div className="shared">
      <header className="shared-bar"><Link to="/" className="brand">Wayfarer</Link><span className="muted">Shared itinerary, view only</span></header>
      <div className="narrow">
        {error && <p className="alert">{error}</p>}
        {!trip && !error && <p className="muted">Loading…</p>}
        {trip && (
          <>
            <section className="hero" style={trip.cover?.url ? { backgroundImage: `linear-gradient(180deg, rgba(10,25,45,.15), rgba(10,25,45,.78)), url(${trip.cover.url})` } : undefined}>
              <h1>{trip.title}</h1>
              <p>{dateRange(trip.start_date, trip.end_date)} · Estimated {money(trip.itinerary?.estimated_total_cost, trip.currency)}</p>
            </section>
            {trip.itinerary?.summary && <p className="summary">{trip.itinerary.summary}</p>}
            <ItineraryView itinerary={trip.itinerary} currency={trip.currency} day={day} setDay={setDay} />
          </>
        )}
      </div>
    </div>
  );
}
