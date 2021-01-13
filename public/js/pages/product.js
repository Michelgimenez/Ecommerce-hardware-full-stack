// global imports
import "../cart/toggleCart.js";
import "../cart/setupCart.js";

import { addToCart } from "../cart/setupCart.js";
import { allProductsUrl, getElement, formatPrice } from "../utils.js";

const loading = getElement(".page__loading");
const centerDOM = getElement(".product");
const imgDOM = getElement(".product__img");
const titleDOM = getElement(".product__heading");
const priceDOM = getElement(".product__price");
const descDOM = getElement(".product__resume");
const descPAR = getElement(".description__paragraph");
const cartBtn = getElement(".product__button");
const productImage1 = getElement(".product__images-1");
const productImage2 = getElement(".product__images-2");
const productImage3 = getElement(".product__images-3");
const productImage4 = getElement(".product__images-4");

let productID;

window.addEventListener("DOMContentLoaded", async function () {
  const urlID = window.location.search.slice(4);

  try {
    const response = await fetch(`${allProductsUrl}/${urlID}`);

    if (response.status >= 200 && response.status <= 299) {
      const {
        data: { product },
      } = await response.json();

      const {
        _id,
        name,
        overview,
        price,
        imageCover,
        images,
        description,
      } = product;

      const image1 = images[0];
      const image2 = images[1];
      const image3 = images[2];
      const image4 = images[3];

      productID = _id;

      titleDOM.textContent = name;
      document.title = `${name} | Nexus`;
      imgDOM.src = `${imageCover}`;
      descPAR.textContent = description;
      priceDOM.textContent = formatPrice(price);
      descDOM.textContent = overview;
      productImage1.src = `${image1}`;
      productImage2.src = `${image2}`;
      productImage3.src = `${image3}`;
      productImage4.src = `${image4}`;
    } else {
      centerDOM.innerHTML = `
        <div class="error">
        <h3 >Algo salio mal 😔</h3>
        <a href="index.html" class="btn">Volver a inicio</a>
        </div>`;
    }
  } catch (error) {
    console.log(error);
  }

  loading.style.display = "none";
});

cartBtn.addEventListener("click", function (e) {
  addToCart(productID);
});
