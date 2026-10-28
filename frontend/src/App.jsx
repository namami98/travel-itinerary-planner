import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NewTrip from "./pages/NewTrip";
import SharedTrip from "./pages/SharedTrip";
import TripView from "./pages/TripView";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/s/:token" element={<SharedTrip />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewTrip />} />
        <Route path="/trips/:id" element={<TripView />} />
      </Route>
      <Route path="*" element={<Login />} />
    </Routes>
  );
}
