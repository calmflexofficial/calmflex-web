import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { featuredProducts } from '../data/products';

const logo = '/assets/calmflex-logo.jpg';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Relax · Revive · Renew</p>
          <h1>
            Soften the day.
            <br />
            <em>Stretch into calm.</em>
          </h1>
          <p className="hero-text">
            Five everyday essentials to start with — then explore the full CalmFlex collection when
            you are ready.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" to="/products">
              Explore products <span>↗</span>
            </Link>
            <Link className="text-link" to="/why-calmflex">
              Why CalmFlex <span>→</span>
            </Link>
          </div>
        </div>
        <div className="hero-art" aria-label="CalmFlex lotus logo">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="swoosh" />
          <span className="sparkle" aria-hidden="true">✦</span>
          <img className="hero-logo" src={logo} alt="CalmFlex lotus mark" />
        </div>
      </section>

      <section className="trust-bar">
        <div><span className="trust-icon">✦</span>Premium quality</div>
        <div><span className="trust-icon">◌</span>Everyday wellness</div>
        <div><span className="trust-icon">⌁</span>Pan-India delivery</div>
        <div><span className="trust-icon">♡</span>Here to help</div>
      </section>

      <section className="section product-section" id="hero-products">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start here</p>
            <h2>Hero essentials.</h2>
          </div>
          <Link className="text-link" to="/products">
            Explore all products <span>→</span>
          </Link>
        </div>
        <div className="product-grid hero-five">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
        <div className="explore-row">
          <Link className="button button-dark" to="/products">
            Explore the full collection <span>↗</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
