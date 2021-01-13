const sharp = require('sharp');
const multer = require('multer');
const Product = require('../models/productModel.js');
const catchAsync = require('../utils/catchAsync.js');
const factory = require('./handlerFactory.js');

// Aca almaceno las imagenes en la memoria como buffer, quedando en REQ.FILE.BUFFER
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

// una vez configurado MULTER, procedo a ajustar la informacion recibida, en este caso van a ser varias imagenes, asi que uso el metodo FIELDS y dentro le paso el nombre de los fields donde van a estar las imagenes, el primer field es el que va a tener la imagen principal del producto y aclaro que solo puede haber una imagen ahi y el segundo field va a contener 4 imagenes.
exports.uploadProductImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 4 },
]);

// En caso de que quisiera un solo field con varias imagenes, en vez de usar lo de arriba, seria asi
/*
exports.uploadProductImages = upload.array('images', 4)
*/

// Aca procedo a darle formato a las imagenes, primero entendiendo que las imagenes como son multiples se encuentran en REQ.FILES, esto va a contener dentro dos fields, por un lado imageCover que va a tener un array con un objeto dentro que tiene fields con los detalles de la imagen y el field mas importante es BUFFER que contiene la imagen almacenada en la memoria, despues por otro lado el segundo field de IMAGES, que dentro es un array y tiene un objeto por cada imagen subida y dentro este objeto tiene los detalles de esa imagen y nuevamente el field mas importante es BUFFER que contiene la imagen almacenada en la memoria. Si no hay imagenes recibidas procedo a pasar al siguiente middleware finalizando esta funcion. Caso contrario procedo a darle formato primero a la primera imagen en imageCover que si recuerdo bien es un array al que entro usando [0] y dentro selecciono el field de BUFFER.
exports.resizeProductImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Para las portadas de los productos
  // Creo el nombre de la foto del producto de forma dinamica. Colocando la fecha actual y un numero random entre 1 y 100, ya que aca al crear un producto no estoy recibiendo el id del mismo, asi que no puedo colocarlo en el nombre del producto. Eso solo seria valido cuando actualizo un producto, que en ese caso si tengo el id en el url y puedo colocar ${res.params.id}, aunque puedo if tambien para detectar si hay req.params en caso de estar actualizando el producto.
  const imageCoverFileName = `product-${
    Math.floor(Math.random() * 50000) + 1
  }-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${imageCoverFileName}`);

  // Agrego manualmente la foto en req.body para que en el siguiente middleware se reciba esta informacion y se coloque en la base de datos.
  req.body.imageCover = imageCoverFileName;

  // 2) Para las 4 imagenes del producto:
  // En req.files tengo el field de IMAGES que este es un array con un objeto por cada imagen, asi que aplico map para que por cada objeto que encuentro, le aplico la libreria de SHARP para darle formato. En este caso primero creo el nombre de la imagen donde utilizo el index que comienza desde 0 para darle a cada imagen un numero, teniendo desde el 1 hasta 4. Y procedo a darle formato a la imagen usando la libreria de SHARP. Y en este caso tengo que pasarle donde esta la imagen que en este caso le paso el objeto de la imagen y el field de BUFFER. Y recordar que en el model tengo el field de IMAGES que es un array, asi que para proceder a que se coloque esta informacion en la base de datos, procedo a crear primero el field de images en el body de la solicitud asi se envia cuando llega al siguiente middleware que crea el producto en la base de datos. Y por cada imagen encontrada al final le meto el nombre de la imagen que cree de forma dinamica. Algo importante es que al usar async/await, tras crearse cada imagen del producto y al haberle dado formato con sharp, y al haber usado MAP que si recuerdo bien retorna un nuevo array, cada vez que uso sharp con await retorno una promesa, entonces map recibe cada promesa y la almacena en un nuevo array que da como retorno asi que directamente para recibir todas las promesas juntas del array uso Promise.all() y await, de esa forma hasta que no se cumpla cada promesa del array, no procedo a pasar al siguiente middleware.
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (image, indx) => {
      const filename = `product-${
        Math.floor(Math.random() * 50000) + 1
      }-${Date.now()}-${indx + 1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/products/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

// Este es un middleware en caso de que se realice una solicitud a la url de los productos destacados, en este caso agrego varios fields en req.query ahorrando el tener que escribir toda la solicitud a mano poniendo cada field, etc y procedo a la siguiente funcion con next, la siguiente funcion es getAllProducts que procede a buscar los documentos en base a los fields que agregue en QUERY. En este caso quiero un limite de 4 productos, quiero los que tengan featured true, ordeno el precio de mayor a menor gracias al signo - y finalmente coloco los fields que quiero de los documentos, filtrando los demas. La solicitud a la api seria: api/v1/products/featured-products
exports.topProducts = (req, res, next) => {
  req.query.limit = '4';
  req.query.featured = 'true';
  req.query.sort = '-price';
  req.query.fields = 'name, price, _id, imageCover';
  next();
};

exports.getAllProducts = factory.getAll(Product);

exports.getProduct = factory.getOne(Product);

exports.createProduct = factory.createOne(Product);

// Llamo a la funcion de deleteOne dentro de handlerFactory.js y le paso el modelo del producto, esto me da como retorno la funcion de catchAsync donde se a atrapar un error en caso de haberlo, o a actualizar el documento en caso de que todo salga bien.
exports.updateProduct = factory.updateOne(Product);

// Llamo a la funcion de deleteOne dentro de handlerFactory.js y le paso el modelo del producto, esto me da como retorno la funcion de catchAsync donde se a atrapar un error en caso de haberlo, o a eliminar el documento en caso de que todo salga bien.
exports.deleteProduct = factory.deleteOne(Product);

// En este caso procedo a crear una funcion que en este cita el modelo de Product, le aplico aggregate, este a diferencia de find, me retorna un aggregate object en vez de una query object, y este aggregate es basicamente como usar find solo que en este caso me permite encadenar diferentes operadores para ir filtrando documentos, en este caso tengo que colocar primero un array y dentro un objeto por cada operador. El primero es para seleccionar los documentos cuyo precio sea mayor a 10000. Despues agrupo todos los documentos, es necesario el _ID, si coloco NULL simplemente se agrupan todos los documentos juntos que sean tengan precio mayores a 10000, pero si quiero por ejemplo crear diferentes grupos por las diferentes categorias coloco el field con un signo de $, esto me crea diferentes grupos por cada categoria. Despues con todos los documentos agrupados creo diferentes fields que dentro van a tener como valor el resultado de llamar a los operadores para obtener por ejemplo un promedio, en este caso para pasarle el promedio de que, tengo que pasar el field que quiero promediar pero con un signo de $, de esa forma recibo el precio promedio, tambien el precio minimo de todos los documentos y el precio maximo de todos los documentos. Y tambien al cantidad total de documentos usando el operador de SUM, en cada documento encontrado se le va a sumar uno al field de numProducts. Despues aplico SORT para ordenar los grupos colocando de menor a mayor los grupos en base al valor de maxPrice de cada uno (-1 si quiero poner primero los mas altos). Finalmente al usar await recibo finalmente las estadisticas de los documentos agrupados. Y los almaceno y envio en la variable de stats.
exports.getProductStats = catchAsync(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $match: { price: { $gte: 10000 } },
      // $match: { category: `${req.query.category}` } Si quiero filtrar en base a categorias que coloque en la solicitud, por ejemplo /api/v1/products/product-stats?category=Placa de video
    },
    {
      $group: {
        _id: '$category', // _id: null
        numProducts: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { maxPrice: 1 },
    },
    /*
      Puedo repetir el operador si quiero, en este caso filtro del resultado final, los documentos  que tengan el _id de category que especifique antes, con valor de 'Placa de video'
      {
        $match: {_id: { $ne: 'Placa de video' } }
      }
      */
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});
