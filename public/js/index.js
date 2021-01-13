import '@babel/polyfill';
import { login, logout } from './login.js';
import { signup } from './signup.js';
import { updateSettings } from './updateSettings.js';
import { createProduct } from './createProduct.js';
import { updateFormImages } from './updateFormImages.js';
import { activateCarrousel } from './carrousel.js';
import { mobileNav } from './nav.js';
import { addEvent } from './setupCart.js';
import { init } from './init.js';
import { filterProducts, displayProducts } from './products.js';
import { displayCartProducts } from './displayCartProducts.js';
import { createInPersonOrder } from './createInPersonOrder.js';
import { getStorageItem } from './utils.js';
import { deleteDocument } from './deleteDocument.js';
import { updateOrder } from './updateOrder.js';

// FILTRO DE PRODUCTOS Y PAGINA DE PRODUCTOS
const filterSearch = document.querySelector('.filters__search');
const filterCategories = document.querySelector('.filters__categories');
const filterBtn = document.querySelector('.filter-btn');
const products = document.querySelector('.products__container');
const productsContainer = document.querySelector('.allProducts');
const pagination = document.querySelector('.pagination');
const filterPagination = document.querySelector('.filter-pagination');

const cartItems = document.querySelector('.cart__items');
const cartBtn = document.querySelector('.product__button');
const nav = document.querySelector('.nav');
const slider = document.querySelector('.slider');
const productImages = document.querySelector('.product__images');

// CART DETAILS
const cartDetails = document.querySelector('.cart-details');
const productContainer = document.querySelector('.cart-details__products');
const paymentBtn = document.querySelector('.cart-details__checkout-total-btn');

const registerForm = document.querySelector('.register__form');
const loginForm = document.querySelector('.login__form');
const logOutBtn = document.querySelector('.logout-btn');
const userDataForm = document.querySelector('.form__user');
const userPasswordForm = document.querySelector('.form__password');
const createProductForm = document.querySelector('.form__product-create');

// INPUTS PARA IMAGENES AL CREAR PRODUCTO Y LA ULTIMA ES LA DEL USUARIO
const imageCover = document.getElementById('imageCover');
const image1 = document.getElementById('image1');
const image2 = document.getElementById('image2');
const image3 = document.getElementById('image3');
const image4 = document.getElementById('image4');
const userInput = document.getElementById('photo');

// ADMIN LISTA DE USUARIOS
const usersContainer = document.querySelector(
  '.userslist-view__users-container'
);

// ADMIN LISTA DE PRODUCTOS
const productsAdminContainer = document.querySelector(
  '.productslist-view__products-container'
);

// ADMIN LISTA DE PEDIDOS
const ordersAdminContainer = document.querySelector(
  '.orderlist-view__users-container'
);

// ADMIN ACTUALIZAR PEDIDOS
const orderUpdateBtn = document.querySelector('.btn-order-update');

//
const checkoutBtn = document.querySelector('.cart__checkout-btn');

// Pagos en persona
const confirmInPersonPaymentBtn = document.querySelector(
  '.btn-payment-in-person'
);

// ANOTACION IMPORTANTE: Para resolver ciertos errores en los que por ejemplo voy al inicio de la pagina y se ejecuta este index.js ya que se ejecuta en cada pagina. Por ejemplo en el inicio no tengo ningun formulario, por lo tanto la variable de loginForm va a estar vacia y no puedo agregarle ningun addEventListener, asi uso IF para verificar primero que loginForm tenga contenido, es decir, que se haya encontrado ese elemento, y esto va a pasar solo en /login. Lo mismo aplica a las diferentes paginas.
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('registername').value;
    const email = document.getElementById('registeremail').value;
    const password = document.getElementById('registerpassword').value;
    const passwordConfirm = document.getElementById('registerpasswordConfirm')
      .value;

    signup(name, email, password, passwordConfirm);
  });
}

if (userDataForm) {
  updateFormImages(userInput, '.form__image');

  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // 1) Creo una instancia de form data y procedo a usar el metodo de append para colocar la informacion sobre este formData y voy colocando los diferentes fields que le voy a dar y sus valores. En el caso de la imagen es FILES y esto contiene un array del cual selecciono solo el primer item que es la foto del usuario
    const form = new FormData();
    form.append('name', document.getElementById('username').value);
    form.append('email', document.getElementById('useremail').value);
    form.append('photo', document.getElementById('photo').files[0]);

    // Envio finalmente al metodo, la variable de form que contiene el objeto con los datos del formulario, teniendo dentro, el field name, con su valor, y asi con lo demas.
    updateSettings(form, 'data');
  });
}

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn__password').textContent = 'Actualizando...';

    const passwordCurrent = document.getElementById('useractualpassword').value;
    const password = document.getElementById('userpassword').value;
    const passwordConfirm = document.getElementById('userpasswordconfirm')
      .value;

    updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
  });

if (createProductForm) {
  // 1) Una vez que este en la pagina para crear productos, se va a cumplir el form y voy a proceder a llamar a la funcion que cree YO :D que se encarga de recibir primero el input para agregarle un event listener cada vez que selecciono una imagen y segundo el nombre de la class que tiene la imagen donde voy a proceder a colocar como SRC, la imagen que subi en el input
  updateFormImages(imageCover, '.form__image-1');
  updateFormImages(image1, '.form__image-2');
  updateFormImages(image2, '.form__image-3');
  updateFormImages(image3, '.form__image-4');
  updateFormImages(image4, '.form__image-5');

  createProductForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // 1) Creo una instancia de form data y procedo a usar el metodo de append para colocar la informacion sobre este formData y voy colocando los diferentes fields que le voy a dar y sus valores. En el caso de la imagen es FILES y esto contiene un array del cual selecciono solo el primer item que es la foto del usuario
    const form = new FormData();
    form.append('name', document.getElementById('productname').value);
    form.append('brand', document.getElementById('productbrand').value);
    form.append('imageCover', document.getElementById('imageCover').files[0]);
    form.append('images', document.getElementById('image1').files[0]);
    form.append('images', document.getElementById('image2').files[0]);
    form.append('images', document.getElementById('image3').files[0]);
    form.append('images', document.getElementById('image4').files[0]);
    form.append('category', document.getElementById('productcategory').value);
    form.append('overview', document.getElementById('productoverview').value);
    form.append(
      'description',
      document.getElementById('productdescription').value
    );
    form.append('price', Number(document.getElementById('productprice').value));
    form.append(
      'countInStock',
      Number(document.getElementById('productstock').value)
    );
    form.append(
      'featured',
      `${
        document.getElementById('productfeatured').value === 'si' ? true : false
      }`
    );

    createProduct(form);
  });
}

if (productImages) {
  const activeImage = document.querySelector('.product__image .active');
  const productImages = document.querySelectorAll('.product__images img');

  function changeImage(e) {
    activeImage.src = e.target.src;
  }

  productImages.forEach((image) =>
    image.addEventListener('click', changeImage)
  );
}

if (slider) {
  activateCarrousel();
}

if (nav) {
  mobileNav();
}

if (productsContainer) {
  filterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    filterProducts(
      filterSearch,
      filterCategories,
      products,
      1,
      filterPagination,
      pagination
    );
  });
  displayProducts(1, products, pagination);
  pagination.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.classList.value === 'pagination-btn') {
      displayProducts(Number(e.target.textContent), products, pagination);
    }
  });
  filterPagination.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.classList.value === 'filter-pagination-btn') {
      filterProducts(
        filterSearch,
        filterCategories,
        products,
        Number(e.target.textContent),
        filterPagination,
        pagination
      );
    }
  });
}

if (cartDetails) {
  displayCartProducts(productContainer);
}

if (cartBtn) {
  const productId = document.querySelector('.product').dataset.id;
  addEvent(cartBtn, productId, cartItems);
}

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', (e) => {
    window.location.assign('/cart');
  });
}

if (paymentBtn) {
  const paymentOption = document.querySelector(
    '.cart-details__checkout-payment-option'
  ).value;

  paymentBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const cartItems = getStorageItem('cart');

    if (paymentOption === 'Efectivo en persona' && cartItems.length !== 0) {
      window.location.assign('/in-person-checkout');
    } else {
      window.location.assign('/products');
    }
  });
}

if (confirmInPersonPaymentBtn) {
  confirmInPersonPaymentBtn.addEventListener('click', (e) => {
    e.preventDefault();
    createInPersonOrder();
  });
}

if (usersContainer) {
  usersContainer.addEventListener('click', (e) => {
    if (e.target.classList.value === 'userslist-view__delete-btn') {
      const userId = e.target.parentElement.dataset.id;
      deleteDocument('users', userId);
    }
  });
}

if (productsAdminContainer) {
  productsAdminContainer.addEventListener('click', (e) => {
    if (e.target.classList.value === 'productslist-view__delete-btn') {
      const productId = e.target.parentElement.dataset.id;
      deleteDocument('products', productId);
    }
  });
}

if (ordersAdminContainer) {
  ordersAdminContainer.addEventListener('click', (e) => {
    if (e.target.classList.value === 'orderlist-view__delete-btn') {
      const orderId = e.target.parentElement.dataset.orderid;
      deleteDocument('orders', orderId);
    }

    if (e.target.classList.value === 'orderlist-edit-btn') {
      const orderId = e.target.parentElement.dataset.orderid;
      window.location.assign(`/order-update/${orderId}`);
    }
  });
}

if (orderUpdateBtn) {
  orderUpdateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const orderId = window.location.pathname.slice(14);
    updateOrder(orderId);
  });
}

// Aca es donde almaceno todos los productos en localStorage una vez que termina de cargarse la pagina
window.addEventListener('DOMContentLoaded', init);
