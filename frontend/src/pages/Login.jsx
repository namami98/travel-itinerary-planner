import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabaseConfigured } from "../lib/supabase";

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error } = await (mode === "signin" ? signIn(email, password) : signUp(email, password));
    setBusy(false);
    if (error) return setError(error.message);
    if (mode === "signup" && !data.session)
      setNotice("Account created. Check your email to confirm it, then sign in.");
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <h1>Plan the trip,<br />skip the research.</h1>
        <p>Tell Wayfarer where you're going, what you like and what you can spend. Get a day-by-day plan in seconds, then tweak it until it's yours.</p>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <h2>{mode === "signin" ? "Sign in" : "Create your account"}</h2>
        {!supabaseConfigured && (
          <p className="alert">Supabase isn't configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.</p>
        )}
        <label>Email
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>Password
          <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
        </label>
        {error && <p className="alert" role="alert">{error}</p>}
        {notice && <p className="alert ok">{notice}</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button type="button" className="link" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
