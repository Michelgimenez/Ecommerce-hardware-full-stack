const Order = require('../models/orderModel.js');
const catchAsync = require('../utils/catchAsync.js');

exports.createInPersonOrder = catchAsync(async (req, res, next) => {
  // 1) Llamo al metodo de create sobre el modelo para crear el documento con la informacion recibida de la solicitud (el objeto con la informacion del producto/usuario). Esto me da una promesa como retorno asi que la almaceno en una variable.
  const newOrder = await Order.create(req.body);

  // 2) Doy como retorno el status de exito y un mensaje en formato JSON que da como respuesta dos fields, el mas importante es data que dentro tiene un objeto con el field data y este dentro tiene la informacion del nuevo documento creado.
  res.status(201).json({
    status: 'success',
    data: {
      newOrder: newOrder,
    },
  });
});

exports.getOrder = async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id });

  res.status(201).json({
    status: 'success',
    data: {
      order: order,
    },
  });
};

exports.getOrders = async (req, res, next) => {
  const orders = await Order.find({});

  res.status(201).json({
    status: 'success',
    data: {
      results: orders.length,
      orders: orders,
    },
  });
};

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const document = await Order.findByIdAndDelete(req.params.id);

  if (!document) {
    return next(new AppError('No se encontro un documento con ese id', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateOrder = catchAsync(async (req, res, next) => {
  // 1) Uso el metodo que busca busca el documento por su id y lo actualiza. Asi que primero paso el id obtenido de los parametros de la solicitud. Despues extraigo la informacion que quiero actualizar del documento. Y como tercer argumento del metodo le paso opciones, NEW es para que reciba como retorno el documento actualizado y runValidators se encarga de corroborar que se haya enviado informacion que es requerida en el modelo del producto y que se cumplan los validators establecidos, por ejemplo que el nombre sea unico.
  const updatedDocument = await Order.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      useFindAndModify: false,
    }
  );

  if (!updatedDocument) {
    return next(new AppError('No se encontro un producto con ese ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      updatedDocument: updatedDocument,
    },
  });
});
