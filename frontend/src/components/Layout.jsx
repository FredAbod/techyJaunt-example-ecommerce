import { lazy, Suspense, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../store";
import LiquidMark from "./LiquidMark";
import SmoothScroll from "./SmoothScroll";

const Backdrop = lazy(() => import("./Backdrop"));

function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((item) => (
        <p key={item.id} className={`toast glass ${item.tone}`}>
          {item.message}
        </p>
      ))}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout, cartCount } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const signOut = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="app">
      <Suspense fallback={null}>
        <Backdrop />
      </Suspense>
      <SmoothScroll />

      <header className="nav">
        <div className="nav-inner glass">
          <Link to="/" className="brand" aria-label="Aether home">
            <LiquidMark size={34} />
            <span>Aether</span>
          </Link>

          <nav className={menuOpen ? "nav-links open" : "nav-links"}>
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/shop">Catalog</NavLink>
            {user ? <NavLink to="/wallet">Wallet</NavLink> : null}
            {user ? (
              <button type="button" className="link" onClick={signOut}>
                Sign out
              </button>
            ) : (
              <NavLink to="/login">Sign in</NavLink>
            )}
          </nav>

          <div className="nav-actions">
            {user ? (
              <span className="avatar" title={`${user.firstName} ${user.lastName}`}>
                {user.profilePicture?.url ? (
                  <img src={user.profilePicture.url} alt="" />
                ) : (
                  user.firstName.slice(0, 1)
                )}
              </span>
            ) : null}
            <Link to="/cart" className="cart-pill" aria-label={`Cart, ${cartCount} items`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 4h2.2l2.1 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.5 8H6.1" />
                <circle cx="10" cy="20" r="1.3" />
                <circle cx="17" cy="20" r="1.3" />
              </svg>
              <span>{cartCount}</span>
            </Link>
            <button
              type="button"
              className="menu-toggle"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer wrap">
        <div className="footer-brand">
          <LiquidMark size={56} />
          <p>
            Aether
            <span>Personal technology, edited down.</span>
          </p>
        </div>
        <nav>
          <Link to="/shop">Catalog</Link>
          <Link to="/cart">Cart</Link>
          {user ? <Link to="/wallet">Wallet</Link> : null}
          <Link to={user ? "/" : "/signup"}>{user ? `Hi, ${user.firstName}` : "Create account"}</Link>
        </nav>
        <p className="mono muted">© {new Date().getFullYear()} Aether</p>
      </footer>

      <Toasts />
    </div>
  );
}
