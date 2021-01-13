const express = require('express');
const authControlller = require('../controllers/authControlller.js');
const orderController = require('../controllers/orderController.js');
const router = express.Router();

router
  .route('/create-in-person-order')
  .post(authControlller.protect, orderController.createInPersonOrder);

router
  .route('/:id')
  .get(authControlller.protect, orderController.getOrder)
  .delete(
    authControlller.protect,
    authControlller.restrictTo('admin'),
    orderController.deleteOrder
  )
  .patch(
    authControlller.protect,
    authControlller.restrictTo('admin'),
    orderController.updateOrder
  );

router.route('/get-orders').get(orderController.getOrders);

module.exports = router;
