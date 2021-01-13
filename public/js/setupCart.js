import { getStorageItem, setStorageItem, formatPrice } from './utils.js';
import { findProduct } from './store.js';

// 1) Selecciono todos los elementos a modificar de la cart.
const cartItemCountDOM = document.querySelector('.nav__cart-span');
const cartItemsDOM = document.querySelector('.cart__items');
const cartTotalDOM = document.querySelector('.cart__total');

// 2) Para la pagina exclusiva del carrito
const cartTotalPrice = document.querySelector(
  '.cart-details__checkout-total-details-total-price'
);
const cartProductsContainer = document.querySelector('.cart-details__products');

// 2) Obtengo todos los elementos almacenados en localStorage en el item de CART, en caso de no haber ninguno (son los items agregados al carrito), entonces cart va a estar vacio.
let cart = getStorageItem('cart');

export const addToCart = (id) => {
  let item = cart.find((cartItem) => cartItem._id === id);
  if (!item) {
    let product = findProduct(id);
    product = { ...product, amount: 1 };
    cart = [...cart, product];
    addToCartDom(product, cartItemsDOM);
  } else {
    const amount = increaseAmount(id);
    const items = [...cartItemsDOM.querySelectorAll('.cart__item-amount')];
    const newAmount = items.find((value) => value.dataset.id === id);
    newAmount.textContent = amount;
  }
  displayCartItemCount();
  displayCartTotal();
  setStorageItem('cart', cart);
};

export function increaseAmount(id) {
  let newAmount;
  cart = cart.map((cartItem) => {
    if (cartItem._id === id) {
      newAmount = cartItem.amount + 1;
      cartItem = { ...cartItem, amount: newAmount };
    }
    return cartItem;
  });
  return newAmount;
}

export function decreaseAmount(id) {
  let newAmount;
  cart = cart.map((cartItem) => {
    if (cartItem._id === id) {
      newAmount = cartItem.amount - 1;
      cartItem = { ...cartItem, amount: newAmount };
    }
    return cartItem;
  });

  return newAmount;
}

export function displayCartItemCount() {
  const amount = cart.reduce((total, cartItem) => {
    return (total += cartItem.amount);
  }, 0);

  cartItemCountDOM.textContent = `(${amount})`;
}

export function displayCartTotal() {
  let total = cart.reduce((total, cartItem) => {
    return (total += cartItem.price * cartItem.amount);
  }, 0);

  if (cartTotalPrice) {
    cartTotalPrice.textContent = `Total: ${formatPrice(total)}`;
  }

  cartTotalDOM.textContent = `Total: ${formatPrice(total)}`;
}

export function displayCartItemsDOM() {
  cart.forEach((cartItem) => {
    addToCartDom(cartItem, cartItemsDOM);
  });
}

export function removeItem(id) {
  cart = cart.filter((cartItem) => cartItem._id !== id);
}

export function setupCartFunctionality() {
  cartItemsDOM.addEventListener('click', function (e) {
    const element = e.target;
    const parent = e.target.parentElement;
    const id = e.target.dataset.id;
    const parentID = e.target.parentElement.dataset.id;

    if (element.classList.contains('cart__item-remove-btn')) {
      removeItem(id);
      parent.parentElement.remove();
    }
    if (parent.classList.contains('cart__item-increase-btn')) {
      const newAmount = increaseAmount(parentID);
      parent.nextElementSibling.textContent = newAmount;
    }
    if (parent.classList.contains('cart__item-decrease-btn')) {
      const newAmount = decreaseAmount(parentID);
      if (newAmount === 0) {
        removeItem(parentID);
        parent.parentElement.parentElement.remove();
      } else {
        parent.previousElementSibling.textContent = newAmount;
      }
    }

    displayCartItemCount();
    displayCartTotal();
    setStorageItem('cart', cart);
  });

  if (cartProductsContainer) {
    cartProductsContainer.addEventListener('click', (e) => {
      const element = e.target;
      const productId = element.parentElement.parentElement.dataset.id;

      if (element.classList.contains('delete-product')) {
        removeItem(productId);
        element.parentElement.parentElement.remove();
      }

      if (element.classList.contains('cart__item-increase-btn')) {
        const newAmount = increaseAmount(productId);
        element.nextElementSibling.textContent = newAmount;
      }

      if (element.classList.contains('cart__item-decrease-btn')) {
        const newAmount = decreaseAmount(productId);
        if (newAmount === 0) {
          removeItem(productId);
          element.parentElement.parentElement.remove();
        } else {
          element.previousElementSibling.textContent = newAmount;
        }
      }

      setStorageItem('cart', cart);
      displayCartItemCount();
      displayCartTotal();
    });
  }
}

export const toggleCart = () => {
  const cartOverlay = document.querySelector('.cart');
  const closeCartBtn = document.querySelector('.cart__close');
  const toggleCartBtn = document.querySelector('.nav__cart-link');
  const cartContent = document.querySelector('.cart__content');

  if (toggleCartBtn) {
    toggleCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cartOverlay.classList.add('show');
      cartContent.classList.add('show');
    });

    closeCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cartOverlay.classList.remove('show');
      cartContent.classList.remove('show');
    });
  }
};

export const setUpCart = () => {
  displayCartItemCount();
  displayCartTotal();
  displayCartItemsDOM();
  setupCartFunctionality();
  toggleCart();
};

///////////////*************** */

export const addToCartDom = async (product, cartItems) => {
  const article = document.createElement('article');
  article.classList.add('cart__item');
  article.setAttribute('data-id', product._id);

  article.innerHTML = `
            <img src="/img/products/${product.imageCover}" alt="${
    product.name
  }" class="cart__item-img" />
            <div>
              <h4 class="cart__item-name">${product.name}</h4>
              <p class="cart__item-price">${formatPrice(product.price)}</p>
              <button class="cart__item-remove-btn" data-id="${product._id}">
                Quitar
              </button>
            </div>
            <div>
              <button class="cart__item-increase-btn" data-id="${product._id}">
                <ion-icon name="chevron-up-outline"></ion-icon>
              </button>
              <p class="cart__item-amount" data-id="${product._id}">${
    product.amount
  }</p>
              <button class="cart__item-decrease-btn" data-id="${product._id}">
                <ion-icon name="chevron-down-outline"></ion-icon>
              </button>
            </div>

    `;

  cartItems.appendChild(article);
};

export const addEvent = (cartBtn, productId) => {
  cartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addToCart(productId);
  });
};
