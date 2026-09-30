const cartKey = 'calmflex-cart';
const quantityElement = document.querySelector('#quantity');
const cartCountElement = document.querySelector('#page-cart-count');
const quantity = { value: 1 };

const readCart = () => JSON.parse(localStorage.getItem(cartKey) || '[]');
const writeCart = (cart) => localStorage.setItem(cartKey, JSON.stringify(cart));
const refreshCartCount = () => { cartCountElement.textContent = readCart().reduce((total, item) => total + item.quantity, 0); };

const updateQuantity = (change) => {
  quantity.value = Math.max(1, quantity.value + change);
  quantityElement.textContent = quantity.value;
};

document.querySelector('#decrease').addEventListener('click', () => updateQuantity(-1));
document.querySelector('#increase').addEventListener('click', () => updateQuantity(1));

document.querySelector('#add-to-cart').addEventListener('click', (event) => {
  const cart = readCart();
  const existing = cart.find((item) => item.name === '3-in-1 Scalp Massager');
  existing ? existing.quantity += quantity.value : cart.push({ name: '3-in-1 Scalp Massager', price: 699, quantity: quantity.value });
  writeCart(cart);
  refreshCartCount();
  event.currentTarget.classList.add('added');
  event.currentTarget.innerHTML = 'Added to cart <span>✓</span>';
  window.setTimeout(() => { event.currentTarget.classList.remove('added'); event.currentTarget.innerHTML = 'Add to cart <span>+</span>'; }, 1600);
});

document.querySelector('#check-delivery').addEventListener('click', () => {
  const result = document.querySelector('#check-result');
  const pincode = document.querySelector('#pincode').value.trim();
  result.textContent = /^\d{6}$/.test(pincode) ? 'Delivery available. Estimated arrival in 3-6 days.' : 'Enter a valid 6-digit PIN code.';
});

refreshCartCount();
