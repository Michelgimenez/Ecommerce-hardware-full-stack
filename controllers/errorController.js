// ANOTACION IMPORTANTE SOBRE EL FLUJO HASTA LLEGAR HASTA ESTA FUNCION. Por ejemplo supongamos busco un producto con un ID incorrecto, todo comienza en app.js donde voy al router de /products, entro y ejecuto la funcion de getProduct ya que el url ingresado tiene un id, entonces equivale a   /:id, despues al ejecutarse la funcion, va a haber un error ya que no se encuentra el producto con ese id, este error es atrapado por la funcion de catchAsync y lo envia a next(), al hacer esto se corta toda la cadena de middlewares y se ejecuta el middleware que cree en app.js al final de todo que es el middleware de errores globales, este recibe el error enviado a traves de NEXT() y llama a la funcion que exporte aca con module.exports pasandole automaticamente el error. Y aca es donde finalmente doy como retorno el error con un formato prolijo.

const AppError = require('../utils/appError.js');

// Aca recibo el error, y le creo un mensaje personalizado donde coloco detalles del error que me da mongodb, en el field de VALUE se encuentra el valor de lo que se quiso escribir, y en PATH lo que se quiso colocar(el id del documento) que se lo envio a la class que me crea el error nuevo teniendo el mensaje que le envie y el status que le pase.
const handleCastErrorDB = (error) => {
  const message = `${error.path} invalido. No existe un documento con este valor ingresado: ${error.value}`;
  return new AppError(message, 400);
};

// Aca recibo el error en caso de querer crear un documento con un nombre/email que ya existe. En este caso los detalles del nombre duplicado se encuentran en error.errmsg, asi que para extraer el nombre uso regular expression ya que el nombre se encuentra entre simbolos raros, esto da como resultado un array del cual selecciono el primer elemento, que contiene el nombre del producto duplicado. Y finalmente creo el mensaje personalizado con el nombre que se quiso colocar del documento.
const handleDuplicateFieldsDB = (error) => {
  const value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Estas creando un documento con un nombre/email repetido. ${value}`;
  return new AppError(message, 400);
};

// Al querer por ejemplo crear un tour con un nombre menor a 5 letras, el mensaje dado por mongoDb se encuentra en el field ERRORS dentro del error, y este contiene dentro un un objeto por cada error, en este caso seria name ya que se produjo en NAME el error de validacion. O puedo ser category por ejemplo al colocar una categoria que no esta especificada en el model. Asi que para resolver esto uso Object.values para recibir los diferentes objetos dentro de error.errors, como dije antes recibiria el objeto de NAME, CATEGORY, y el resultado de este array de objetos resultante de usar Object.values, le aplico map, para que por cada objeto del array, reciba solo el field de message ya que este contiene los detalles del error. Map resulta en un nuevo array que crea una string por cada field de message encontrado y esto lo almaceno en ERRORS. Despues al crear el mensaje personalizado para el error, uso JOIN() para unir el array de strigs pero colocando un punto y espacio entre cada uno.
const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map(
    (errorObject) => errorObject.message
  );
  const message = `Informacion invalida ingresada. ${errors.join('. ')} `;
  return new AppError(message, 400);
};

// En caso de que el token no sea valido a la hora de solicitar por ejemplo los productos
const handleJWTError = () =>
  new AppError('El token es invalido. Por favor inicie sesion nuevamente', 401);

// En caso de que expire el token
const handleJWTExpiredError = () =>
  new AppError('El token expiro. Por favor inicie sesion nuevamente', 401);

// En development siempre doy todos los detalles del error ya que estoy en development. Pero al recibir el error primero corroboro con IF, que si el url de la solicitud comienza con /api, es decir, se realizo una solicitud a la api, entonces mando como respuesta el error en formato JSON, porque significa que estoy testeando la api, pero si el url no comienza con /api, significa que estoy usando la pagina con los templates, asi que renderizo una pagina de error. enviandole el titulo y un mensaje que contiene el mensaje del error ya que estoy en development puedo ver el mensaje del error.
const sendErrorDev = (error, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      stack: error.stack,
      error: error,
    });
  }

  return res.status(error.statusCode).render('error', {
    title: 'Algo salio mal',
    message: error.message,
  });
};

// Si el error es operacional, es decir por ejemplo si quiero buscar un tour que no existe, etc. Errores predecibles, en ese caso le envio al cliente el error con el mensaje que detalla el error. Caso contrario que haya un error de programacion, por ejemplo un bug, doy un mensaje muy generico para no detallar al cliente cosas que pueden volver vulnerable mi backend.
const sendErrorProd = (error, req, res) => {
  // A) Para las solicitudes a la api en production. Si es operacional doy detalles del error, caso contrario, un mensaje generico.
  if (req.originalUrl.startsWith('/api')) {
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Algo salio mal',
    });
  }
  // B) Para cuando se esta usando la pagina renderizada en modo production. Si el error es operacional, es algo predecible como buscar un producto que no existe, etc. Renderizo la pagina de error mostrando el detalle del error. Si no es operacional voy a proceder a mostrar el mensaje generico para no detallas los errores.
  if (error.isOperational) {
    return res.status(error.statusCode).render('error', {
      title: 'Algo salio mal',
      message: error.message,
    });
  }

  return res.status(error.statusCode).render('error', {
    title: 'Algo salio mal',
    message: 'Por favor intentelo de nuevo',
  });
};

// Para crear un middleware que se encarga de atrapar errores, simplemente agrego otro argumento en la callback function ademas de next, teniendo 4. Y al recibir el error, me fijo si este tiene el field de statusCode/status, si no los tiene, les doy valores default. Y procedo a enviar la respuesta al cliente con los fields del error. Si estoy en development voy a agregar a la respuesta al cliente, un field llamado stack donde muestro todo el detalle de donde ocurrio el error y tambien el error completo. En produccion solo quiero el status y el mensaje.
module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // 0) Creo una copia del error para no modificar el original. Y le agrego a la fuerza el field de message del error original porque por alguna razon al crear la copia no se agrega ese field.
    let errorCopy = { ...error };
    errorCopy.message = error.message;

    // 1) En caso de que el usuario busque por ejemplo un producto con un id invalido, en development puedo que ver que al enviar al cliente los fields del error (stack, error, meesage, etc), dentro del field de error, hay un field llamado CastError que es para esa clase de error de mongoDb al querer buscar un producto con un id invalido. El problema es que este error al pasar por appError.js, recibe el field de isOperational true, entonces aunque este en produccion, voy a ver el mensaje y status del error. Y en el mensaje voy a tener automaticamente un mensaje creado por mongoDb que es inentendible para el cliente. Asique entonces selecciono esta clase de error con IF y procedo a realizar un llamado a una funcion especifica que le envio el error y me va a dar como retorno un error con un mensaje mas entendible para el cliente y lo almaceno en la variable que cree antes.
    if (error.name === 'CastError') errorCopy = handleCastErrorDB(error);

    // 2) En caso de que el error contenga el field de code con cierto numero, este error es otro creado por mongoDb automaticamente cuando se intenta crear un documento con nombre duplicado. Asi que procedo a realizar lo mismo de arriba para que el cliente reciba una respuesta mas entendible en vez de el mensaje de mongoDb.
    if (error.code === 11000) errorCopy = handleDuplicateFieldsDB(error);

    // 3) En caso de que yo quiera crear por ejemplo un documento con un nombre menor a las 5 letras que especifique en el model, o por ejemplo quiera actualizar un tour con un nombre menor a esas 5 letras, o tenga cualquier derivado de los validators del model, entonces aca es donde me fijo si el error recibo tiene en el field de NAME, el nombre de 'ValidationError', le envio error y recibo como retorno el error con el mensaje detallado sobre que se hizo mal. De lo contrario como vengo diciendo en los anteriores pasos, se le enviaria al cliente solo "algo salio mal", cosa que con esto ya no pasa porque al pasar el error bien formateado por la class, voy a recibir el error con el mensaje bien optimizado, por ejemplo diciendo "Informacion invalida ingresada. El producto tiene que tener 5 o mas letras", y al darle isOperational TRUE se lo manda al cliente el mensaje y status.
    if (error.name === 'ValidationError')
      errorCopy = handleValidationErrorDB(error);

    // 4) En caso de que haya un error por ejemplo un usuario con un token invalido intenta ver los productos, entonces se produce un error en la libreria de JWT que se llama 'JsonWebTokenError', asi que para crear un error personalizado, llamo a la funcion de handleJWTError.
    if (error.name === 'JsonWebTokenError') errorCopy = handleJWTError();

    // 5) En caso de que haya un error por ejemplo un usuario con un token expirado intenta ver los productos, entonces se produce un error en la libreria de JWT que se llama 'TokenExpiredError', asi que para crear un error personalizado, llamo a la funcion de handleJWTExpiredError.
    if (error.name === 'TokenExpiredError') errorCopy = handleJWTExpiredError();

    // Finalmente le envio el error a la funcion de sendErrorProd que le envio la copia del error y el acceso a la respuesta para poder responder al cliente enviandole los detalles del error dependiendo de si el error es operational o no.
    sendErrorProd(errorCopy, req, res);
  }
};
