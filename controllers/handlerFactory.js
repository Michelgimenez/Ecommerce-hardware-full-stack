const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const APIFeatures = require('../utils/apiFeatures.js');

// Al llamar a por ejemplo deleteOne, esta dentro tiene una funcion anonima que recibe el modelo y da como retorno la funcion de catchAsync al controlador donde es llamada. Y citando el modelo de forma dinamica.
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('No se encontro un documento con ese id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // 1) Uso el metodo que busca busca el documento por su id y lo actualiza. Asi que primero paso el id obtenido de los parametros de la solicitud. Despues extraigo la informacion que quiero actualizar del documento. Y como tercer argumento del metodo le paso opciones, NEW es para que reciba como retorno el documento actualizado y runValidators se encarga de corroborar que se haya enviado informacion que es requerida en el modelo del producto y que se cumplan los validators establecidos, por ejemplo que el nombre sea unico.
    const updatedDocument = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
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

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // 1) Llamo al metodo de create sobre el modelo para crear el documento con la informacion recibida de la solicitud (el objeto con la informacion del producto/usuario). Esto me da una promesa como retorno asi que la almaceno en una variable.
    const newDocument = await Model.create(req.body);

    // 2) Doy como retorno el status de exito y un mensaje en formato JSON que da como respuesta dos fields, el mas importante es data que dentro tiene un objeto con el field data y este dentro tiene la informacion del nuevo documento creado.
    res.status(201).json({
      status: 'success',
      data: {
        newDocument: newDocument,
      },
    });
  });

exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // 1) Llamo al metodo de findById sobre el modelo, para encontrar un producto en base a su id, y para obtener el id, lo extraigo de la solicitud, utilizando req.params, esto me da los parametros colocados en el url de la solicitud y selecciono el id, que es el que espeficique en productRoutes.js (/:id)
    const document = await Model.findById(req.params.id);

    // Si busco un documento por ejemplo con un id invalido, el servidor responde con success pero la respuesta es NULL, ya que no encontre ningun documento, asi que para resolver eso de SUCCESS, detecto primero si encontre algun documento y en ese caso, procedo a crear un error llamando a la class que cree donde envio el mensaje y el statusCode y esto me da como retorno el error ya teniendo los fields de status, message, statusCode. Y esto es lo que se envia atraves de NEXT, que si recuerdo, al enviarlo a traves de next, lo envia directamente al global error handler. Uso return para que la funcion finalice aca.
    if (!document) {
      return next(new AppError('No se encontro un documento con ese ID', 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        document: document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // 1) Aca llamo a la class que cree de APIFeatures donde primero le paso el resultado de llamar a Product.find() que al no usar await da como retorno la query a la que puedo aplicarle diversos metodos encadenados y por otro lado le mando las query de la solicitud (name, fields, sort, price, etc). Como el llamado a la class me da como retorno un objeto que ahora tiene los metodos de la class de APIFeatures en el prototipo ya que los hereda por haber sido creado en base a esa class, entonces antes de almacenar los resultados en la variable, le aplico al objeto retornado el metodo de filter() y eso va a buscar el metodo y lo va a encontrar en el prototipo y lo va a llamar, filtrando los query en la solicitud que no quiero (page, sort, etc) y filtra tambien documentos si busco por nombre o por precio, y finalmente dentro de ese metodo se vuelve a llamar a find sobre la query, asi que da como retorno otra query con los documentos filtrados que se almacenan en la variable query y al final del metodo se da como retorno THIS, que representa el objeto entero, por lo tanto puedo seguir encadenando mas metodos, asi que los encadeno todos y el resultado final lo almaceno en la variable de filteredDocuments. Y para obtener finalmente los documentos uso await sobre el objeto dentro de filteredDocuments y selecciono el field de query que es donde fui almacenando las query con los documentos que se fueron filtrando y que al hacerle await me da los documentos reales de la base de datos y almaceno el resultado en la variable de allDocuments.
    const filteredDocuments = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    // Dejo este codigo por si en algun momento quiero comprobar que los indexes estan funcionan al buscar documentos con tal precio o tal nombre.
    // const allDocuments = await filteredDocuments.query.explain();

    const allDocuments = await filteredDocuments.query;

    // 2) Doy como retorno el status de exito y un mensaje en formato JSON que da como respuesta tres fields, el mas importante es data que dentro tiene un objeto con el field data y este dentro tiene la informacion de todos los documentos.
    res.status(201).json({
      status: 'success',
      results: allDocuments.length,
      data: {
        allDocuments: allDocuments,
      },
    });
  });
