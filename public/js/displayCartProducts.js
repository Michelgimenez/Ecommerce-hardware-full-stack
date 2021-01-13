import { getStorageItem } from './utils.js';
import { formatPrice } from './utils.js';

export const displayCartProducts = (productContainer) => {
  let cart = getStorageItem('cart');
  const cartIcon = document.querySelector('.nav__cart-link');
  cartIcon.remove();

  if (cart.length === 0) {
    document.querySelector('.cart-details__categories').innerHTML =
      '<h2 class="empty-cart">Por favor agregue un producto</h2> <a href="/products" class="empty-cart-btn"> Ver productos </a>';
  } else {
    productContainer.innerHTML = cart.map((product, i) => {
      return `
      <div class="cart-details__products-product ${i + 1}" data-id="${
        product._id
      }">
      <div class="cart-details__product-description">
        <img src="/img/products/${product.imageCover}" alt="imagen" />
        <p>${product.name}</p>
      </div>
      <div class="cart-details__product-price">
        <p>${formatPrice(product.price)}</p>
      </div>
      <div class="cart-details__product-quantity">
        <ion-icon name="chevron-up-outline" class="cart__item-increase-btn"></ion-icon>
        <p>${product.amount}</p>
        <ion-icon name="chevron-down-outline" class="cart__item-decrease-btn"></ion-icon>
      </div>
      <div class="cart-details__product-delete" >
        <ion-icon name="trash-outline" class="delete-product"></ion-icon>
      </div>
    </div>
        `;
    });
  }
};
