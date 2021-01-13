const express = require('express');
const productController = require('../controllers/productController.js');
const authControlller = require('../controllers/authControlller.js');
const router = express.Router();

router
  .route('/featured-products')
  .get(productController.topProducts, productController.getAllProducts);

router.route('/product-stats').get(productController.getProductStats);

router
  .route('/')
  .get(productController.getAllProducts)
  .post(
    authControlller.protect,
    authControlller.restrictTo('admin'),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.createProduct
  );

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    authControlller.protect,
    authControlller.restrictTo('admin'),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.updateProduct
  )
  .delete(
    authControlller.protect,
    authControlller.restrictTo('admin'),
    productController.deleteProduct
  );

module.exports = router;
