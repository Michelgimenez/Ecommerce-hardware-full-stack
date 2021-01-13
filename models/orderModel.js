const mongoose = require('mongoose');

/*
const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        imageCover: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
*/

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        amount: { type: Number, required: true },
        imageCover: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String, required: true },
        name: { type: String, required: true },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    paymentMethod: {
      type: String,
      required: true,
      default: 'Efectivo en persona',
    },
    totalPrice: {
      type: String,
      required: true,
      default: '0',
    },
    phoneNumber: {
      type: String,
      required: [true, 'Por favor ingrese su numero de telefono'],
    },
    retirementDate: {
      type: String,
      required: [true, 'Por favor ingrese una fecha de retiro'],
    },
    houseDirection: {
      type: String,
      default: 'No se proporciono esta informacion',
    },
    province: {
      type: String,
      default: 'No se proporciono esta informacion',
    },
    city: {
      type: String,
      default: 'No se proporciono esta informacion',
    },
    postalCode: {
      type: String,
      default: 'No se proporciono esta informacion',
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email photo',
  }); /* .populate({
    path: 'orderItems/_id',
    select: 'name description overview',
  }); */
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
