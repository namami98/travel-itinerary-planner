import { supabase } from "./supabase";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const j = await res.json();
      if (typeof j.detail === "string") message = j.detail;
      else if (Array.isArray(j.detail)) message = j.detail.map((d) => d.msg).join(". ");
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  listTrips: () => request("/trips"),
  getTrip: (id) => request(`/trips/${id}`),
  generate: (payload) => request("/trips/generate", { method: "POST", body: payload }),
  update: (id, payload) => request(`/trips/${id}`, { method: "PUT", body: payload }),
  remove: (id) => request(`/trips/${id}`, { method: "DELETE" }),
  regenerate: (id, instruction = "") =>
    request(`/trips/${id}/regenerate`, { method: "POST", body: { instruction } }),
  regenerateDay: (id, day_number, instruction = "") =>
    request(`/trips/${id}/regenerate-day`, { method: "POST", body: { day_number, instruction } }),
  toggleShare: (id) => request(`/trips/${id}/share`, { method: "POST" }),
  getShared: (token) => request(`/shared/${token}`, { auth: false }),
};
