const viewsController = require('../controllers/viewsController.js');
const authControlller = require('../controllers/authControlller.js');
const express = require('express');
const router = express.Router();

// En este caso para todas las rutas que comiencen con /, se va a entrar a este router y se va a buscar la ruta que coincida con las rutas especificas aca. Por ejemplo si voy a /, que seria por ejemplo nexus.com/, entonces doy como respuesta el llamado al controlador de las vistas y llamo al metodo que renderiza el template que contiene todo el contenido principal de la pagina (home.pug), o si voy a /product/:id renderizo el template para mostrar los detalles del producto. Con el middleware de isLoggedIn, me aseguro que siempre a cualquier ruta a la que vaya el usuario, se ejecute el metodo de isLoggedIn que lo voy a utilizar para detectar si el usuario tiene sesion iniciada y de esa forma proceder a mostrar la foto del usuario/nombre o el boton de inicio de sesion. lo hago en todas las rutas excepto en la ruta donde el usuario ve su informacion ya que ahi uso directamente PROTECT que verifica que el usuario tenga sesion iniciada y de lo contrario no lo deja ingresar a esa ruta. Y en LOGIN por supuesto que no uso nada porque es accesible a todos.
router.get('/', authControlller.isLoggedIn, viewsController.getHome);

router.get(
  '/product/:slug',
  authControlller.isLoggedIn,
  viewsController.getProduct
);

router.get('/login', authControlller.isLoggedIn, viewsController.login);
router.get('/signup', authControlller.isLoggedIn, viewsController.signup);
router.get(
  '/products',
  authControlller.isLoggedIn,
  viewsController.getProducts
);
router.get('/contact', authControlller.isLoggedIn, viewsController.getContact);

// Esta ruta es protegida
router.get('/me', authControlller.protect, viewsController.getAccount);

// Apartir de esta parte todas las rutas que siguen son solo para administradores
router.get(
  '/productslist',
  authControlller.protect,
  authControlller.restrictTo('admin'),
  viewsController.getProductsList
);

router.get(
  '/createproduct',
  authControlller.protect,
  authControlller.restrictTo('admin'),
  viewsController.getProductCreate
);

router.get(
  '/userslist',
  authControlller.protect,
  authControlller.restrictTo('admin'),
  viewsController.getUsersList
);

router.get(
  '/orders-list',
  authControlller.protect,
  authControlller.restrictTo('admin'),
  viewsController.getOrdersList
);

router.get(
  '/order-update/:id',
  authControlller.protect,
  authControlller.restrictTo('admin'),
  viewsController.getOrderDetails
);

router.get('/cart', authControlller.protect, viewsController.getCartPage);

router.get(
  '/in-person-checkout',
  authControlller.protect,
  viewsController.getCheckoutInPersonPage
);

module.exports = router;
