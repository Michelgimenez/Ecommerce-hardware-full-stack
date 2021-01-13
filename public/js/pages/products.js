// global imports
import "../cart/toggleCart.js";
import "../cart/setupCart.js";

//  filter imports
import setupSearch from "../filters/search.js";
import setupTypes from "../filters/types.js";
import setupPrice from "../filters/price.js";

// specific imports
import { store } from "../store.js";
import display from "../displayProducts.js";
import { getElement } from "../utils.js";

// Aca selecciono el elemento html que tiene el texto de cargando
const loading = getElement(".page-loading");

// Llamo a la funcion a la cual le envio la variable con los items, y el elemento
// html al que quiero colocarle los items encontrados en la variable de STORE
display(store, getElement(".products__container"));

setupSearch(store);
setupPrice(store);
setupTypes(store);

// Una vez finalizan de cargar los items que obtengo de STORE, procedo a
// darle en el css al elemento de CARGANDO, DISPLAY NONE para que desaparezca
loading.style.display = "none";
