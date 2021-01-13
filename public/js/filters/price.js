import { getElement } from "../utils.js";
import display from "../displayProducts.js";

// Los precios no puedo pasarlos como array asi que los extraigo con ... y
// con el metodo de Math.max, recibo el precio mas alto, si recuerdo bien, los
// items tienen precios sin decimales, asi que procedo a dividir por 100 el precio
// maximo para obtener decimal, y uso el metodo CEIL para obtener un numero redondo
// Finalmente este numero redondo se lo coloco de valor y como valor maximo al input
// del precio. Y procedo a colocar en el P debajo del input, texto con el valor
// del precio maximo
// Finalmente agrego un event al input para que cada vez que se mueva el input, procedo
// a recibir el valor del input, que me da una string, pero uso parseInt para pasarlo
// a numero y finalmente coloco como valor en el P, el valor que va cambiando al mover el
// input, y para filtrar los productos, procedo a crear la variable de newStore en
// donde procedo a citar el array de productos, uso filter, para filtrar los produc
// tos cuyo precio, el cual divido a 100 para pasarlo a decimal, es menor o igual al
// valor del input, finalmente llamo a display para mostrar esos productos filtrados
// Si en el valor de newStore es menor a 1, significa que no hay ningun item con ese
// precio buscado, entonces despliego el h3 con el texto
const setupPrice = (store) => {
  const priceInput = getElement(".price-filter");
  const priceValue = getElement(".price-value");

  let maxPrice = store.map((product) => product.price);
  maxPrice = Math.max(...maxPrice);
  maxPrice = Math.ceil(maxPrice);

  priceInput.value = maxPrice;
  priceInput.max = maxPrice;
  priceInput.min = 0;
  priceValue.textContent = `Valor: $${maxPrice}`;

  priceInput.addEventListener("input", function () {
    const value = parseInt(priceInput.value);
    priceValue.textContent = `Valor: $${value}`;
    let newStore = store.filter((product) => product.price <= value);
    display(newStore, getElement(".products__container"));
    if (newStore.length < 1) {
      const products = getElement(".products__container");
      products.innerHTML = `<h3 class="filter-error">No hay resultados para su busqueda</h3>`;
    }
  });
};

export default setupPrice;
