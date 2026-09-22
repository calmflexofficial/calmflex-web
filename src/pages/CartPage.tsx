import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { money } from '../data/products';
import { startRazorpayCheckout } from '../services/razorpay';

export default function CartPage() {
  const { items, changeQuantity, remove, clear } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 499 ? 0 : 60;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const customer = Object.fromEntries(formData.entries());
    if (formData.get('payment') === 'cod') {
      clear();
      setPlaced(true);
      return;
    }
    try {
      await startRazorpayCheckout({
        customer,
        cart: items,
        total: subtotal * 100,
        onSuccess: () => {
          clear();
          setPlaced(true);
        }
      });
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Payment could not start.');
    }
  };

  if (placed) {
    return (
      <main className="page-shell cart-page">
        <p className="eyebrow">Order received</p>
        <h1>Thank you.</h1>
        <p className="hero-text">Your CalmFlex order has been placed. We will share tracking details shortly.</p>
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
                    <button type="button" aria-label="Increase quantity" onClick={() => changeQuantity(item.slug, 1)}>
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
              <input required name="phone" inputMode="tel" placeholder="10-digit number" />
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
              <input required name="pin" inputMode="numeric" maxLength={6} placeholder="6-digit PIN" />
            </label>
            <div className="payment-box full-field">
              <p>Payment method</p>
              <div className="payment-options">
                <label>
                  <input type="radio" name="payment" value="upi" defaultChecked /> UPI
                </label>
                <label>
                  <input type="radio" name="payment" value="card" /> Card
                </label>
                <label>
                  <input type="radio" name="payment" value="cod" /> Cash on delivery
                </label>
              </div>
              {paymentMessage && <p className="shipping-note">{paymentMessage}</p>}
            </div>
            <button className="button button-dark full-field" type="submit">
              Place order <span>↗</span>
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
