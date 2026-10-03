import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const logo = '/assets/calmflex-logo.jpg';

export default function Layout() {
  const { count, notice } = useCart();
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const [authPromptDismissed, setAuthPromptDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showAuthPrompt = !loading && !user && !authPromptDismissed;

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!showAuthPrompt) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAuthPromptDismissed(true);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showAuthPrompt]);

  return (
    <>
      <div className="announcement">
        FREE SHIPPING ON ORDERS ABOVE <strong>₹499</strong>
      </div>
      <div className="header-bar">
        <header className="site-header">
          <button
            className="menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
          <NavLink className="brand" to="/" aria-label="CalmFlex home">
            <img src={logo} alt="CalmFlex" />
          </NavLink>
          <nav className={`desktop-nav${mobileMenuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            <ul className="desktop-nav-list">
              <li><NavLink to="/" end>Home</NavLink></li>
              <li><NavLink to="/products">Products</NavLink></li>
              <li><NavLink to="/why-calmflex">Why CalmFlex</NavLink></li>
              <li><NavLink to="/account">My orders</NavLink></li>
              {user?.role === 'admin' && <li><NavLink to="/admin">Order desk</NavLink></li>}
            </ul>
          </nav>
          <div className="header-actions">
            {user ? (
              <div className="account-chip">
                <Link className="account-name" to="/account">{user.name.split(' ')[0]}</Link>
                <button className="text-link" type="button" onClick={() => void logout()}>
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
          <NavLink to="/account">My orders</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin">Order desk</NavLink>}
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
      {showAuthPrompt && !loading && !user && (
        <div className="auth-prompt-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthPromptDismissed(true); }}>
          <section className="auth-prompt" role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title">
            <button className="auth-prompt-close" type="button" aria-label="Close account prompt" onClick={() => setAuthPromptDismissed(true)}>×</button>
            <p className="eyebrow">Welcome to CalmFlex</p>
            <h2 id="auth-prompt-title">A little ritual, made yours.</h2>
            <p>Sign in or create an account to place an order and follow your purchases.</p>
            <div className="auth-prompt-actions">
              <Link className="button button-dark" to="/signup" state={{ from: pathname }} onClick={() => setAuthPromptDismissed(true)}>Create account <span>↗</span></Link>
              <Link className="button button-outline" to="/login" state={{ from: pathname }} onClick={() => setAuthPromptDismissed(true)}>Log in</Link>
            </div>
            <button className="auth-prompt-browse" type="button" onClick={() => setAuthPromptDismissed(true)}>Continue browsing</button>
          </section>
        </div>
      )}
    </>
  );
}
