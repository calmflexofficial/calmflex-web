import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const logo = '/assets/calmflex-logo.jpg';

export default function AuthPage() {
  const { user, loading, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || '/';
  const resumeCheckout = Boolean((location.state as { resumeCheckout?: boolean } | null)?.resumeCheckout);
  const isLogin = !location.pathname.includes('signup');

  if (loading) return <main className="page-shell auth-loading"><p className="eyebrow">CalmFlex account</p><h1>Checking your account…</h1></main>;
  if (user) return <Navigate to={from} replace state={resumeCheckout ? { resumeCheckout: true } : undefined} />;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const confirm = String(data.get('confirm') || '');

    try {
      if (!email || !password) throw new Error('Please fill in your email and password.');
      if (password.length < 10) throw new Error('Use at least 10 characters for your password.');
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name) throw new Error('Please add your name.');
        if (password !== confirm) throw new Error('Passwords do not match.');
        await signup(name, email, password);
      }
      navigate(from, { replace: true, state: resumeCheckout ? { resumeCheckout: true } : undefined });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
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
          <Link className={isLogin ? 'active' : ''} to="/login" state={location.state}>
            Log in
          </Link>
          <Link className={!isLogin ? 'active' : ''} to="/signup" state={location.state}>
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
              minLength={10}
              placeholder="At least 10 characters"
              required
            />
          </label>
          {!isLogin && (
            <label>
              Confirm password
              <input name="confirm" type="password" minLength={10} autoComplete="new-password" placeholder="Repeat password" required />
            </label>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-dark" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'} <span>↗</span>
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? (
            <>
              New to CalmFlex? <Link to="/signup" state={location.state}>Create an account</Link>
            </>
          ) : (
            <>
              Already with us? <Link to="/login" state={location.state}>Log in</Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
