import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const logo = '/assets/calmflex-logo.jpg';

export default function Layout() {
  const { count, notice } = useCart();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <div className="announcement">
        FREE SHIPPING ON ORDERS ABOVE <strong>₹499</strong>
      </div>
      <div className="header-bar">
        <header className="site-header">
          <NavLink className="brand" to="/" aria-label="CalmFlex home">
            <img src={logo} alt="CalmFlex" />
          </NavLink>
          <nav className="desktop-nav">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/why-calmflex">Why CalmFlex</NavLink>
          </nav>
          <div className="header-actions">
            {user ? (
              <div className="account-chip">
                <span className="account-name">{user.name.split(' ')[0]}</span>
                <button className="text-link" type="button" onClick={logout}>
                  Log out
                </button>
              </div>
            ) : (
              <Link className="text-link account-link" to="/login">
                Log in
              </Link>
            )}
            <Link className="icon-button" to="/products" aria-label="Search products">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </Link>
            <NavLink className="icon-button" to="/cart" aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 7h15l-1.4 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.7L6 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M6 7 5 4H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="10" cy="20" r="1.3" fill="currentColor" />
                <circle cx="17" cy="20" r="1.3" fill="currentColor" />
              </svg>
              <span className="cart-count">{count}</span>
            </NavLink>
          </div>
        </header>
      </div>
      <Outlet />
      <footer>
        <NavLink className="brand" to="/" aria-label="CalmFlex home">
          <img src={logo} alt="CalmFlex" />
        </NavLink>
        <p className="tagline">Relax · Revive · Renew</p>
        <div className="footer-links">
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/why-calmflex">Why CalmFlex</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/login">Account</NavLink>
        </div>
        <small>© 2026 CalmFlex. Made for everyday rituals.</small>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
