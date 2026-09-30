import { startRazorpayCheckout } from './src/services/razorpay.js';

const cartKey = 'calmflex-cart';
const productImages = {
  '3-in-1 Scalp Massager': 'assets/red-scalp-massager.png',
  'Electric Scalp Massager': 'assets/scalp-massager.webp',
  'Mini Massage Gun': 'assets/mini-massage-gun.jpg',
  'Neck & Shoulder Massager': 'assets/neck-shoulder-massager.jpg',
  'Silicone Body Scrubber': 'assets/body-scrubber.png',
  'Everyday Waist Trimmer': 'assets/waist-trimmer.png'
};
let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
const money = (value) => `₹${value.toLocaleString('en-IN')}`;
const save = () => localStorage.setItem(cartKey, JSON.stringify(cart));

const render = () => {
  const list = document.querySelector('#cart-list');
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 499 ? 0 : 60;
  document.querySelector('#subtotal').textContent = money(subtotal);
  document.querySelector('#shipping').textContent = shipping ? money(shipping) : 'Free';
  document.querySelector('#total').textContent = money(subtotal + shipping);
  document.querySelector('#shipping-note').textContent = subtotal >= 499 ? 'You unlocked free delivery.' : `Add ${money(499 - subtotal)} more for free delivery.`;
  list.innerHTML = cart.length ? cart.map((item, index) => `<article class="cart-row"><div class="cart-row-image"><img src="${productImages[item.name]}" alt="${item.name}" /></div><div><h2>${item.name}</h2><p>CalmFlex everyday essential</p></div><div class="cart-quantity"><button data-action="decrease" data-index="${index}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-action="increase" data-index="${index}" aria-label="Increase quantity">+</button></div><strong>${money(item.price * item.quantity)}</strong><button class="row-remove" data-action="remove" data-index="${index}">Remove</button></article>`).join('') : '<p class="empty-state">Your cart is empty. There is always room for one good ritual.</p>';
};

document.querySelector('#cart-list').addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const index = Number(control.dataset.index);
  if (control.dataset.action === 'remove') cart.splice(index, 1);
  else { cart[index].quantity += control.dataset.action === 'increase' ? 1 : -1; if (cart[index].quantity < 1) cart.splice(index, 1); }
  save();
  render();
});

document.querySelector('#checkout-button').addEventListener('click', () => {
  if (!cart.length) return;
  document.querySelector('#cart-view').classList.add('hidden');
  document.querySelector('#checkout-view').classList.add('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const showOrderReceived = () => {
  document.querySelector('#checkout-view').innerHTML = '<p class="eyebrow">ORDER RECEIVED</p><h2>Thank you.</h2><p class="detail-intro">Your CalmFlex order has been placed. We will share tracking details shortly.</p><a class="button button-dark" href="shop.html">Continue shopping <span>→</span></a>';
  localStorage.removeItem(cartKey);
  cart = [];
};

document.querySelector('#checkout-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const customer = Object.fromEntries(formData.entries());
  if (formData.get('payment') === 'cod') return showOrderReceived();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  try {
    await startRazorpayCheckout({ customer, cart, total: total * 100, onSuccess: showOrderReceived });
  } catch (error) {
    const message = document.querySelector('#payment-message');
    message.textContent = error.message;
    message.classList.add('visible');
  }
});

render();
