import { Link } from 'react-router-dom';
import { money } from '../data/products';
import { useCart } from '../context/CartContext';
import type { Product } from '../types/product';

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="product-card">
      <Link className="product-image" to={`/products/${product.slug}`}>
        <img className="real-product-image" src={product.image} alt={product.name} />
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </Link>
      <div className="product-info">
        <div>
          <h3>
            <Link to={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <p>{product.description}</p>
        </div>
        <strong>{money(product.price)}</strong>
      </div>
      <button className="add-button" type="button" onClick={() => add(product)}>
        Add to cart <span>+</span>
      </button>
    </article>
  );
}
