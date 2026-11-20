import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { api, saveSession } from "../api";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    const data = new FormData(event.currentTarget);
    const name = data.get("name")?.trim();
    const email = data.get("email")?.trim();
    const password = data.get("password");
    const confirmPassword = data.get("confirmPassword");
    setStatus("");
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      setError("Enter a valid email address (up to 255 characters).");
      return;
    }

    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError("Password must be at least 8 characters and no more than 72 UTF-8 bytes.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const session = await api("/auth/signup", { method: "POST", body: JSON.stringify({ full_name: name, email, password }) });
      saveSession(session);
      setStatus("Your account is ready.");
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="signup-page sf-auth-page">
      <section className="signup-container">
        <div className="signup-logo">⌂</div>

        <div className="signup-brand">SKILLFORGE</div>

        <div className="signup-header">
          <h1>Create your account</h1>
          <p>
            Start building stronger problem-solving skills
            <br />
            today.
          </p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-field">
            <label htmlFor="signup-name">Full Name</label>
            <div className="signup-input-wrapper">
              <span></span>
              <input
                type="text"
                id="signup-name"
                name="name"
                required
                minLength={2}
                maxLength={120}
                placeholder="Full name"
              />
            </div>
          </div>

          <div className="signup-field">
            <label htmlFor="signup-email">Email</label>
            <div className="signup-input-wrapper">
              <span></span>
              <input
                type="email"
                id="signup-email"
                name="email"
                required
                minLength={3}
                maxLength={255}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="signup-field">
            <label htmlFor="signup-password">Password</label>

            <div className="signup-input-wrapper">
              <span></span>

              <input
                type={showPassword ? "text" : "password"}
                id="signup-password"
                name="password"
                required
                minLength={8}
                maxLength={72}
                placeholder="Create a password"
              />

              <button
                type="button"
                className="signup-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                ◉
              </button>
            </div>
          </div>

          <div className="signup-field">
            <label htmlFor="signup-confirm-password">Confirm Password</label>

            <div className="signup-input-wrapper">
              <span>♢</span>

              <input
                type={showConfirmPassword ? "text" : "password"}
                id="signup-confirm-password"
                name="confirmPassword"
                required
                minLength={8}
                maxLength={72}
                placeholder="Repeat your password"
              />

              <button
                type="button"
                className="signup-eye"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                aria-pressed={showConfirmPassword}
              >
                ◉
              </button>
            </div>
          </div>

          {error && (
            <p className="signup-error" role="alert">
              {error}
            </p>
          )}
          {status && (
            <p className="signup-message" role="status">
              {status}
            </p>
          )}
          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?
            <Link to="/login"> Login →</Link>
          </p>

          <span>Your password is securely encrypted</span>
        </div>
      </section>

      <div className="signup-security">
        <span>SkillForge account</span>
        <span>Built for your learning journey</span>
      </div>
    </main>
  );
}

export default Signup;
