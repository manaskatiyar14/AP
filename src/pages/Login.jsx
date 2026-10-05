import { Link } from 'react-router-dom'

function Login() {
  return (
    <main className="login-page">
      <section className="login-container">

        <div className="login-logo">✦</div>

        <div className="login-brand">
          SKILLFORGE
        </div>

        <div className="login-header">
          <h1>Welcome back</h1>
          <p>Continue your problem-solving journey.</p>
        </div>

        <form className="login-form">

          <div className="login-field">
            <label>Email</label>

            <div className="login-input-wrapper">
              <span>✉</span>
              <input
                type="email"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>

            <div className="login-input-wrapper">
              <span>♙</span>
              <input
                type="password"
                placeholder="Enter your password"
              />
              <span>◉</span>
            </div>
          </div>

          <div className="login-options">
            <label className="login-remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <a href="#" className="login-forgot">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="login-button"
          >
            Login →
          </button>

        </form>

        <div className="login-divider">
          <span></span>
          <p>OR SIGN IN WITH</p>
          <span></span>
        </div>

        <div className="login-social">
          <button type="button">
            ◉ &nbsp; GitHub
          </button>

          <button type="button">
            ◇ &nbsp; Campus ID
          </button>
        </div>

        <p className="login-signup">
          Don't have an account?
          <Link to="/signup"> Sign Up</Link>
        </p>

      </section>

      <div className="login-status">
        <span>♢ 256-bit Secure</span>
        <span>● System active</span>
      </div>
    </main>
  )
}

export default Login