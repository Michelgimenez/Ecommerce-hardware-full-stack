const crypto = require('crypto');
const User = require('../models/userModel.js');
const catchAsync = require('../utils/catchAsync.js');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError.js');
const Email = require('../utils/email.js');

// Aca creo el json web token, utilizando la libreria que importe, y aplico el metodo de SIGN para crear la signature, primero mando el payload que puede ser cualquier informacion, en este caso mando el id del usuario que recibi al ser llamada esta funcion, enviando el field ID y dandole como valor, el id del nuevo documento creado o del usuario que quiere iniciar sesion. Despues prosigue el secreto que puede ser cualquier string, en este caso es una string que cree en config.env. Y paso un tercer argumento que es para opciones, en este caso defino la fecha de expiracion del token que tambien almaceno en config.env
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Creo esta funcion no repetir mil veces la response en cada funcion. Asi que aca recibo el objeto del usuario para poder acceder a su id y enviarselo a la funcion que crea el token, recibo el stausCode para crearlo de forma dinamica y recibo la response asi puedo enviar la response. Una vez creado el token voy a atar a la respuesta una cookie, le asigno el nombre, le doy como valor el token y le paso la opcion de cuando expira la cookie, en este caso le creo una fecha que va a contener la fecha actual pero sumandole el tiempo que tengo en JWT_COOKIE_EXPIRES_IN, la segunda opcion es para la cookie solo en HTTPS (secure true, que en este caso la agrego a las opciones solo si me encuentro en production), y finalmente httpOnly para que el navegador no pueda manipular de ninguna forma la cookie.
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // Para no mostrar en el output la password del usuario por ejemplo al crear un nuevo usuario
  user.password = undefined;

  // Envio el nuevo usuario creado y el token creado que es para que automaticamente este logueado tras registrarse.
  res.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // 1) Especifico los fields que van a ser enviados al crear el documento, de esa forma no permito que cualquier persona pueda crear un usuario que tenga ADMIN TRUE, ya que filtro aca ese field. De esa forma solo puedo crear el admin desde mongoDb compass agregando ese field
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // 2) Creo una variable para el url que en este caso va a ser /ME, lo creo de forma dinamica detectando la url en la que se realizo la solicitud, detectanto el protocolo (http/https), el host (localhost/nexustienda.com)
  const url = `${req.protocol}://${req.get('host')}/me`;

  // Llamo a la class que crea y envia el email, esta espera por un lado el objeto del usuario que lo almacene en newUser y por otro lado el url que quiero pasar el email que en este caso esta en la variable. Tras haber llamado a la class, esta retorna un objeto que hereda todos los metodos de la class, asi que sobre este retorno encadeno el llamado al metodo heredado de sendWelcome que es el que envia el email de bienvenida utilizando los detalles del usuario y URL que pase tras llamar a la class. Uso await ya que sendWelcome es ASYNC y para que hasta que no se mande el email y se cumpla la promesa, no se proceda a crear y enviar el token nuevo.
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Chequeo si el email o la clave existen, caso contrario creo un error con la class de AppError atraves de next para que se vaya directo al middleware global y uso return para que este codigo finalice aca.
  if (!email || !password) {
    return next(new AppError('Por favor introduzca su email y su clave', 400));
  }

  // 2) Chequeo si el usuario existe en la base de datos simplemente buscando en la base de datos el documento cuyo field de email es igual al email que extraje del body de la solicitud. Y procedo a recuperar el field de password con SELECT usando el signo +, ya que en el model quite del output la password encriptada para por ejemplo cuando busco el documento de todos los usuarios.
  const user = await User.findOne({ email: email }).select('+password');

  // 3) En el modelo del usuario cree un instance method que este se puede ejecutar en todos los documentos de los usuarios, en este caso en la variable de user tengo el documento del usuario que encontre que coincidia el email con el email enviado en el login, asi que puedo aplicarle el metodo de correctPassword al cual le envio la clave ingresada por el usuario y la clave del documento para que las compare. Esto da como retorno true/false, uso IF para verificar que si las claves no coinciden (false pasado a true con !) o si el usuario no fue encontrado en la base de datos, entonces creo el error con la class y lo paso a next para que vaya al middleware global. Si el usuario existe seria true, y pasa a false con !, asi que se chequea la segunda coindicion, si coinciden da true, pasa a false asi que no se cumple ninguna de las dos condiciones y no se ejecuta el error.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError('El email o la clave ingresada es incorrecta', 401)
    );
  }

  createSendToken(user, 200, res);
});

// Para cerrar la sesion del usuario, simplemente procedo a llamar este metodo que procede a reemplazar la cookie del navegador que es la que utilizo para el login y la reemplazo por una donde el contenido de la cookie de JWT para hacer simplemente una string que diga sesion cerrada, y le paso como tercer argumento la opcion de httpOnly para que no se pueda manipular el token.
exports.logout = catchAsync((req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Verifico que el usuario este logueado, que tenga un TOKEN. Esto es asi, el usuario al enviar la solicitud, a traves de los headers envia algo llamado authorization y dentro esto tiene un valor llamado Bearer, que esta string contiene el token: Bearer ldnfvkldf23443. Entonces lo que haho es corroborar que en la solicitud hayan headers, que el header se llame authorization y que el valor de este comience con Bearer, entonces en ese caso procedo a darle como valor a la variable de token, un filtrado que hago con split donde separo el valor de authorization donde hayan espacios, esto me da un array teniendo por un lado Bearer y por el otro el token, asi que selecciono [1] que seria el token en el array. O tambien la otra opcion es que cuando inicia sesion el usuario, se almacena en las cookies el token, asi que para verificar si tiene el token,procedo a chequear si hay algo en req.cookies.jwt, ya que las cookies van a estar en cada solicitud del usuario y dentro esta el field de JWT que tiene el token, si hay algo lo almaceno en la variable TOKEN. Si no se encuentra ningun token procedo a usar IF para crear un error con la class y enviarlo con NEXT() para que vaya al middleware global
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'Por favor inicie sesion para tener acceso a esta pagina',
        401
      )
    );
  }

  // 2) Valido el token, para realizar esto uso la libreria de JWT y aplico el metodo de verify() donde le paso el token para que de este extraiga la payload que es el id del usuario, y le tengo que pasar la clave secreta. El resultado lo almaceno en decoded, esto va a tener la payload del token decodificada, conteniendo el id del usuario y la fecha de expiracion que le asigne al token cuando se crea por ejemplo al iniciar sesion o registrarse un usuario. Basicamente estoy comparando el token creado al iniciar sesion/registrarse con el token recibido al realizar esta solicitud para por ejemplo ver los productos. Si el usuario cambiara el id en la payload, el token seria diferente, por lo tanto verify daria un error porque los tokens son diferentes. Y este error es atrapado en catchAsync y enviado al global error handler
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Verifico si el usuario existe en la base de datos usando la variable de decoded que contiene el payload del token decodificado y esto tiene dentro el id del usuario. Asi que lo uso para buscarlo en la base de datos. Si no encuentro el usuario doy un error. Por ejemplo se inicia sesion, se crea el token pero elimino el documento, entonces al realizar una solicitud con ese token, no se va a encontrar el documento del usuario.
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('El usuario al que pertenecia el token no existe', 401)
    );
  }

  // 4) Verifico si el usuario cambio la contrasena despues de haberse creado su TOKEN. Para hacerlo llama al instance method que cree en el modelo del usuario que puedo llamarlo ya que la variable currentUser contiene dentro el documento del usuario asi que tengo acceso al instance method, y procedo a enviarle la fecha en la que se creo el token que se encuentra en la variable que tiene la payload del token decodificada. Si recibo como retorno TRUE significa que se cambio la clave despues de haberse creado el token, asi que creo un error que atrapa el global error handler
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'El usuario cambio recientemente la clave. Por favor inicie sesion de nuevo',
        401
      )
    );
  }

  // En la solicitud agrego field llamado user donde coloco ahi el documento del usuario para poder usarlo en el proximo metodo que seria por ejemplo donde obtengo todos los productos. Esto es clave para usarlo por ejemplo en el middleware de restrictTo donde se accede a req.user.role, y tambien almaceno el usuario dentro de req.locals, asi de esa forma en el template de /ME que es una ruta protegida, tiene acceso a la variable USER y puedo usar los detalles de la informacion del usuario.
  req.user = currentUser;
  res.locals.user = currentUser;

  // 5) Si todo salio bien, procedo al siguiente metodo que seria por ejemplo getAllTours ya que este middleware se ejecuta antes para proteger la ruta que da todos los tours.
  next();
});

// La idea de este metodo es para verificar que los usuarios estan logueados constantemente en el front-end, de es forma se si renderizar el boton de iniciar sesion/registro o mostrar la foto de perfil del usuario con su nombre. Aca no uso catchAsync porque por ejemplo cuando cierro sesion reemplazo la cookie del token JWT por una string, y al ejecutarse esta funcion detecta que hay una cookie y procede a verificarla en donde hago JWT.VERIFY(), esto produce un error que seria atrapado por catchAsync y mandado al global error handler que cerraria el servidor, cosa que no quiero asi que lo saco y directamente pongo un try/catch dentro del IF para que si hay un error directamente lo atrapo y paso al siguiente middleware con RETURN NEXT()
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verifico que el token sea valido
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

      // 2) Verifico si existe un documento de usuario con el id obtenido del payload del token decodificado
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Corroboro si el usuario cambio la contrasena recientemente
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // Si todo sale bien, significa que el usuario esta logueado, asi que procedo a almacenar el objeto del usuario en el field de locals de la respuesta asi mi template tiene acceso a esta informacion, teniendo acceso a la variable de USER
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }

  // Si no hay ninguna cookie no hay ningun usuario con sesion iniciada, asi que directamente no se cumple el IF y procedo a llamar a next()
  next();
};

// En restrictTo dentro tengo una funcion que recibe primero el rol del usuario ('admin') y al ejecutarse da como retorno el middleware que dentro almacena en una variable el resultado de ver si el rol recibido en la primera funcion, es igual al rol que tengo que en req.user.role (si este es 'user' entonces da FALSE, se pasa a TRUE con ! en el IF) y en caso que no, creo un error dentro del IF, si no, prosigo por ejemplo con NEXT() a eliminar el producto.
exports.restrictTo = (role) => {
  return (req, res, next) => {
    const permission = role === req.user.role;

    if (!permission) {
      return next(
        new AppError('No tenes permiso para ejecutar esta accion', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Busco el usuario que coincida con el email enviado en la solicitud, si no se encuentra el documento, envio un error.
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No existe un usuario con ese email', 404));
  }

  // 2) Genero un token aleatorio llamando al instance method que como se, esta disponible en los documentos de los usuarios. Este crea un token que encripta en el documento del usuario y retorna uno sin encriptar que almaceno en esta variable. Y para que se apliquen los cambios que se realizaron en createPasswordResetToken (crear el token en el documento y la fecha de expiracion del token), aplico el metodo SAVE sobre el documento del usuario y para que no salte un error de validadores, ya que en el model especifique que para actualizar un documento, tengo que enviar email/password, paso una opcion para desactivar los validators antes de guardar el documento.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // 3) Le envio el email con el token sin encriptar al usuario. El proceso es el siguiente primero creo una variable donde armo el url de forma dinamica a la que el usuario tiene que realizar la solicitud para poder resetear su clave. Primero obtengo el protocolo de la solicitud, por ejemplo http/https, despues obtengo el host, que es donde se encuentra la pagina localizada, en development esto equivale a localhost:3000 pero cuando suba la pagina esto va a equivaler a el host donde se va a encontrar mi pagina, es por eso que armo el url de forma dinamica, despues el resto es el url de la api y finalmente el token sin encriptar que almacene en resetToken.
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // Aca finalmente llamo a la class que la llamo enviandole el usuario y el url donde va a restaurar su clave, esto me da como retorno el objeto que hereda los metodos de la class, asi que paso a encadenar sobre este, el llamado al metodo heredado de la class que crea el template y envia el email con el url para restaurar la clave al usuario uso AWAIT para que recien al terminar esta funcion, envie la respuesta exitosa al usuario. Uso try/catch porque al haber un error, seria atrapado por catchAsync y enviado al global error handler dando por finalizada esta funcion, pero yo preciso hacer mas cosas asi que para poder hacerlas uso try/catch para atrapar el error y proceder a seleccionar el documento del usuario y actualizar el field del token encriptado y la fecha de expiracion pasandolos a UNDEFINED. Y aplico SAVE para que se actualice el documento y finalmente creo el error personalizado.
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token enviado al email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('Hubo un error al enviar el email. Intente de nuevo', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) En la solicitud que ejecuta este metodo, el usuario envia su token sin encriptar, asi que yo procedo a encriptarlo usando la libreria de crypto de node.js y el algoritmo sha256 y le paso el token que se encuentra en los parametros de la solicitud y que se llama TOKEN como especifique en userRoutes.js y lo almaceno en una variable. De esta forma procedo a buscar el usuario cuyo field de p (que contiene el token encriptado) equivalga al token que encripte en hashedToken y cuyo field de passwordResetExpires sea mayor a la fecha actual, de esa forma se que no expiro. Si no se encuentra ningun usuario significa que el token expiro.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('El token es invalido o ya expiro', 400));
  }

  // 2) Finalmente actualizo la clave del usuario, envio la clave confirmada ya que la requiere el user model por los validadores y actualizo los fields que tenian el token encriptado y la fecha de expiracion, pasandolo a undefined asi ya no se ven en la base de datos. Y finalmente aplico los cambios con save()
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Actualizo el field de changedPasswordAt del documento del usuario (esto pasa dentro del user model)

  // 4) Logueo nuevamente al usuario llamando al metodo que crea el token y lo almacena en la variable y lo envia en la respuesta
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Primero procedo a buscar el documento del usuario cuyo id coincida con el enviado en el objeto de user en la solicitud, que tengo acceso a ello ya que esta ruta es solo para usuarios autenticados, asi que user esta en la solicitud. Y especifico que quiero incluir la password en el documento ya que en el schema dije que no quiero la password en el output.
  const user = await User.findById(req.user.id).select('+password');

  // 2) Uso un if donde dentro uso el instance method de correctPassword sobre este documento y le paso la clave enviada en la solicitud y la clave del documento del usuario para que las compare y en caso de que no coincidan entonces creo un error.
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Tu clave actual es incorrecta', 401));
  }

  // 3) Modifico finalmente la password del usuario en el documento y uso SAVE() para aplicar los cambios
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Finalmente inicio la sesion nuevamente creando el token
  createSendToken(user, 200, res);
});
