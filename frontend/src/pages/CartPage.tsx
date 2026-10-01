import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { money } from '../data/products';
import { paymentConfig } from '../config/payment';
import { apiUrl } from '../config/api';
import { startRazorpayCheckout } from '../services/razorpay';

export default function CartPage() {
  const { items, changeQuantity, remove, clear } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderReference, setOrderReference] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 499 ? 0 : 60;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const customer = Object.fromEntries(formData.entries());
    const phone = String(customer.phone || '').replace(/\D/g, '');
    const pin = String(customer.pin || '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPaymentMessage('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setPaymentMessage('Enter a valid 6-digit PIN code.');
      return;
    }
    setSubmitting(true);
    if (formData.get('payment') === 'cod') {
      try {
        const response = await fetch(apiUrl('/api/orders'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer,
            items: items.map(({ slug, quantity }) => ({ slug, quantity })),
            paymentMethod: 'cod'
          })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to place your order. Please try again.');
        setOrderReference(result.orderId);
        clear();
        setPlaced(true);
      } catch (error) {
        setPaymentMessage(error instanceof Error ? error.message : 'Unable to place your order.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    try {
      await startRazorpayCheckout({
        customer,
        cart: items.map(({ slug, quantity }) => ({ slug, quantity })),
        onSuccess: (_paymentResponse, order) => {
          setOrderReference(order.orderId);
          clear();
          setPlaced(true);
          setSubmitting(false);
        },
        onError: (message) => {
          setPaymentMessage(message);
          setSubmitting(false);
        },
        onClose: () => setSubmitting(false)
      });
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Payment could not start.');
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <main className="page-shell cart-page">
        <p className="eyebrow">Order received</p>
        <h1>Thank you.</h1>
        <p className="hero-text">Your CalmFlex order has been placed. We will share tracking details shortly.</p>
        {orderReference && <p className="shipping-note">Order reference: {orderReference}</p>}
        <Link className="button button-dark" to="/products">
          Continue shopping <span>→</span>
        </Link>
      </main>
    );
  }

  return (
    <main className="page-shell cart-page">
      <section id="cart-view" className={checkout ? 'hidden' : ''}>
        <p className="eyebrow">Your CalmFlex edit</p>
        <h1>Your cart.</h1>
        <div className="cart-layout">
          <div className="cart-list">
            {items.length ? (
              items.map((item) => (
                <article className="cart-row" key={item.slug}>
                  <div className="cart-row-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div>
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                  </div>
                  <div className="cart-quantity">
                    <button type="button" aria-label="Decrease quantity" onClick={() => changeQuantity(item.slug, -1)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" aria-label="Increase quantity" disabled={item.quantity >= 10} onClick={() => changeQuantity(item.slug, 1)}>
                      +
                    </button>
                  </div>
                  <strong>{money(item.price * item.quantity)}</strong>
                  <button className="row-remove" type="button" onClick={() => remove(item.slug)}>
                    Remove
                  </button>
                </article>
              ))
            ) : (
              <p className="empty-state">Your cart is empty. There is always room for one good ritual.</p>
            )}
          </div>
          <aside className="cart-summary">
            <h2>Order summary</h2>
            <div className="summary-line">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div className="summary-line">
              <span>Shipping</span>
              <strong>{shipping ? money(shipping) : 'Free'}</strong>
            </div>
            <p className="shipping-note">
              {subtotal >= 499 ? 'You unlocked free delivery.' : `Add ${money(Math.max(499 - subtotal, 0))} more for free delivery.`}
            </p>
            <div className="summary-line summary-total">
              <span>Total</span>
              <strong>{money(subtotal + shipping)}</strong>
            </div>
            <button
              className="button button-dark checkout-button"
              type="button"
              disabled={!items.length}
              onClick={() => setCheckout(true)}
            >
              Checkout <span>↗</span>
            </button>
          </aside>
        </div>
      </section>

      {checkout && (
        <section className="checkout-panel visible">
          <p className="eyebrow">Secure checkout</p>
          <h2>Almost yours.</h2>
          <form className="checkout-form" onSubmit={onSubmit}>
            <label>
              Full name
              <input required name="name" placeholder="Your name" />
            </label>
            <label>
              Mobile number
              <input required name="phone" inputMode="tel" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit number" />
            </label>
            <label className="full-field">
              Email address
              <input required type="email" name="email" placeholder="you@example.com" />
            </label>
            <label className="full-field">
              Address
              <input required name="address" placeholder="House number and street" />
            </label>
            <label>
              City
              <input required name="city" placeholder="City" />
            </label>
            <label>
              PIN code
              <input required name="pin" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="6-digit PIN" />
            </label>
            <div className="payment-box full-field">
              <p>Payment method</p>
              <div className="payment-options">
                <label title={paymentConfig.publicKey ? undefined : 'Online payments are not configured yet'}>
                  <input type="radio" name="payment" value="upi" disabled={!paymentConfig.publicKey} defaultChecked={Boolean(paymentConfig.publicKey)} /> UPI
                </label>
                <label title={paymentConfig.publicKey ? undefined : 'Online payments are not configured yet'}>
                  <input type="radio" name="payment" value="card" disabled={!paymentConfig.publicKey} /> Card
                </label>
                <label>
                  <input type="radio" name="payment" value="cod" defaultChecked={!paymentConfig.publicKey} /> Cash on delivery
                </label>
              </div>
              {paymentMessage && <p className="shipping-note" role="alert">{paymentMessage}</p>}
            </div>
            <button className="button button-dark full-field" type="submit" disabled={submitting}>
              {submitting ? 'Processing…' : 'Place order'} <span>↗</span>
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
