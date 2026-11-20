import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        SkillForge
      </Link>

      <div className="navbar-actions" aria-label="Main navigation">
        <Link to="/problems" className="navbar-signup">Practice</Link>
      </div>
    </nav>
  );
}

export default Navbar;
