import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { categoryLabels, getProduct, money } from '../data/products';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const product = slug ? getProduct(slug) : undefined;
  const navigate = useNavigate();
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [pin, setPin] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');

  if (!product) return <Navigate to="/products" replace />;

  const checkDelivery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeliveryMessage(/^\d{6}$/.test(pin)
      ? `PIN ${pin} is formatted correctly. Delivery availability will be confirmed at checkout.`
      : 'Enter a valid 6-digit PIN code.');
  };

  const addToCart = () => add(product, quantity);

  const buyNow = () => {
    add(product, quantity);
    navigate('/cart');
  };

  return (
    <main className="page-shell product-detail">
      <p className="breadcrumbs">
        <Link to="/">Home</Link> / <Link to="/products">Products</Link> / {product.name}
      </p>
      <div className="product-layout">
        <div className="detail-visual">
          <img src={product.image} alt={product.name} />
        </div>
        <section className="detail-copy">
          <p className="eyebrow">{categoryLabels[product.category]}</p>
          {product.badge && <span className="detail-badge">{product.badge}</span>}
          <h1>{product.name}</h1>
          <p className="detail-intro">{product.description}</p>
          <div className="price-row">
            <strong className="price">{money(product.price)}</strong>
            <span className="detail-unit-note">Price per item</span>
          </div>
          <div className="detail-quantity" aria-label="Choose quantity">
            <span>Quantity</span>
            <div className="quantity-stepper">
              <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <output aria-live="polite">{quantity}</output>
              <button type="button" aria-label="Increase quantity" disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))}>+</button>
            </div>
            <strong>{money(product.price * quantity)}</strong>
          </div>
          <div className="buy-row">
            <button className="button button-dark buy-button" type="button" onClick={addToCart}>
              Add to cart <span>+</span>
            </button>
            <button className="button button-outline" type="button" onClick={buyNow}>Buy now <span>↗</span></button>
          </div>
          <form className="delivery-check" onSubmit={checkDelivery}>
            <label htmlFor="delivery-pin">Check delivery details</label>
            <div className="delivery-check-row">
              <input id="delivery-pin" inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="[0-9]{6}" placeholder="Enter 6-digit PIN" value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 6)); setDeliveryMessage(''); }} required />
              <button type="submit">Check</button>
            </div>
            {deliveryMessage && <p className="delivery-feedback" role="status">{deliveryMessage}</p>}
          </form>
          <p className="detail-service-note">Free delivery on orders above ₹499. Secure checkout available.</p>
        </section>
      </div>
    </main>
  );
}
