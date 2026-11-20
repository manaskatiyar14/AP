import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, getToken, saveSession } from "../api";

export default function PracticeRoute({ children, requireAuth = false }) {
  const location = useLocation();
  const [ready, setReady] = useState(() => !import.meta.env.DEV || Boolean(getToken()));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!import.meta.env.DEV || getToken()) return;

    let active = true;
    api("/auth/demo", { method: "POST" })
      .then((session) => {
        if (!active) return;
        saveSession(session);
        setReady(true);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Practice is unavailable right now.");
      });
    return () => { active = false; };
  }, []);

  if (import.meta.env.PROD && requireAuth && !getToken()) {
    return <Navigate to="/login" replace state={{ from: location, authRequired: true }} />;
  }
  if (!ready) return <main className="problems-main"><p className="problems-status" role="status">Opening practice…</p></main>;
  if (error) return <main className="problems-main"><p className="problems-status problems-error" role="alert">{error}</p></main>;
  return children;
}
