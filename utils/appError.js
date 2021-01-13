// Creo una nueva class que al extenderse de la class de Error de ES6, tiene acceso a diversos metodos de la class de Error. Al extender por supuesto para poder llamar al constructor, necesito llamar a SUPER(). Y a traves de SUPER() es donde llamo a la clase que estoy extendiendo (Error) y le paso lo unico que acepta, en este caso el mensaje y como retorno recibo la propertie de message, es como hacer this.message = message. SUPER() es basicamente llamar a la class de Error. Creo los fields de la class, donde statusCode equivale al statusCode que recibi en la solicitud (404 por ejemplo), y debajo creo otro field llamado STATUS que dependiendo de si el statusCode comienza en 4 (uso template string para pasar el numero a string, de esa forma puedo aplicarle el metodo de startsWith), entonces el status va a ser fail, caso contrario va a ser error. El field de isOperational es para aclarar que este error seria por ejemplo si el usuario crea un producto con nombre mal, etc, son errores opecionales, errores predecibles. captureStackTrace es para no agregar todo el stack que muestro todo el detalle donde se origino el error, y le tengo que pasar el objeto(this) y la class de AppError(this.constructor). Basicamente oculto del output todo el stack que detalla el error, para seguridad, de esa forma los hackers tienen menos detalles sobre el back-end y no tienen chance de acceder a informacion privada.
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
