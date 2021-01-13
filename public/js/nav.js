export const mobileNav = () => {
  const burguer = document.querySelector('.nav__phone');
  const nav = document.querySelector('.nav');
  const btn = document.querySelector('.nav__close');

  burguer.addEventListener('click', () => {
    nav.classList.add('open');
  });

  btn.addEventListener('click', () => {
    nav.classList.remove('open');
  });
};

export const cart = () => {
  const cartOverlay = document.querySelector('.cart');
  const closeCartBtn = document.querySelector('.cart__close');
  const toggleCartBtn = document.querySelector('.nav__cart-link');
  const cartContent = document.querySelector('.cart__content');
  const cartIcon = document.querySelector('.nav__cart-link');

  if (cartIcon) {
    toggleCartBtn.addEventListener('click', () => {
      cartOverlay.classList.add('show');
      cartContent.classList.add('show');
    });

    closeCartBtn.addEventListener('click', () => {
      cartOverlay.classList.remove('show');
      cartContent.classList.remove('show');
    });
  }
};
