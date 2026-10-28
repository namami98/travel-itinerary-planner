import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, loading, signOut } = useAuth();
  if (loading) return <div className="center-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Wayfarer</div>
        <nav>
          <NavLink to="/" end>My trips</NavLink>
          <NavLink to="/new">Plan a trip</NavLink>
        </nav>
        <div className="sidebar-foot">
          <span className="who" title={user.email}>{user.email}</span>
          <button className="btn ghost" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
