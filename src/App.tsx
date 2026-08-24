import { useState } from 'react';
import { products } from './data/products';
import type { Product } from './types/product';

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  return <article className="product-card">
    <div className="product-image">
      <img className="real-product-image" src={product.image} alt={product.name} />
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <button className="heart" aria-label={`Add ${product.name} to wishlist`}>♡</button>
    </div>
    <div className="product-info"><div><h3>{product.name}</h3><p>{product.description}</p></div><strong>{money(product.price)}</strong></div>
    <button className="add-button" onClick={() => onAdd(product)}>Add to cart <span>+</span></button>
  </article>;
}

export default function App() {
  const [cartCount, setCartCount] = useState(() => JSON.parse(localStorage.getItem('calmflex-cart') || '[]').reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0));
  const [notice, setNotice] = useState('');
  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('calmflex-cart') || '[]');
    const existing = cart.find((item: { name: string }) => item.name === product.name);
    existing ? existing.quantity += 1 : cart.push({ ...product, quantity: 1 });
    localStorage.setItem('calmflex-cart', JSON.stringify(cart));
    setCartCount(cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0));
    setNotice(`${product.name} added to cart`);
    window.setTimeout(() => setNotice(''), 1800);
  };
  return <>
    <div className="announcement">FREE SHIPPING ON ORDERS ABOVE <strong>₹499</strong></div>
    <header className="site-header"><a className="brand" href="index.html">Calm<span>Flex</span></a><nav className="desktop-nav"><a href="shop.html">Shop</a><a href="#categories">Categories</a><a href="#story">Our story</a><a href="#journal">Journal</a></nav><div className="header-actions"><a className="icon-button" href="shop.html" aria-label="Search">⌕</a><a className="icon-button" href="cart.html" aria-label="Cart">♧<span className="cart-count">{cartCount}</span></a></div></header>
    <main>
      <section className="hero"><div className="hero-copy"><p className="eyebrow">THE CALMFLEX EDIT</p><h1>Your everyday rituals, made better.</h1><p className="hero-text">Thoughtfully designed tools for softer mornings, slower evenings and everything in between.</p><div className="hero-actions"><a className="button button-dark" href="shop.html">Shop essentials <span>↗</span></a><a className="text-link" href="#categories">Explore categories <span>→</span></a></div></div><div className="hero-art" aria-label="CalmFlex self-care ritual" role="img"><div className="sun"/><div className="hero-arch"/><div className="hero-bottle bottle-one"/><div className="hero-bottle bottle-two"/><div className="hero-stone"/><span className="hero-label">slow<br />down</span></div></section>
      <section className="trust-bar"><div><span className="trust-icon">✦</span>Premium quality</div><div><span className="trust-icon">◌</span>Everyday wellness</div><div><span className="trust-icon">⌁</span>Pan-India delivery</div><div><span className="trust-icon">♡</span>Here to help</div></section>
      <section className="section" id="categories"><div className="section-heading"><div><p className="eyebrow">SHOP BY MOOD</p><h2>Find your feel-good.</h2></div><a className="text-link" href="shop.html">View all <span>→</span></a></div><div className="category-grid"><a className="category-card category-sage" href="shop.html"><span>01</span><h3>Reset<br />& relax</h3><b>Explore wellness ↗</b></a><a className="category-card category-rose" href="shop.html"><span>02</span><h3>Glow<br />from within</h3><b>Explore beauty ↗</b></a><a className="category-card category-gold" href="shop.html"><span>03</span><h3>Move<br />with ease</h3><b>Explore fitness ↗</b></a><a className="category-card category-blue" href="shop.html"><span>04</span><h3>Care,<br />considered</h3><b>Explore grooming ↗</b></a></div></section>
      <section className="section product-section" id="shop"><div className="section-heading"><div><p className="eyebrow">A LITTLE SOMETHING FOR YOU</p><h2>Customer favourites.</h2></div><a className="text-link" href="shop.html">Shop all <span>→</span></a></div><div className="product-grid">{products.map((product) => <ProductCard key={product.name} product={product} onAdd={addToCart} />)}</div></section>
      <section className="story" id="story"><div className="story-art"><div className="story-circle"/><span>ritual<br />over rush</span></div><div className="story-copy"><p className="eyebrow">THE CALMFLEX PROMISE</p><h2>Self-care should feel simple.</h2><p>Wellness does not need to be complicated. We bring together practical, thoughtfully selected products that fit naturally into your everyday routine.</p><a className="button button-outline" href="#story">Read our story <span>↗</span></a></div></section>
      <section className="newsletter" id="journal"><div><p className="eyebrow">A NOTE FROM US</p><h2>Make self-care<br /><em>a habit.</em></h2></div><div className="newsletter-form"><p>New rituals, useful tips and first access to good things.</p><form onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); }}><label className="sr-only" htmlFor="email">Email address</label><input id="email" type="email" placeholder="Your email address" required /><button className="button button-dark" type="submit">Join us <span>↗</span></button></form><small>By subscribing, you agree to receive CalmFlex updates.</small></div></section>
    </main>
    <footer><a className="brand" href="index.html">Calm<span>Flex</span></a><p>Relax. Revive. Renew.</p><div className="footer-links"><a href="shop.html">Shop</a><a href="#story">About</a><a href="#journal">Contact</a><a href="#journal">Instagram</a></div><small>© 2026 CalmFlex. Made for everyday rituals.</small></footer>
    {notice && <div className="toast" role="status">{notice}</div>}
  </>;
}
