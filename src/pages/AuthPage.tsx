import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const logo = '/assets/calmflex-logo.jpg';

export default function AuthPage() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const from = (location.state as { from?: string } | null)?.from || '/';
  const isLogin = !location.pathname.includes('signup');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const confirm = String(data.get('confirm') || '');

    try {
      if (!email || !password) throw new Error('Please fill in your email and password.');
      if (password.length < 6) throw new Error('Use at least 6 characters for your password.');
      if (isLogin) {
        login(email, password);
      } else {
        if (!name) throw new Error('Please add your name.');
        if (password !== confirm) throw new Error('Passwords do not match.');
        signup(name, email, password);
      }
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.');
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel auth-brand">
        <img src={logo} alt="CalmFlex" />
        <p className="eyebrow">Relax · Revive · Renew</p>
        <h1>{isLogin ? 'Welcome back.' : 'Begin your ritual.'}</h1>
        <p>
          {isLogin
            ? 'Log in to keep your cart, orders and CalmFlex favourites in one quiet place.'
            : 'Create an account to shop the collection and pick up your self-care where you left off.'}
        </p>
      </section>
      <section className="auth-panel auth-card">
        <div className="auth-tabs" role="tablist">
          <Link className={isLogin ? 'active' : ''} to="/login">
            Log in
          </Link>
          <Link className={!isLogin ? 'active' : ''} to="/signup">
            Sign up
          </Link>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          {!isLogin && (
            <label>
              Full name
              <input name="name" autoComplete="name" placeholder="Your name" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="At least 6 characters"
              required
            />
          </label>
          {!isLogin && (
            <label>
              Confirm password
              <input name="confirm" type="password" autoComplete="new-password" placeholder="Repeat password" />
            </label>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-dark" type="submit">
            {isLogin ? 'Log in' : 'Create account'} <span>↗</span>
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? (
            <>
              New to CalmFlex? <Link to="/signup">Create an account</Link>
            </>
          ) : (
            <>
              Already with us? <Link to="/login">Log in</Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
