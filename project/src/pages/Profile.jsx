import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";
import { api, saveStoredUser } from "../api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([api("/users/me"), api("/progress/me"), api("/submissions/mine?limit=20")])
      .then(([profile, stats, submissions]) => {
        if (!active) return;
        setUser(profile);
        setProgress(stats);
        setHistory(submissions);
        saveStoredUser(profile);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    if (saving) return;
    setError(""); setMessage(""); setSaving(true);
    try {
      const form = new FormData(event.currentTarget);
      const updated = await api("/users/me", { method: "PATCH", body: JSON.stringify({ full_name: form.get("full_name") }) });
      setUser(updated);
      saveStoredUser(updated);
      setMessage("Profile updated.");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function changePassword(event) {
    event.preventDefault();
    if (changingPassword) return;
    setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    if (form.get("new_password") !== form.get("confirm_password")) { setError("New passwords must match."); return; }
    const newPassword = String(form.get("new_password"));
    if (newPassword.length < 8 || new TextEncoder().encode(newPassword).length > 72) {
      setError("New password must be at least 8 characters and no more than 72 UTF-8 bytes.");
      return;
    }
    setChangingPassword(true);
    try {
      await api("/users/me/password", { method: "PATCH", body: JSON.stringify({ current_password: form.get("current_password"), new_password: newPassword }) });
      event.currentTarget.reset();
      setMessage("Password updated.");
    } catch (err) { setError(err.message); }
    finally { setChangingPassword(false); }
  }
  return <div className="dashboard-page sf-page"><UserNavbar /><main className="dashboard-main sf-content">
    <header className="dashboard-welcome"><div><p className="dashboard-eyebrow">ACCOUNT SETTINGS</p><h1>My profile</h1><p>Manage your account and review your practice activity.</p></div></header>
    {error && <p className="problems-status problems-error" role="alert">{error}</p>}{message && <p className="problems-status" role="status">{message}</p>}
    {loading && <p className="problems-status" role="status">Loading your profile…</p>}
    {!loading && user && <section className="profile-grid">
      <article className="dashboard-insight"><p className="dashboard-eyebrow">YOUR DETAILS</p><h2>Profile</h2><form key={user?.id || "loading"} onSubmit={saveProfile} className="profile-form"><label>Full name<input name="full_name" defaultValue={user?.full_name || ""} required minLength="2" maxLength="120" /></label><label>Email<input value={user?.email || ""} readOnly /></label><button className="problem-submit" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button></form></article>
      <article className="dashboard-insight"><p className="dashboard-eyebrow">SECURITY</p><h2>Change password</h2><form onSubmit={changePassword} className="profile-form"><label>Current password<input name="current_password" type="password" required autoComplete="current-password" /></label><label>New password<input name="new_password" type="password" minLength={user?.is_admin ? 6 : 8} maxLength="72" required autoComplete="new-password" /></label><label>Confirm new password<input name="confirm_password" type="password" minLength={user?.is_admin ? 6 : 8} maxLength="72" required autoComplete="new-password" /></label><button className="problem-submit" type="submit" disabled={changingPassword}>{changingPassword ? "Updating…" : "Update password"}</button></form></article>
    </section>}
    {!loading && user && <section className="dashboard-section"><div className="dashboard-section-heading"><div><p className="dashboard-eyebrow">LEARNING SUMMARY</p><h2>Progress</h2></div></div><p>{progress ? `${progress.summary.total_solved} solved · ${progress.summary.total_attempted} attempts · ${progress.summary.accuracy_percentage ?? 'Not assessed'}${progress.summary.accuracy_percentage === null ? '' : '%'} accuracy · Rating ${progress.summary.overall_rating}` : "Progress could not be loaded."}</p><Link to="/progress">View detailed progress ↗</Link></section>}
    {!loading && user && <section className="dashboard-section"><div className="dashboard-section-heading"><div><p className="dashboard-eyebrow">YOUR ACTIVITY</p><h2>Submission history</h2></div></div>{history.length ? <div className="profile-history">{history.map((row) => <article key={row.id}><Link to={`/problem/${row.question_id}`}>{row.title}</Link><span>{row.is_correct ? "Correct" : "Incorrect"}</span><small>{new Date(row.submitted_at).toLocaleString()}</small></article>)}</div> : <p>No submissions yet.</p>}</section>}
  </main></div>;
}
