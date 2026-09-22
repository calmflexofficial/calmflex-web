import { Link, Navigate, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProduct, money } from '../data/products';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const product = slug ? getProduct(slug) : undefined;
  const { add } = useCart();

  if (!product) return <Navigate to="/products" replace />;

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
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="detail-intro">{product.description}</p>
          <div className="price-row">
            <strong className="price">{money(product.price)}</strong>
          </div>
          <div className="buy-row">
            <button className="button button-dark buy-button" type="button" onClick={() => add(product)}>
              Add to cart <span>+</span>
            </button>
            <Link className="button button-outline" to="/products">
              Explore more
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
