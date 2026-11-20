import { useCallback, useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import UserNavbar from "../components/UserNavbar";
import { api, getAuthSnapshot, subscribeAuth } from "../api";

export default function Contest() {
  const token = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const [contests, setContests] = useState([]);
  const [registered, setRegistered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const list = await api("/contests"); setContests(list);
      if (token) setRegistered(await api("/contests/mine"));
      else setRegistered([]);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { Promise.resolve().then(load); }, [load]);
  async function register(id) {
    setMessage(""); setError("");
    try { await api(`/contests/${id}/register`, { method: "POST", body: JSON.stringify({}) }); setMessage("You are registered for this contest."); await load(); }
    catch (err) { setError(err.message); }
  }
  const registeredIds = new Set(registered.map((item) => item.id));
  return <div className="contest-page sf-page"><UserNavbar /><main className="contest-main sf-content">
    <header className="contest-heading"><p className="contest-eyebrow">COMPETE, LEARN, GROW</p><h1>Challenges</h1><p>Explore scheduled contests and join upcoming events.</p></header>
    {error && <p className="problems-status problems-error" role="alert">{error}</p>}{message && <p className="problems-status" role="status">{message}</p>}
    {loading ? <p className="problems-status" role="status">Loading contests…</p> : contests.length === 0 ? <section className="contest-feature"><div className="contest-feature-content"><div><h2>No contests available yet.</h2><p>Contest details will appear here when they are published.</p></div></div></section> : <div className="contest-list">{contests.map((contest) => {
      const started = new Date(contest.start_time) <= new Date();
      const ended = new Date(contest.end_time) <= new Date();
      return <article className="contest-feature" key={contest.id}><div className="contest-feature-top"><span>{new Date(contest.start_time).toLocaleString()}</span><span className="contest-status">{ended ? "ENDED" : started ? "LIVE" : "UPCOMING"}</span></div><div className="contest-feature-content"><div><h2>{contest.title}</h2><p>{contest.description || "No additional contest details provided."}</p><small>{contest.registration_count} registered · Ends {new Date(contest.end_time).toLocaleString()}</small></div><div className="contest-register"><span>REGISTRATION</span><strong>{registeredIds.has(contest.id) ? "Registered" : ended || started ? "Closed" : "Open"}</strong><button type="button" onClick={() => register(contest.id)} disabled={!token || started || ended || registeredIds.has(contest.id)}>{registeredIds.has(contest.id) ? "Registered" : !token ? "Sign in to register" : started || ended ? "Registration closed" : "Register"}</button></div></div></article>;
    })}</div>}
    {registered.length > 0 && <section className="dashboard-section"><p className="contest-eyebrow">YOUR CONTESTS</p><h2>Registered contests</h2><ul>{registered.map((item) => <li key={item.id}>{item.title} · {new Date(item.start_time).toLocaleString()}</li>)}</ul></section>}
  </main></div>;
}
