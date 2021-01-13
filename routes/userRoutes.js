const express = require('express');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authControlller.js');

const router = express.Router();

//
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Apartir de esta parte, todo lo de abajo require que el uusario este como minimo autenticado, entonces para no repetir ese codigo una y otra vez, uso router.use() para colocar un middleware que se va a ejecutar sobre cada ruta, en este caso va a ser el metodo que se fija si el usuario esta autenticado
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
// Este ruta se usa cuando el usuario logueado quiera recibir su informacion solicitandola a /ME, en ese caso antes primero se ejecute PROTECT para colocar el objeto del usuario logueado dentro de la solicitud, despues se ejecuta el metodo getMe para agregar el parametro de ID en la solicitud y darle como valor, el id del objeto del usuario que agregue en la solicitud con PROTECT, y procedo finalmente a llamar a getOne que va a obtener la informacion especifica de ese usuario.
router.get('/me', userController.getMe, userController.getUser);

// Aca antes de actualizar la informacion del usuario, utilizo el metodo uploadUserPhoto. Que se encarga de recibir la foto del formulario y colocar su informacion dentro de req.file, ademas de subirla a la carpeta que destine en userController.js
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// Apartir de esta parte, todo lo de abajo require que el uusario sea administrador, entonces para no repetir ese codigo una y otra vez, uso router.use() como hice antes para colocar un middleware que se va a ejecutar sobre cada ruta, en este caso va a ser el metodo que se fija si el usuario tiene de rol ADMIN
router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
