import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, saveSession } from "../api";

function Login() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    if (loading) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const session = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password: form.get("password") }) });
      saveSession(session);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page sf-auth-page">
      <section className="login-container">
        <div className="login-logo">✦</div>

        <div className="login-brand">SKILLFORGE</div>

        <div className="login-header">
          <h1>Welcome back</h1>
          <p>Continue your problem-solving journey.</p>
        </div>

        {location.state?.authRequired && (
          <p className="login-message" role="status">
            Please sign in to continue.
          </p>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="login-field">
            <label htmlFor="login-email">Email</label>

            <div className="login-input-wrapper">
              <span>✉</span>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                minLength={3}
                maxLength={255}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>

            <div className="login-input-wrapper">
              <span>♙</span>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="login-options">
            <span className="login-unavailable">
              Password reset unavailable
            </span>
          </div>

          {message && (
            <p className="login-message" role="alert">
              {message}
            </p>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in…" : "Login →"}
          </button>
        </form>

        <p className="login-signup">
          Don't have an account?
          <Link to="/signup"> Sign Up</Link>
        </p>
      </section>

      <div className="login-status">
        <span>Secure sign-in</span>
        <span>Your account stays private</span>
      </div>
    </main>
  );
}

export default Login;
