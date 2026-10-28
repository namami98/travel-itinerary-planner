import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ItineraryView from "../components/ItineraryView";
import { api } from "../lib/api";
import { dateRange, money } from "../lib/format";

export default function TripView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [trip, setTrip] = useState(null);
  const [day, setDay] = useState(0);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getTrip(id).then(setTrip).catch((e) => setError(e.message));
  }, [id]);

  if (error && !trip) return <p className="alert">{error}</p>;
  if (!trip) return <p className="muted">Loading trip…</p>;

  const editing = Boolean(draft);
  const it = editing ? draft : trip.itinerary;
  const total = it?.days?.reduce((s, d) => s + d.items.reduce((a, x) => a + (Number(x.cost) || 0), 0), 0) || 0;
  const pct = Math.min(100, Math.round((total / trip.budget) * 100));
  const over = total > trip.budget;

  const run = async (label, fn) => {
    setBusy(label);
    setError("");
    try {
      setTrip(await fn());
    } catch (e) {
      setError(e.message);
    }
    setBusy("");
  };

  const save = () =>
    run("save", async () => {
      const t = await api.update(trip.id, { itinerary: draft });
      setDraft(null);
      return t;
    });

  const regenerateTrip = () => {
    if (!confirm("Replace the whole itinerary with a new one? Your manual edits will be lost.")) return;
    run("trip", () => api.regenerate(trip.id, instruction)).then(() => setDay(0));
  };

  const regenerateDay = () => {
    if (!confirm(`Replace Day ${day + 1} with a new plan?`)) return;
    run("day", () => api.regenerateDay(trip.id, day + 1, instruction));
  };

  const share = () =>
    run("share", async () => {
      const t = await api.toggleShare(trip.id);
      return { ...trip, share_token: t.share_token };
    });

  const shareUrl = trip.share_token ? `${window.location.origin}/s/${trip.share_token}` : "";
  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const remove = async () => {
    if (!confirm("Delete this trip? This can't be undone.")) return;
    await api.remove(trip.id);
    nav("/");
  };

  return (
    <div>
      <Link to="/" className="back">Back to my trips</Link>

      <section className="hero" style={trip.cover?.url ? { backgroundImage: `linear-gradient(180deg, rgba(10,25,45,.15), rgba(10,25,45,.78)), url(${trip.cover.url})` } : undefined}>
        <h1>{trip.title}</h1>
        <p>{dateRange(trip.start_date, trip.end_date)} · {trip.travelers} {trip.travelers > 1 ? "travellers" : "traveller"} · {trip.pace} pace</p>
        {trip.cover?.credit && (
          <a className="credit" href={trip.cover.credit_link} target="_blank" rel="noreferrer">Photo by {trip.cover.credit} on Unsplash</a>
        )}
      </section>

      <section className="panel budget">
        <div className="budget-line">
          <div>
            <span className="muted">Estimated cost</span>
            <strong className={over ? "over" : ""}>{money(total, trip.currency)}</strong>
          </div>
          <div>
            <span className="muted">Budget</span>
            <strong>{money(trip.budget, trip.currency)}</strong>
          </div>
          <div>
            <span className="muted">{over ? "Over by" : "Left"}</span>
            <strong className={over ? "over" : ""}>{money(Math.abs(trip.budget - total), trip.currency)}</strong>
          </div>
        </div>
        <div className="bar" role="img" aria-label={`${pct}% of budget used`}><div className={over ? "fill over" : "fill"} style={{ width: `${pct}%` }} /></div>
        {it?.summary && <p className="summary">{it.summary}</p>}
      </section>

      <div className="toolbar">
        {editing ? (
          <>
            <button className="btn primary" onClick={save} disabled={!!busy}>{busy === "save" ? "Saving…" : "Save changes"}</button>
            <button className="btn ghost" onClick={() => setDraft(null)} disabled={!!busy}>Discard</button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => setDraft(structuredClone(trip.itinerary))} disabled={!!busy}>Edit itinerary</button>
            <button className="btn" onClick={regenerateTrip} disabled={!!busy}>{busy === "trip" ? "Regenerating…" : "Regenerate trip"}</button>
            <button className="btn" onClick={share} disabled={!!busy}>{trip.share_token ? "Stop sharing" : "Share link"}</button>
            <button className="btn ghost danger-text" onClick={remove}>Delete</button>
          </>
        )}
      </div>

      {!editing && (
        <label className="instruction">Guide the next regeneration (optional)
          <input className="input" value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="More street food, fewer museums" />
        </label>
      )}

      {shareUrl && !editing && (
        <p className="share-box">
          <input className="input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} aria-label="Share link" />
          <button className="btn small" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
        </p>
      )}

      {error && <p className="alert" role="alert">{error}</p>}

      <ItineraryView
        itinerary={it}
        currency={trip.currency}
        day={Math.min(day, (it?.days?.length || 1) - 1)}
        setDay={setDay}
        editing={editing}
        onChange={setDraft}
        dayActions={
          !editing && (
            <button className="btn small" onClick={regenerateDay} disabled={!!busy}>
              {busy === "day" ? "Regenerating…" : "Regenerate this day"}
            </button>
          )
        }
      />

      {it?.tips?.length > 0 && (
        <section className="panel tips">
          <h2>Good to know</h2>
          <ul>{it.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
