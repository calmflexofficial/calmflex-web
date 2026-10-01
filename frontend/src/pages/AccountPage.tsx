import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import { money } from '../data/products';
import { useAuth } from '../context/AuthContext';

interface CustomerOrder {
  id: string;
  status: string;
  paymentMethod: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
  createdAt: string;
}

export default function AccountPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error, setError] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(apiUrl('/api/orders'), { credentials: 'include' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load your orders.');
        setOrders(result.orders);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Could not load your orders.'))
      .finally(() => setLoadingOrders(false));
  }, [user]);

  if (loading) return <main className="page-shell account-page"><p className="eyebrow">Your CalmFlex account</p><h1>Loading account…</h1></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: '/account' }} />;

  return (
    <main className="page-shell account-page">
      <p className="eyebrow">Your CalmFlex account</p>
      <h1>Hello, {user.name.split(' ')[0]}.</h1>
      <p className="account-email">{user.email}</p>
      <section className="account-orders">
        <div className="account-section-heading"><h2>Your orders</h2><Link to="/products">Continue shopping <span>→</span></Link></div>
        {loadingOrders && <p className="empty-state">Loading order history…</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {!loadingOrders && !error && orders.length === 0 && <p className="empty-state">Your orders will appear here after checkout.</p>}
        {orders.map((order) => (
          <article className="account-order" key={order.id}>
            <div><strong>Order {order.id.slice(0, 8).toUpperCase()}</strong><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</time></div>
            <p>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p>
            <div><span className="order-status">{order.status.replace('_', ' ')}</span><strong>{money(order.total)}</strong></div>
          </article>
        ))}
      </section>
    </main>
  );
}