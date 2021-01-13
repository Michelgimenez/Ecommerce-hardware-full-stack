const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');

//
const productRouter = require('./routes/productRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes.js');
const orderRouter = require('./routes/orderRoutes.js');

// 0) Inicio la aplicacion
const app = express();

// 1) Uso SET() para configurar/establecer algo, en este caso el engine que voy a utilizar para enviar los templates del usuario asi que primero aclaro que voy a establecer el engine y despues aclaro cual va a ser el engine. Despues procedo a configurar las views, aclarando primero views y despues la ubicacion donde van a estar usando el modulo de PATH donde voy a unir __dirname que contiene la ubicacion donde se inicia la aplicion y me crea automaticamente todo el path hasta la carpeta de views que es donde se encuentran los templates. Esto equivaldria a decir './views', la forma ideal es usando path ya que aveces la app puede iniciarse desde otro lado y con esto creo automaticamente el path correcto.
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.options('*', cors());

// 1) MIDDLEWARES:

// Aca creo un middleware usando dentro express.static para establecer la ubicacion de donde van a estar mis archivos estaticos (css, imagenes, videos, js, etc), en este caso la carpeta de PUBLIC, de esa forma al enviar un template por ejemplo de la pagina principal, cuando se realice la solicitud del style.css, este se va a buscar dentro de la carpeta de public
app.use(express.static(path.join(__dirname, 'public')));

// Dentro de app.use llamo a helmet y esto da como retorno una funcion que va a esperar hasta ser llamada en el stack de middlewares. Agrega headers en la solicitud que agregan mas seguridad a la aplicacion para evitar ataques externos.
app.use(helmet());

// Apartir de una actualizacion en los navegadores como chrome, es necesario que realice una configuracion enviando headers especificos a traves de la solicitud, en este caso estos headers con para aclararle a chrome ciertas fuentes externas que voy a utilizar y avisarle que son seguras. Por ejemplo gracias a este codigo voy a poder solicitar los iconos al CDN de ionicon
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    },
  })
);

// En este caso uso un middleware externo, llamando a la funcion de morgan y dentro le paso la opcion de DEV, que tras cada solicitud se va a ejecutar mostrando en la consola los detalles sobre la solicitud realizada.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Utilizo el metodo de rateLimit que importe de la libreria de express-rate-limit donde paso las opciones de la cantidad de solicitudes que voy a aceptar, en este caso 100, y el tiempo, en este caso 1 hora. Y el mensaje que voy a enviar tras superarse ese 100 por hora. Lo que se almacena ahora en limiter es un middleware creado en base a las opciones que di, y procedo a usarlo como middleware con app.use, y especifico que la ruta a la que aplico el middleware es /api, de esa forma afecta todas las rutas que comiencen con /api
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Demasiadas solicitudes, por favor intente de nuevo en una hora',
});
app.use('/api', limiter);

// Para que al publicar nuevos productos, pueda leerse la informacion que proviene del body de la request, utilizo un middleware con app.use y dentro coloco el middleware que es express.json(), de esa forma ahora puedo leer la informacion que llega en el body de las solicitudes. Basicamente ahora tengo acceso a REQ.BODY. Lo que paso dentro de JSON es para limitar el tamano de lo que se recibe en el body de la solicitud. Lo que supere los 10kb no va a ser aceptado.
app.use(express.json({ limit: '10kb' }));

// Este middleware es para poder leer la informacion proveniente de un formulario que viene en formato de urlencoded, la opcion de extended es para poder manejar informacion mas compleja, y limit para limitar la informacion ingresada en el formulario. Y asi puedo leer la informacion enviada en el formulario cuando el usuario ajusta sus datos como el nombre/email, etc.
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Aca utilizo como middleware el llamado a la libreria de cookie-parser que procede a leer las cookies que hay en el navegador, esto es extremadamente util para cuando el usuario inicia sesion y se almacenan las cookies en el navegador, de esa forma en cada solicitud que haga puedo leer las cookies que contienen el json web token.
app.use(cookieParser());

// Limpio la informacion recibida en la aplicacion para evitar inyecciones de codigo malicioso (noSQL), llamo a la libreria y me da como retorno un funcion que la voy a usar como middleware. Busca en req.body, req.params, req.query y filtra signos como $ o puntos o signos raros.
app.use(mongoSanitize());

// Limpio la informacion recibida en la aplicacion para evitar ataques XSS. Limpia los inputs del usuario por ejemplo si intenta inyectar codigo html con javascript en el y se inyectaria en el html de mi pagina. Con este middleware lo evito (la funcion que se retorna al llamar a xss).
app.use(xss());

// Aca limpio las query de la solicitud. Por ejemplo si el usuario envia products?sort=price&sort=duration, esto produciria un error ya que la idea es products?sort=price,rating, etc. Y whitelist es para los fields que si puedo colocar repetidas veces, por ejemplo /products?sort=100&sort=25000 para obtener productos que tengan precio entre 100 y 25000
app.use(
  hpp({
    whitelist: 'price',
  })
);

// Este middleware comprime el texto y el json enviado al usuario en cada solicitud
app.use(compression());

// Creo otro middleware, en este caso paso dentro la funcion que quiero ejecutar en este middleware. Y para los middlewares, en esta callback function tengo acceso a next (puedo darle el nombre que quiera), que es para proceder al siguiente middleware. Este middleware se va a ejecutar tras cada request siempre y cuando se encuentre aca arriba de todo, antes de las request.
app.use((req, res, next) => {
  console.log('hola');
  next();
});

// 3) ROUTES: Aca uso el middlewares ya que uso app.use, y estoy diciendo que cuando se realice una solicitud al url a "/api/v1/products", que se ejecute la funcion que importe de productRouter que se encarga de proveer informacion, crear/eliminar en base al tipo de solicitud. Lo mismo aplica para los usuarios. Lo que estoy haciendo es montar un router en una ruta especifica. Una vez ejecutada la ruta, se ejecuta el router que dentro verifica dentro que ruta se ejecuto, por ejemplo si /api/v1/products, o /api/v1/products/:id y en base al tipo de solicitud(get, post, delete, etc), procede a ejecutar la funcion correspondiente de los controladores
app.use('/', viewRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/orders', orderRouter);

// 4) Aca uso este middleware al que se va a llegar en caso de que ninguno de los middlewares de arriba haya captado la ruta a la que se haya ingresado. Por ejemplo /api/products, en ese caso es un url erroneo, asi que procedo a aplicar ALL para que esto sriva para todas las operaciones CRUD. Despues uso '*' para que sea para cualquier URL que no sea captado en los middlewares de arriba. Y despues tengo la callback function que al ser un middleware tiene acceso a next. Y procedo a crear un nuevo error llamando a la class que cree que se encarga de crear los errores y le envio el statusCode el error y el mensaje personalizado, y de esa forma recibo como retorno el error que envio atraves de NEXT(). Al enviarlo a traves del next, aunque no sea un error lo que envie(en este caso si lo es), basicamente se saltean todos los middlewares y se envian directamente al middleware global de errores, en este caso el que cree abajo que tiene los 4 argumentos, este recibe el error y da la respuesta al cliente.
app.all('*', (req, res, next) => {
  next(
    new AppError(
      `No se pudo encontrar ${req.originalUrl} en este servidor`,
      404
    )
  );
});

// Para crear un middleware que se encarga de atrapar errores globalmente en la aplicacion, simplemente agrego otro argumento en la callback function ademas de next, el argumento de error, teniendo finalmente 4. Y al recibir el error por ejemplo del middleware de arriba. Cualquier error que se cree y se envie atraves de NEXT(), por ejemplo el middleware de arriba que es para cuando alguien ingresa una ruta que yo no especifique en la api, ahi se crea un error y se envia atraves de NEXT(), entonces ahi automaticamente se ejecuta este middleware que recibe ese error y se lo manda a la funcion de globalErrorHandler que se encarga de darle formato al error para que lo vea el cliente de forma prolija.
app.use(globalErrorHandler);

module.exports = app;
