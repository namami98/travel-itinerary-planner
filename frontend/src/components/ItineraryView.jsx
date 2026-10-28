import { money, shortDate } from "../lib/format";

export const TYPE_LABELS = {
  attraction: "Sight",
  dining: "Food",
  accommodation: "Stay",
  transport: "Transit",
  activity: "Activity",
};

export default function ItineraryView({
  itinerary,
  currency,
  day,
  setDay,
  editing = false,
  onChange,
  dayActions = null,
}) {
  const days = itinerary?.days || [];
  const current = days[day];
  if (!current) return <p className="empty">This trip has no itinerary yet.</p>;

  const mutate = (fn) => {
    const next = structuredClone(itinerary);
    fn(next.days[day]);
    onChange(next);
  };
  const setItem = (i, patch) => mutate((d) => Object.assign(d.items[i], patch));
  const removeItem = (i) => mutate((d) => d.items.splice(i, 1));
  const addItem = () =>
    mutate((d) =>
      d.items.push({
        id: crypto.randomUUID().slice(0, 10),
        time: "12:00",
        type: "activity",
        title: "New stop",
        description: "",
        location: "",
        cost: 0,
        duration: "",
      })
    );

  const dayTotal = current.items.reduce((s, x) => s + (Number(x.cost) || 0), 0);

  return (
    <div>
      <div className="day-tabs" role="tablist">
        {days.map((d, i) => (
          <button
            key={d.day}
            role="tab"
            aria-selected={i === day}
            className={i === day ? "tab active" : "tab"}
            onClick={() => setDay(i)}
          >
            <strong>Day {d.day}</strong>
            <span>{shortDate(d.date)}</span>
          </button>
        ))}
      </div>

      <div className="day-head">
        <div>
          {editing ? (
            <input
              className="input title-input"
              value={current.theme}
              onChange={(e) => mutate((d) => (d.theme = e.target.value))}
              aria-label="Day theme"
            />
          ) : (
            <h2>{current.theme || `Day ${current.day}`}</h2>
          )}
          <p className="muted">Estimated spend {money(dayTotal, currency)}</p>
        </div>
        {dayActions}
      </div>

      <ol className="timeline">
        {current.items.map((item, i) => (
          <li key={item.id} className={`stop type-${item.type}`}>
            <div className="stop-time">
              {editing ? (
                <input
                  className="input time-input"
                  type="time"
                  value={item.time}
                  onChange={(e) => setItem(i, { time: e.target.value })}
                  aria-label="Time"
                />
              ) : (
                item.time
              )}
            </div>
            <div className="stop-card">
              {editing ? (
                <div className="edit-grid">
                  <input className="input" value={item.title} onChange={(e) => setItem(i, { title: e.target.value })} placeholder="Title" aria-label="Title" />
                  <select className="input" value={item.type} onChange={(e) => setItem(i, { type: e.target.value })} aria-label="Type">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input className="input wide" value={item.location} onChange={(e) => setItem(i, { location: e.target.value })} placeholder="Location" aria-label="Location" />
                  <textarea className="input wide" rows={2} value={item.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Notes" aria-label="Notes" />
                  <input className="input" type="number" min="0" value={item.cost} onChange={(e) => setItem(i, { cost: Number(e.target.value) || 0 })} aria-label="Cost" />
                  <input className="input" value={item.duration} onChange={(e) => setItem(i, { duration: e.target.value })} placeholder="Duration" aria-label="Duration" />
                  <button className="btn danger small" onClick={() => removeItem(i)}>Remove stop</button>
                </div>
              ) : (
                <>
                  <div className="stop-top">
                    <span className="chip">{TYPE_LABELS[item.type]}</span>
                    <span className="cost">{item.cost ? money(item.cost, currency) : "Free"}</span>
                  </div>
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                  <p className="muted small-text">
                    {[item.location, item.duration].filter(Boolean).join(" · ")}
                  </p>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
      {editing && (
        <button className="btn ghost" onClick={addItem}>Add a stop</button>
      )}
    </div>
  );
}
