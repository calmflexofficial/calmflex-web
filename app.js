const cartCount = document.querySelector('.cart-count');
const addButtons = document.querySelectorAll('.add-button');
let cartItems = 0;

addButtons.forEach((button) => {
  button.addEventListener('click', () => {
    cartItems += 1;
    cartCount.textContent = cartItems;
    button.classList.add('added');
    button.innerHTML = 'Added to cart <span>✓</span>';
    window.setTimeout(() => {
      button.classList.remove('added');
      button.innerHTML = 'Add to cart <span>+</span>';
    }, 1600);
  });
});

document.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = event.currentTarget.querySelector('input');
  const button = event.currentTarget.querySelector('button');
  button.innerHTML = 'You are in <span>✓</span>';
  input.value = '';
});
