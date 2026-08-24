const products = [
  { name: '3-in-1 Scalp Massager', category: 'wellness', price: 699, description: 'Relaxation, reimagined.', image: 'assets/red-scalp-massager.png', badge: 'BESTSELLER' },
  { name: 'Electric Scalp Massager', category: 'wellness', price: 599, description: 'A calmer daily ritual.', image: 'assets/scalp-massager.webp', badge: 'NEW' },
  { name: 'Mini Massage Gun', category: 'wellness', price: 1299, description: 'Targeted relief, anywhere.', image: 'assets/mini-massage-gun.jpg', badge: '' },
  { name: 'Neck & Shoulder Massager', category: 'wellness', price: 1499, description: 'Unwind where you hold tension.', image: 'assets/neck-shoulder-massager.jpg', badge: 'POPULAR' },
  { name: 'Silicone Body Scrubber', category: 'beauty', price: 399, description: 'A softer shower ritual.', image: 'assets/body-scrubber.png', badge: '' },
  { name: 'Everyday Waist Trimmer', category: 'fitness', price: 699, description: 'Support for active routines.', image: 'assets/waist-trimmer.png', badge: 'NEW' }
];

const grid = document.querySelector('#catalog-grid');
const search = document.querySelector('#catalog-search');
const sort = document.querySelector('#sort-products');
const noResults = document.querySelector('#no-results');
let selectedCategory = 'all';

const price = (value) => `₹${value.toLocaleString('en-IN')}`;
const renderProducts = () => {
  const query = search.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesCategory && `${product.name} ${product.description}`.toLowerCase().includes(query);
  }).sort((first, second) => {
    if (sort.value === 'price-low') return first.price - second.price;
    if (sort.value === 'price-high') return second.price - first.price;
    if (sort.value === 'name') return first.name.localeCompare(second.name);
    return 0;
  });

  noResults.classList.toggle('visible', visibleProducts.length === 0);
  grid.innerHTML = visibleProducts.map((product) => `<article class="catalog-card"><div class="catalog-image"><img src="${product.image}" alt="${product.name}" />${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}</div><div class="catalog-info"><div><h2>${product.name}</h2><p>${product.description}</p></div><strong>${price(product.price)}</strong></div><button class="catalog-add" data-name="${product.name}" data-price="${product.price}">Add to cart <span>+</span></button></article>`).join('');
};

const refreshCartCount = () => {
  const cart = JSON.parse(localStorage.getItem('calmflex-cart') || '[]');
  document.querySelector('#shop-cart-count').textContent = cart.reduce((total, item) => total + item.quantity, 0);
};

grid.addEventListener('click', (event) => {
  const button = event.target.closest('.catalog-add');
  if (!button) return;
  const cart = JSON.parse(localStorage.getItem('calmflex-cart') || '[]');
  const existing = cart.find((item) => item.name === button.dataset.name);
  existing ? existing.quantity += 1 : cart.push({ name: button.dataset.name, price: Number(button.dataset.price), quantity: 1 });
  localStorage.setItem('calmflex-cart', JSON.stringify(cart));
  refreshCartCount();
  button.innerHTML = 'Added to cart <span>✓</span>';
  window.setTimeout(() => { button.innerHTML = 'Add to cart <span>+</span>'; }, 1400);
});

document.querySelectorAll('.catalog-filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('.catalog-filter.active').classList.remove('active');
  button.classList.add('active');
  selectedCategory = button.dataset.filter;
  renderProducts();
}));
search.addEventListener('input', renderProducts);
sort.addEventListener('change', renderProducts);
renderProducts();
refreshCartCount();
