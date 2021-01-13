// En este archivo inicio el servidor y me conecto a la base de datos

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const colors = require('colors');

// Para resolver un error que decia que usar useFindAndModify ya es viejo.
mongoose.set('useFindAndModify', false);

// Aca atrapo errores por ejemplo si intento mostrar en la consola una variable que no defini, por ejemplo console.log(x), esto genera un objeto llamado uncaughtException al cual voy a escuchar y responder finalizando la aplicacion. Va arriba de todo ya que si el error ocurre antes de este codigo, osea arriba, este codigo no lo atrapa. Por eso va aca, asi cualquier error debajo es atrapado (por ejemplo en app.js, etc).
process.on('uncaughtException', (error) => {
  console.log(error.name, error.message);
  console.log('uncaughtException - Cerrando servidor... 🧨🧨🧨');
  process.exit(1);
});

// 0) Lo primero que hago es usar la libreria de dotenv para leer las environment variables que tengo en config.env pasandole el objeto que dentro tiene el field de PATH y como valor, la ubicacion de config.env, con esto resuelto ya se establecen estas variables en PROCESS.ENV y puedo usarlas donde quiera
dotenv.config({ path: './config.env' });

// 1) Importo el modulo que exporte en app.js que contiene la aplicacion inicializada con express.
const app = require('./app.js');

// 2) Realizo la conexion a la base de datos usando async/await y try/catch, ya que el llamado a mongoose.connect da como retorno una promesa. Asi que con async/await puedo usar await para recibir la promesa y me evito el tener que usar THEN. Y de paso atrapo el error en caso de haberlo, con CATCH y uso process.exit(1) para finalizar la aplicacion.
const connectDB = async function () {
  try {
    const connect = await mongoose.connect(process.env.DATABASE, {
      useUnifiedTopology: true,
      useCreateIndex: true,
      useNewUrlParser: true,
    });

    console.log(
      `Conexion exitosa a la base de datos. El host es: ${connect.connection.host}`
        .cyan
    );
  } catch (error) {
    console.error(`hubo un error: ${error.message}`.red.bold);
    process.exit(1);
  }
};
connectDB();

// 3) Defino el puerto donde escucho al servidor en modo desarrollo
const port = process.env.PORT || 3000;

// 4) Comienzo el servidor usando LISTEN sobre la variable que contiene la inicializacion de la aplicacion y que importe de app.js y procedo a pasar el puero que voy a asignarle, en este caso 3000
const server = app.listen(port, () => {
  console.log(`Servidor iniciado en el puerto ${port}`);
});

// En caso de que haya una promesa rechazada en alguna parte de mi aplicacion, por ejemplo donde me conecto con mi base de datos, aunque ahi ya lo solucione con try/catch (la mejor practica), pero en ese caso el objeto de process va a emitir un objeto llamado unhandledRejection, asi que uso el metodo de ON() para escuchar a ese evento cuando suceda y ejecuto una callback function que recibe el error.  Antes de finalizar la aplicacion muestro en la consola un mensaje personalizado y detalles del error y procedo a cerrar el servidor de forma suave con close() para que primero se espere a terminar todas las solicitudes pendientes y despues se cierre el servidor, y despues una vez se cierre, se ejecute la funcion que finaliza la aplicacion con process.exit(1). Este va aca debajo de todo porque si lo coloco arriba de todo, la variable de server todavia no fue definida y no voy a poder cerrar el servidor como quiero.
process.on('unhandledRejection', (error) => {
  console.log(error.name, error.message);
  console.log('unhandledRejection - Cerrando servidor... 🧨🧨🧨');
  server.close(() => {
    process.exit(1);
  });
});
