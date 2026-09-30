import { useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';
import type { ProductCategory } from '../types/product';

const filters: Array<{ id: 'all' | ProductCategory; label: string }> = [
  { id: 'all', label: 'All products' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'fitness', label: 'Fitness' }
];

export default function ProductsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('all');
  const [sort, setSort] = useState('featured');

  const catalog = useMemo(() => {
    const next = products.filter((product) => {
      const matchesFilter = filter === 'all' || product.category === filter;
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
    if (sort === 'price-low') next.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') next.sort((a, b) => b.price - a.price);
    if (sort === 'name') next.sort((a, b) => a.name.localeCompare(b.name));
    return next;
  }, [filter, query, sort]);

  return (
    <main className="page-shell">
      <section className="shop-intro">
        <div>
          <p className="eyebrow">The CalmFlex collection</p>
          <h1>All products.</h1>
        </div>
        <p>Wellness, beauty and movement tools for a routine that feels like yours.</p>
      </section>
      <section className="shop-controls">
        <div className="shop-search">
          <label className="sr-only" htmlFor="catalog-search">
            Search products
          </label>
          <input
            id="catalog-search"
            type="search"
            placeholder="Search products"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="catalog-filters" aria-label="Product categories">
          {filters.map((item) => (
            <button
              key={item.id}
              className={`catalog-filter${filter === item.id ? ' active' : ''}`}
              type="button"
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="sort-products">
          Sort products
        </label>
        <select className="sort-select" id="sort-products" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="featured">Featured</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </section>
      {catalog.length ? (
        <div className="product-grid">
          {catalog.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <p className="empty-state">No products match that search. Try a different ritual.</p>
      )}
    </main>
  );
}
