const catchAsync = require('../utils/catchAsync.js');
const User = require('../models/userModel.js');
const AppError = require('../utils/appError.js');
const factory = require('./handlerFactory.js');
const multer = require('multer');
const sharp = require('sharp');

// Aca ajusto que voy a almacenar la informacion en el disco duro, localmente, y esto tiene que tener dentro un objeto con opciones, en este el destino donde va a almacenar la foto, este field como dicta la documentacion, va a tener una funcion dentro que recibe la solicitud, el archivo enviado y una callback function, y finalmente procedo a llamar la callback que en este caso no hay error asi que le paso NULL, y finalmente la ubicacion a almacenar la foto. Despues repito el mismo procedo pero para darle un nombre a la foto antes de subirla. En este caso procedo a utilizar el archivo que recibo en la funcion dentro de filename, este objeto contiene varios fields, voy a seleccionar el de MIMETYPE que contiene el tipo de imagen subida (image/jpeg, ETC), lo divido en donde esta el '/' y procedo a seleccionar de esa extension la segunda string (jpeg), despues en la callback procedo a crear el nombre de la imagen, primero le doy USER, despues el id del usuario que proviene del field de user en la solicitud a la que tengo acceso, despues coloco la fecha actual y finalmente la extension que extraje. USO ESTO EN CASO DE QUE NO QUIERA PROCESAMIENTO DE IMAGEN CON SHARP, EN ESE CASO DEBERIA DEJAR COMENTADO LA PARTE DE SHARP Y LA DE MULTER.MEMORYSTORAGE()
/*
const multerStorage = multer.diskStorage({
  destination: (req, file, callb) => {
    callb(null, 'public/img/users');
  },
  filename: (req, file, callb) => {
    const extension = file.mimetype.split('/')[1];
    callb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
  },
});
*/

// Aca almaceno la imagen en la memoria como buffer, quedando en REQ.FILE.BUFFER
const multerStorage = multer.memoryStorage();

// La idea aca es filtrar extensiones que no sean de imagenes, asi que procedo a crear una funcion que recibe la solicitud, el archivo y la callback, y dentro procedo a fijarme en file.mimetype que en este caso si se sube una imagen este siempre va a comenzar con IMAGE (image/jpg, image/png), en ese caso llamo a la callback sin ningun error y pasandole TRUE, caso contrario llamo a la callback pasandole un error creado con AppError y pasandole FALSE.
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'El archivo no es una imagen, por favor solo suba imagenes',
        400
      ),
      false
    );
  }
};

// Inicializo la libreria de multer y paso como opciones primero el field que define el storage de las imagenes y como segundo field el filtrador.
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Utilizo el metodo single sobre la variable que inicializo la libreria de multer, esto es para aclarar que subo fotos singulares. Y dentro aclaro el field que va a contener la imagen tras enviarla en el formulario y la va a tomar y mandarla a la carpeta que asigne como destino. A su vez llamar a upload.single() va a crear informacion en la request agregando el field de FILE que va a contener toda la informacion de la foto enviada en el formulario (req.file), y se va a crear la imagen en la carpeta asignada y con el nombre con el formato que le di arriba.
exports.uploadUserPhoto = upload.single('photo');

// En caso de una subida yo voy a tener en la request, el field de file, pero en caso de que no se suba ninguna foto procedo a pasar al siguiente middleware. Y procedo a usar la libreria de SHARP donde selecciono la imagen que almacene en el buffer, esto retorna un objeto al cual puedo aplicarle diversos metodos para darle formato a la imagen, en este caso la resolucion la disminuyo a 500 de ancho y alto (corta un poco la imagen para que encaje bien en esa resolucion). Despues le cambio la extension a JPEG, procedo a comprimir un poco la imagen con el metodo de JPEG pasandole la opcion de que calidad quiero. Y finalmente le paso ubicacion donde quiero almacenar la imagen en el disco. Que para esto creo un field en req.file llamado filename y creo el nombre de forma dinamica, teniendo el id del usuario y la fecha actual. Y finalmente procedo al siguiente middleware que seria updateMe.
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// la funcion de filterObj, esta recibe por un lado el body de la request, y por el otro uso spread para recibir todo lo demas, que eso hace que se almacenen en un array teniendo strings por cada argumento pasado ['name', 'email'], Y procedo a usar Object.keys pasandole el req.body, esto da como retorno un array con todos los nombres de los fields dentro de req.body, asi que a este output voy a loopearlo con forEach y en cada loopeo, uso IF para chequear que si en el array de allowedFields hay alguna string que coincida con el elemento en el que me encuentro loopeando, entonces lo agrego al objeto vacio que tengo en newObj de la siguiente manera, selecciono newObj y le creo un field cuyo nombre va a ser el elemento (newObj[el] = newObj[name]), por ejemplo NAME, y le voy a dar de valor, el resultado de obj[el] (obj[el] = obj[name] = 'michel'), esto equivale por ejemplo a hacer obj[name], esto me da como retorno por ejemplo 'michel'. Y finalmente doy como retorno ese objeto para usarlo para actualizar el usuario. Teniendo por ejemplo {name: 'michel', email: 'michelgimenezbaston@gmail.com'} y este retorno se almacena en filteredBody.
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const allUsers = await User.find();

  res.status(201).json({
    status: 'success',
    results: allUsers.length,
    data: {
      users: allUsers,
    },
  });
});

// Este metodo se usa por ejemplo cuando el usuario quiera recibir su informacion solicitandola a /ME, en ese caso antes primero se ejecute PROTECT para colocar el objeto del usuario logueado dentro de la solicitud, despues se ejecuta el metodo getMe(este) para agregar el parametro de ID en la solicitud y darle como valor, el id del objeto del usuario que agregue en la solicitud con PROTECT, y procedo finalmente a llamar a getOne que va a obtener la informacion especifica de ese usuario.
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// En las aplicaciones se suele colocar la actualizacion de datos del usuario de forma separada a la actualizacion de las claves.
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Lo primero es verificar que no se esten enviando claves en el cuerpo de la solicitud, ya que en ese caso doy un error.
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'Esta ruta no es para actualizar las claves, por favor use /updateMyPassword',
        400
      )
    );
  }

  // 2) Procedo a actualizar el documento del usuario buscandolo por el id que tengo en el objeto de user de la solicitud y le paso la informacion a actualizar en este caso va a ser una variable que contiene de la solicitud solo los fields de name/email/photo(photo lo agrego en el IF donde verifico que en la solicitud este el field de FILE que se crea por multer cuando subo fotos, y agrego manualmente el field de photo en la variable de filteredBody y le paso como valor, el nombre de la foto) de esa forma evito que se pueda enviar atraves de aca el field de ROLE. Y finalmente opciones, en este caso NEW representa que quiero retornar el nuevo documento actualizado y runValidators para que se ejecuten los validators para el email y el nombre. Y ademas uso findByIdAndUpdate ya que este hace que no se ejecute el validator que tengo personalizado para la confirmacion de la clave, de esa forma no se me va a exigir por ejemplo confirmar la clave.
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser: updatedUser,
    },
  });
});

// Cuando un usuario decide eliminar su cuenta simplemente actualiza el field de active de true a false.
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = factory.getOne(User);

// Esta funcion es solo para administradores, para que puedan actualizar los nombres/emails de otros usuarios.
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
