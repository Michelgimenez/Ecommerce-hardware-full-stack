const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El usuario tiene que tener un nombre'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El usuario tiene que tener un email'],
      trim: true,
      unique: [true, 'Ya existe un usuario con este email'],
      lowercase: true, // Deja en minusculas el email
      validate: [validator.isEmail, 'Por favor ingrese un email valido'], // Uso la libreria de validator para seleccionar el validador de email que corrobora que se ingrese un email.
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'El usuario tiene que tener una clave'],
      trim: true,
      minlength: [
        10,
        'La clave tiene que tener como minimo 10 caracteres ya que las claves mas seguras no son las que mezclan diferentes caracteres, son las mas largas.',
      ],
      select: false, // Con esto no se va a mostrar en el output enviado al cliente por ejemplo cuando busca todos los documentos de los usuarios
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Por favor confirme su clave'],
      trim: true,
      validate: {
        validator: function (passwordConfirm) {
          return passwordConfirm === this.password; // Corroboro que las password confirmada sea igual a la password ingresada. Este validator solo funciona en CREATE() o SAVE(), osea cuando usos metodos al crear o actualizar un usuario
        },
        message: 'Las contraseñas no coindicen',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Antes de almacenar el documento, utilizo este middleware que va a encriptar la clave. lo primero es corroborar que se esta creando un usuario, o que el usuario esta actualizando la clave ya que puede que solo actualice su nombre, etc. Entonces selecciono el documento con THIS, despues aplico el metodo que corrobora si hay algun cambio en el field de password, si no hay cambio esto da false, asi que uso ! para pasarlo a true y que se cumpla la condicion dando retorno finalizando la funcion y pasando a la siguiente funcion con next(). Caso contrario que haya habido una modificacion, procedo a decir que la clave va a ser igual a llamar a la libreria de bcrypt que es para encriptar claves (tambien se le dice hash), asi que uso el metodo HASH para hacerlo, y dentro le paso la clave que quiero encriptar y le paso un segundo valor que especifica que tan fuerte va a ser el encriptado, cuanto mas valor, mas fuerte, pero consume mas CPU y tarda mas. Y finalmente quito del output el field de passwordConfirm simplemente dandole el valor de undefined, ya que solamente necesito el passwordConfirm para cuando hago la validacion en el model, pero aca ya no necesito mandar el passwordConfirm al documento, porque de esa forma tendrian acceso a ver la clave sin encriptar. Y esto funciona a su vez porque passwordConfirm es algo requerido en el model entre los inputs para crear el documento, pero no es obligatorio que se coloque en la base de datos.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Este middleware se encarga de actualizar el field de passwordChangedAt antes de guardar un documento. Pero primero corroboro que se haya modificado la clave, que en este caso si no se modifico o si el documento es nuevo, procedo a seguir la cadena de middlewares con next(), caso contrario modifico el field del documento con la fecha actual y procedo al siguiente middleware con next(), y para resolver un bug que aveces el token al cambiar de clave es creado antes de que la colocacion de la fecha de cambio de clave, le resto 1 segundo a la fecha de cambio de clave, asi el token se crea despues, y puedo estar con la sesion iniciada.
userSchema.pre('save', function (next) {
  if (!this.isModified(this.password) || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Creo un query middleware, para cualquier tipo de query que comience con find: findOne, findById, etc. De esa forma al buscar todos los documentos de los usuarios, solo voy a filtrar aquellos que tengan el field de active con un valor que no sea FALSE.
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// A esto se le llama INSTANCE METHOD y estan disponibles dentro de todos los documentos de los usuarios. El metodo lo llamo correctPassword y este va a recibir la clave que quiero comparar, por ejemplo la que envio en el login, y la clave que tiene el usuario en la base de datos. Y uso la libreria de bcrypt que lo que hace con el metodo compare es recibir la clave ingresada en el login, que esta, esta cruda sin encriptar y desencripta la segunda que es la que tiene el usuario en la base de datos para comparar ambas. Esto va a dar como retorno true/false.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Cuando un usuario actualiza su clave se le crea el field de passwordChangedAt con la fecha en que lo hizo, de lo contrario un usuario nuevo no tiene ese field, por lo tanto antes de verificar si cambio la clave, primero verifico que con IF que tenga ese field creado. Si no lo tiene voy a dar como retorno por default, FALSE. Pero si se cumple la condicion, primero le doy un formato correcto a la fecha creada en el documento para que tenga el mismo formato que la fecha de creacion del token y procedo a comparar la fecha de creacion del token que se recibe en este metodo, con la fecha de cambio de la clave. Si la fecha de creacion del token es menor a la fecha de cambio de clave significa que se cambio la clave ya que la cambie mucho despues de haberse creado el token, asi que esto da como retorno TRUE, caso contrario da FALSE y significa que no se cambio la clave
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const formatedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < formatedTimestamp;
  }

  // FALSE significa que no se cambio la clave
  return false;
};

// En caso de que el usuario solicite resetear su contrasena, entonces se ejecuta este metodo que lo que hace es usar una libreria ya incluida en nodeJs que crea una string aleatoria con el metodo de randomBytes, especifico el numero de longitud de la string y lo paso a hexadecimal. Y para encriptar el token, procedo a usar el metodo createHash donde le paso el algoritmo de encriptado, le paso el token y nuevamente lo paso a hexadecimal y lo almaceno en el documento del usuario en el field de PasswordResetToken. Despues creo en el documento un field para la fecha de expiracion del token, en este caso expira en 10 minutos. Y finalmente retorno el token sin encriptar ya que es el que voy a enviarle al usuario atraves del email para despues compararlo con el encriptado.
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
