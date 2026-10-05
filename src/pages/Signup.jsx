import { useState } from 'react'
import { Link } from 'react-router-dom'

function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <main className="signup-page">
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

        <form className="signup-form">

          <div className="signup-field">
            <label>Full Name</label>
            <div className="signup-input-wrapper">
              <span></span>
              <input
                type="text"
                placeholder="Nagendra Kumar"
              />
            </div>
          </div>

          <div className="signup-field">
            <label>Email</label>
            <div className="signup-input-wrapper">
              <span></span>
              <input
                type="email"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="signup-field">
            <label>Password</label>

            <div className="signup-input-wrapper">
              <span></span>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
              />

              <button
                type="button"
                className="signup-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                ◉
              </button>
            </div>

            <div className="signup-strength">
              <span></span>
              <span></span>
              <span></span>
              <small>Strength</small>
            </div>
          </div>

          <div className="signup-field">
            <label>Confirm Password</label>

            <div className="signup-input-wrapper">
              <span>♢</span>

              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
              />

              <button
                type="button"
                className="signup-eye"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                ◉
              </button>
            </div>
          </div>

          <button type="submit" className="signup-button">
            Create Account →
          </button>

        </form>

        <div className="signup-footer">
          <p>
            Already have an account?
            <Link to="/login"> Login →</Link>
          </p>

          <span>Safe & ad-free learning sanctuary</span>
        </div>

      </section>

      <div className="signup-security">
        <span>♙ 256-bit Secure</span>
        <span>⚙ Aptitude Certified</span>
      </div>
    </main>
  )
}

export default Signup