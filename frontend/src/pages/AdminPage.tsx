import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import { money } from '../data/products';
import { useAuth } from '../context/AuthContext';

type FulfillmentStatus = 'new' | 'accepted' | 'packing' | 'dispatched' | 'delivered' | 'rejected' | 'cancelled';

interface AdminOrder {
  id: string;
  paymentStatus: string;
  fulfillmentStatus: FulfillmentStatus;
  paymentMethod: string;
  customer: { name: string; phone: string; email: string; address: string; city: string; pin: string };
  account: { name: string; email: string } | null;
  items: Array<{ name: string; quantity: number; lineTotalPaise: number }>;
  subtotal: number;
  shipping: number;
  total: number;
  trackingCarrier: string;
  trackingNumber: string;
  adminNote: string;
  createdAt: string;
}

const transitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  new: ['accepted', 'rejected'],
  accepted: ['packing', 'cancelled'],
  packing: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: []
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingOrder, setSavingOrder] = useState('');
  const [dirtyOrders, setDirtyOrders] = useState<Set<string>>(() => new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    let active = true;
    const loadOrders = async () => {
      try {
        const response = await fetch(apiUrl('/api/admin/orders'), { credentials: 'include' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load orders.');
        if (active) {
          setOrders(result.orders);
          setLoadError('');
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Could not load orders.');
      } finally {
        if (active) setLoadingOrders(false);
      }
    };
    void loadOrders();
    const timer = window.setInterval(loadOrders, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user, refreshKey]);

  if (loading) return <main className="page-shell"><p className="empty-state">Checking admin access…</p></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  if (user.role !== 'admin') return <Navigate to="/account" replace />;

  const editOrder = (orderId: string, changes: Partial<AdminOrder>) => {
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...changes } : order));
    setDirtyOrders((current) => new Set(current).add(orderId));
  };

  const saveOrder = async (order: AdminOrder) => {
    setSavingOrder(order.id);
    setLoadError('');
    try {
      const response = await fetch(apiUrl(`/api/admin/orders/${order.id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentStatus: order.fulfillmentStatus,
          trackingCarrier: order.trackingCarrier,
          trackingNumber: order.trackingNumber,
          adminNote: order.adminNote
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update this order.');
      setDirtyOrders((current) => {
        const next = new Set(current);
        next.delete(order.id);
        return next;
      });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not update this order.');
    } finally {
      setSavingOrder('');
    }
  };

  const openCount = orders.filter((order) => ['new', 'accepted', 'packing'].includes(order.fulfillmentStatus)).length;

  return (
    <main className="page-shell admin-page">
      <header className="admin-header">
        <div><p className="eyebrow">CalmFlex operations</p><h1>Order desk</h1></div>
        <div className="admin-header-actions"><span className="admin-open-count">{openCount} open</span><button className="button button-outline admin-refresh" type="button" onClick={() => setRefreshKey((current) => current + 1)}>Refresh</button></div>
      </header>
      <p className="admin-refresh-note">Orders refresh automatically every 30 seconds.</p>
      {loadError && <p className="auth-error" role="alert">{loadError}</p>}
      {loadingOrders && <p className="empty-state">Loading orders…</p>}
      {!loadingOrders && !loadError && orders.length === 0 && <p className="empty-state">No orders yet. New customer orders will appear here.</p>}
      <section className="admin-order-list" aria-label="Orders">
        {orders.map((order) => {
          const nextStatuses = transitions[order.fulfillmentStatus];
          const canAccept = order.paymentMethod === 'cod' || order.paymentStatus === 'paid';
          return (
            <article className="admin-order-card" key={order.id}>
              <header className="admin-order-heading">
                <div><p className="eyebrow">Order {order.id.slice(0, 8).toUpperCase()}</p><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString('en-IN')}</time></div>
                <div className="admin-order-badges"><span className={`order-status status-${order.fulfillmentStatus}`}>{order.fulfillmentStatus.replace('_', ' ')}</span><span className="payment-status">{order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentStatus === 'paid' ? 'Paid online' : 'Payment pending'}</span></div>
              </header>
              <div className="admin-order-content">
                <section className="admin-order-customer"><h2>{order.customer.name}</h2><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><p>{order.customer.address}<br />{order.customer.city}, {order.customer.pin}</p>{order.account && <small>Account: {order.account.email}</small>}</section>
                <section className="admin-order-items" aria-label="Items and totals">
                  {order.items.map((item) => <div className="admin-order-item" key={item.name}><span>{item.quantity} × {item.name}</span><strong>{money(item.lineTotalPaise / 100)}</strong></div>)}
                  <div className="admin-order-item"><span>Shipping</span><strong>{order.shipping ? money(order.shipping) : 'Free'}</strong></div>
                  <div className="admin-order-total"><span>Total</span><strong>{money(order.total)}</strong></div>
                </section>
                <section className="admin-order-actions" aria-label="Update fulfillment">
                  <label>Status<select value={order.fulfillmentStatus} disabled={!nextStatuses.length} onChange={(event) => editOrder(order.id, { fulfillmentStatus: event.target.value as FulfillmentStatus })}>
                    <option value={order.fulfillmentStatus}>{order.fulfillmentStatus.replace('_', ' ')}</option>
                    {nextStatuses.map((status) => <option key={status} value={status} disabled={status === 'accepted' && !canAccept}>{status.replace('_', ' ')}</option>)}
                  </select></label>
                  {order.fulfillmentStatus === 'packing' || order.fulfillmentStatus === 'dispatched' ? <div className="admin-tracking-fields"><label>Courier<input maxLength={80} value={order.trackingCarrier} onChange={(event) => editOrder(order.id, { trackingCarrier: event.target.value })} placeholder="Courier name" /></label><label>Tracking number<input maxLength={120} value={order.trackingNumber} onChange={(event) => editOrder(order.id, { trackingNumber: event.target.value })} placeholder="Tracking ID" /></label></div> : null}
                  <label>Internal note<textarea maxLength={500} value={order.adminNote} onChange={(event) => editOrder(order.id, { adminNote: event.target.value })} placeholder="Optional note" rows={2} /></label>
                  <button className="button button-dark admin-save" type="button" disabled={savingOrder === order.id || !dirtyOrders.has(order.id)} onClick={() => void saveOrder(order)}>{savingOrder === order.id ? 'Saving…' : 'Save order update'}</button>
                </section>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
