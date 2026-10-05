import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        SkillForge
      </Link>

      <div className="navbar-actions">
        <Link to="/login" className="navbar-login">
          Login
        </Link>

        <Link to="/signup" className="navbar-signup">
          Sign Up
        </Link>
      </div>
    </nav>
  )
}

export default Navbar