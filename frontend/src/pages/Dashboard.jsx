import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { dateRange, money } from "../lib/format";

export default function Dashboard() {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listTrips().then(setTrips).catch((e) => setError(e.message));
  }, []);

  const remove = async (trip) => {
    if (!confirm(`Delete "${trip.title}"? This can't be undone.`)) return;
    try {
      await api.remove(trip.id);
      setTrips((t) => t.filter((x) => x.id !== trip.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const upcoming = (trips || []).filter((t) => new Date(`${t.end_date}T23:59:59`) >= new Date());
  const totalBudget = (trips || []).reduce((s, t) => s + Number(t.budget), 0);

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>My trips</h1>
          <p className="muted">Everything you've planned, in one place.</p>
        </div>
        <Link className="btn primary" to="/new">Plan a trip</Link>
      </header>

      {error && <p className="alert" role="alert">{error}</p>}

      {trips && trips.length > 0 && (
        <div className="stats">
          <div><strong>{trips.length}</strong><span>trips saved</span></div>
          <div><strong>{upcoming.length}</strong><span>upcoming</span></div>
          <div><strong>{money(totalBudget, trips[0].currency)}</strong><span>planned budget</span></div>
        </div>
      )}

      {!trips && !error && <p className="muted">Loading your trips…</p>}

      {trips && trips.length === 0 && (
        <div className="empty-state">
          <h2>No trips yet</h2>
          <p>Answer a few questions and get your first itinerary in under a minute.</p>
          <Link className="btn primary" to="/new">Plan your first trip</Link>
        </div>
      )}

      <div className="trip-grid">
        {(trips || []).map((t) => (
          <article key={t.id} className="trip-card">
            <Link to={`/trips/${t.id}`} className="trip-cover" style={t.cover?.url ? { backgroundImage: `url(${t.cover.thumb || t.cover.url})` } : undefined} aria-label={`Open ${t.title}`} />
            <div className="trip-body">
              <h3><Link to={`/trips/${t.id}`}>{t.title}</Link></h3>
              <p className="muted">{dateRange(t.start_date, t.end_date)} · {t.travelers} {t.travelers > 1 ? "travellers" : "traveller"}</p>
              <p>Budget {money(t.budget, t.currency)} · Plan {money(t.itinerary?.estimated_total_cost, t.currency)}</p>
              <button className="btn ghost small" onClick={() => remove(t)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
