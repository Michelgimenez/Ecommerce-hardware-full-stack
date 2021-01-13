const Product = require('../models/productModel.js');
const User = require('../models/userModel.js');
const Order = require('../models/orderModel.js');
const AppError = require('../utils/appError.js');
const catchAsync = require('../utils/catchAsync.js');

exports.getHome = catchAsync(async (req, res, next) => {
  // 1) Obtengo los tours destacados llamando al modelo de los productos y para asi para poder almacenarlos en una variable y enviarlos al template
  const featuredProducts = await Product.find({ featured: true });

  res.status(200).render('home', {
    title: 'Bienvenido a la mejor tienda de hardware',
    featuredProducts: featuredProducts,
  });
});

exports.login = (req, res) => {
  res.status(200).render('login', {
    title: 'Inicio de sesion',
  });
};

exports.signup = (req, res) => {
  res.status(200).render('signup', {
    title: 'Registro de usuario',
  });
};

exports.getContact = (req, res) => {
  res.status(200).render('contact', {
    title: 'Contacto',
  });
};

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug });

  // 2) Si no encuentro ningun producto con ese SLUG, entonces procedo a crear un error que lo recibe el global error handler.
  if (!product) {
    return next(new AppError('No existe ningun producto con ese nombre', 404));
  }

  res.status(200).render('product', {
    title: `${product.name}`,
    product: product,
  });
});

exports.getAccount = (req, res, next) => {
  res.status(200).render('account', {
    title: 'Mi cuenta',
  });
};

exports.getProductCreate = (req, res, next) => {
  res.status(200).render('productCreate');
};

exports.getProductsList = async (req, res, next) => {
  const products = await Product.find();

  res.status(200).render('productsList', {
    title: 'Lista de productos',
    products: products,
  });
};

exports.getOrdersList = async (req, res, next) => {
  const orders = await Order.find({});

  res.status(200).render('orders', {
    title: 'Lista de compras',
    orders: orders,
  });
};

exports.getUsersList = async (req, res, next) => {
  const users = await User.find();

  res.status(200).render('usersList', {
    title: 'Lista de usuarios',
    users: users,
  });
};

exports.getOrderDetails = async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id });

  res.status(200).render('orderEdit', {
    title: 'Editar orden',
    order: order,
  });
};

exports.getProducts = async (req, res, next) => {
  res.status(200).render('products', {
    title: 'Productos',
  });
};

exports.getCartPage = (req, res, next) => {
  res.status(200).render('cart', {
    title: 'Detalles de la compra',
  });
};

exports.getCheckoutInPersonPage = (req, res, next) => {
  res.status(200).render('inPersonCheckout', {
    title: 'Pago en persona',
  });
};

// La paginacion que habia implentado desde el servidor
/* 
exports.getProducts = async (req, res, next) => {
// PAGINACION

  const page = req.query.page || 1;
  const limit = 3;
  const skip = page * limit - limit;
  const totalProducts = await Product.find().countDocuments();
  const products = await Product.find().skip(skip).limit(limit);

// BUSQUEDA

  res.status(200).render('products', {
    title: 'Productos',
    products: products,
    currentPage: page,
    hasNextPage: limit * page < totalProducts,
    hasPreviousPage: page > 1,
    nextPage: Number(page) + 1,
    previousPage: page - 1,
    lastPage: Math.ceil(totalProducts / limit),
  });
};
*/
