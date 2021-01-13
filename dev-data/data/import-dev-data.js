const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Product = require('../../models/productModel.js');

// EXPLICACION: Aca procedo a realizar una importacion rapida de informacion en un JSON a la base de datos. Este codigo es util si quiero meter de forma rapida informacion a la base de datos de muchos productos. En este caso este codigo es independiente de la app, asi que la conexion a la base de datos se realiza una sola vez aca para poder

// 1) Lo primero que hago es usar la libreria de dotenv para leer las environment variables que tengo en config.env pasandole el objeto que dentro tiene el field de PATH y como valor, la ubicacion de config.env, con esto resuelto ya se establecen estas variables en PROCESS.ENV y puedo usarlas donde quiera
dotenv.config({ path: './config.env' });

// 2) Realizo la conexion a la base de datos usando async/await y try/catch, ya que el llamado a mongoose.connect da como retorno una promesa. Asi que con async/await puedo usar await para recibir la promesa y me evito el tener que usar THEN. Y de paso atrapo el error en caso de haberlo, con CATCH
const connectDB = async function () {
  try {
    await mongoose.connect(process.env.DATABASE, {
      useUnifiedTopology: true,
      useCreateIndex: true,
      useNewUrlParser: true,
    });
  } catch (error) {
    console.error(`hubo un error: ${error.message}`.red.bold);
    process.exit(1);
  }
};
connectDB();

// 1) Para leer el json y almacenar su contenido dentro de la variable uso el modulo de FS que ya viene integrado en NODE.JS y aplico el metodo para leer el archivo, y le paso la ubicacion del archivo usando __dirname que es una variable a la que tengo acceso y que construye la ubicacion desde la que se inicia la app (app.js) hasta donde se encuentra el archivo, despues especifico el tipo de encoding del archivo. De esa forma almaceno el array de objetos dentro de products, pero recordar que esta en JSON, asi que lo paso a javascript con JSON.parse
const products = JSON.parse(
  fs.readFileSync(`${__dirname}/products-simple.json`, 'utf-8')
);

// 2) Aca simplemente procedo a crear una funcion que usa el metodo CREATE y le paso dentro la variable que contiene el array de objetos de productos. Y por cada objeto dentro del array crea automaticamente un documento.
const importData = async () => {
  try {
    await Product.create(products);
    console.log('Informacion cargada exitosamente');
    process.exit();
  } catch (error) {
    console.log('Error al querer cargar la informacion');
  }
};

// 3) Este metodo es para eliminar todos los productos usando el metodo de deleteMany.
const deleteData = async () => {
  try {
    await Product.deleteMany();
    console.log('Informacion eliminada exitosamente');
    process.exit();
  } catch (error) {
    console.log('Error al querer eliminar la informacion');
  }
};

// 4) Aca es donde decido de forma dinamica que funcion ejecutar. PROCESS.ARGC equivale a las palabras que escribo en la terminal. Por ejemplo si coloco nodemon server.js, process.argv va a ser un array conteniendo primero detalles sobre node y segundo la ubicacion del archivo de server.js, pero si agrego algo mas como por ejemplo "--import", se agrega esto tambien al array, asi que procedo a detectar esto con IF, seleccionando el tercer elemento del array de PROCESS.ARGV, si me da --IMPORT, llamo a la funcion que importa y asi con la otra. Entonces cuando use en la terminal "node dev-data/data/import-dev-data.js --delete", al ejecutarse este archivo primero se conecta a la base de datos, despues lee el archivo json, las funciones y finalmente al llegar a aca decide que funcion ejecutar.
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
