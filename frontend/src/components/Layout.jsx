import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearToken } from "../auth";

export default function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    onLogout();
    navigate("/");
  };

  return (
    <div className="app">
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="mark">
            Aether
          </Link>
          <nav>
            <NavLink to="/shop">Catalog</NavLink>
            <NavLink to="/cart">Cart</NavLink>
            {user ? (
              <button type="button" className="text-button" onClick={logout}>
                {user.firstName}
              </button>
            ) : (
              <NavLink to="/login">Sign in</NavLink>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
