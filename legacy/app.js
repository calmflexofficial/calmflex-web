const cartCount = document.querySelector('.cart-count');
const cartDrawer = document.querySelector('.cart-drawer');
const cartItemsElement = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cart = JSON.parse(localStorage.getItem('calmflex-cart') || '[]');
const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;
const saveCart = () => localStorage.setItem('calmflex-cart', JSON.stringify(cart));

const renderCart = () => {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  cartCount.textContent = itemCount;
  cartTotal.textContent = formatPrice(subtotal);
  cartItemsElement.innerHTML = cart.length ? cart.map((item, index) => `<div class="cart-item"><div><strong>${item.name}</strong><span>${formatPrice(item.price)}</span></div><div class="quantity"><button data-index="${index}" data-action="decrease" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-index="${index}" data-action="increase" aria-label="Increase quantity">+</button></div></div>`).join('') : '<p class="empty-cart">Your cart is waiting for a ritual.</p>';
};

const openCart = () => { cartDrawer.classList.add('open'); document.querySelector('.drawer-overlay').classList.add('open'); cartDrawer.setAttribute('aria-hidden', 'false'); };
const closeCart = () => { cartDrawer.classList.remove('open'); document.querySelector('.drawer-overlay').classList.remove('open'); cartDrawer.setAttribute('aria-hidden', 'true'); };

document.querySelectorAll('.add-button').forEach((button) => {
  button.addEventListener('click', () => {
    const existing = cart.find((item) => item.name === button.dataset.product);
    existing ? existing.quantity += 1 : cart.push({ name: button.dataset.product, price: Number(button.dataset.price), quantity: 1 });
    saveCart();
    renderCart();
    openCart();
  });
});

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.filter-button.active').classList.remove('active');
    button.classList.add('active');
    const category = button.dataset.filter;
    document.querySelectorAll('.product-card').forEach((card) => { card.hidden = category !== 'all' && card.dataset.category !== category; });
  });
});

cartItemsElement.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const itemIndex = Number(control.dataset.index);
  cart[itemIndex].quantity += control.dataset.action === 'increase' ? 1 : -1;
  if (cart[itemIndex].quantity < 1) cart.splice(itemIndex, 1);
  saveCart();
  renderCart();
});

document.querySelector('.cart-button').addEventListener('click', openCart);
document.querySelector('.close-cart').addEventListener('click', closeCart);
document.querySelector('.drawer-overlay').addEventListener('click', closeCart);
renderCart();

document.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = event.currentTarget.querySelector('input');
  const button = event.currentTarget.querySelector('button');
  button.innerHTML = 'You are in <span>✓</span>';
  input.value = '';
});
