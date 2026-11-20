import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSyncExternalStore } from "react";
import { clearSession, getAuthSnapshot, getStoredUser, subscribeAuth } from "../api";

function UserNavbar() {
  const navigate = useNavigate();
  const token = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const user = getStoredUser();
  function logout() { clearSession(); navigate("/login", { replace: true }); }
  return (
    <nav className="user-navbar">
      <Link to={token ? "/dashboard" : "/"} className="user-navbar-brand">
        <span>✦</span> SkillForge
      </Link>
      <div className="user-navbar-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/assessments">Assessments</NavLink>
        <NavLink to="/problems">Problems</NavLink>
        <NavLink to="/progress">Progress</NavLink>
        <NavLink to="/contest">Contest</NavLink>
        {token && user?.is_admin && <NavLink to="/admin">Admin</NavLink>}
      </div>
      {token ? (
        <div className="user-navbar-rating">
          <Link to="/profile">{user?.full_name || "My profile"}</Link>
          <button type="button" onClick={logout}>Log out</button>
        </div>
      ) : (
        <div className="user-navbar-rating">
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign up</Link>
        </div>
      )}
    </nav>
  );
}

export default UserNavbar;
