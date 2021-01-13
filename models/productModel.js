const mongoose = require('mongoose');
const slugify = require('slugify');

// 0) Procedo a crear el esquema que define la clase de informacion que va a contener el documento de cada producto. Basicamente describo el documento y valido la informacion que tiene que tener. Trim es para eliminar espacios al principio y final de una string.
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El producto tiene que tener un nombre'],
      unique: [true, 'Ya existe un producto con el mismo nombre'],
      trim: true,
      maxlength: [40, 'El producto tiene que tener 40 o menos letras'],
      minlength: [5, 'El producto tiene que tener 5 o mas letras'],
    },
    slug: String,
    featured: {
      type: Boolean,
      required: [true, 'El producto tiene que contener si es destacado o no'],
    },
    imageCover: {
      type: String,
      required: [true, 'El producto tiene que tener una imagen principal'],
    },
    images: {
      type: [String],
      required: [true, 'El producto tiene que tener imagenes'],
    },
    brand: {
      type: String,
      required: [true, 'El producto tiene que tener las imagenes'],
      trim: true,
      enum: {
        values: ['Logitech', 'Nvidia', 'Evga', 'Gigabyte', 'Intel'],
        message:
          'Las marcas que se aceptan son solamente Logitech, Nvidia, Evga, Gigabyte, Intel',
      },
    },
    category: {
      type: String,
      required: [true, 'El producto tiene que tener categoria'],
      trim: true,
      enum: {
        values: [
          'Motherboard',
          'Placa de video',
          'Fuente',
          'Mouse',
          'Teclado',
          'Disco solido',
        ],
        message:
          'Las categorias que se aceptan son solamente Motherboard, Placa de video, Fuente, Mouse, Teclado, Disco solido',
      },
    },
    description: {
      type: String,
      required: [true, 'El producto tiene que tener una descripcion'],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, 'El producto tiene que tener descripcion detallada'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'El producto tiene que tener un precio'],
      default: 100,
      min: [100, 'El precio tiene que tener como minimo 100'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (priceDiscount) {
          return priceDiscount < this.price; // Si el descuento es menor al precio puesto en el documento del producto, por ejemplo 100 < 200, se da como retorno TRUE, por lo tanto es valido el descuento, caso contrario da como retorno FALSE y entonces el validador da un error. Esta funcion solo funciona para crear documentos. No funciona para UPDATE ya que en este caso, THIS no apunta al documento.
        },
        message: 'El descuento no puede ser mayor al precio del producto',
      },
    },
    countInStock: {
      type: Number,
      required: [true, 'El producto tiene que tener un stock establecido'],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// El metodo de INDEX sobre el schema se utiliza para especicifcar a que field del documento quiero agregarle un index, en este caso al field de PRICE y uso 1 para colocar que lo quiero de forma ascendente. En este caso entonces si yo busco por ejemplo documentos con un precio mayor a 25000, en caso de que mis documentos totales sean 10, y solo hayan 3 que superan ese precio, entonces se van a leer solo esos 3, sin el index primero se leerian los 10 y despues de ahi se rescatarian los 3. Con el index soluciono esto logrando una respuesta mas rapida. Tambien agrego name, en ese caso si busco estos dos fields al mismo tiempo, por ejemplo un producto que tenga un precio mayor a 25000 y que se llame logitech, entonces va a leer solo el documento que coincida con eso. Y tambien va a funcionar de forma indiviual cuando busque un documento por su nombre. Hay que tener mucho cuidado con los indexes porque pesan bastante. Por eso solo es importante colocar indexes en fields que los usuarios busquen mucho.
productSchema.index({ price: 1, name: 1 });

// En este caso tengo un index para el field de SLUG que lo voy a usar para leer la el nombre de un producto para colocarlo en el url
productSchema.index({ slug: 1 });

// 1) Este es un middleware para documentos, con PRE se ejecuta antes de, en este caso guardar un documento usando SAVE() o CREATE(), y se ejecuta una callback function que tiene acceso al documento (this), asi que procedo a crearle un field llamado SLUG, donde uso la libreria de SLUGIFY para darle como valor a ese field el nombre del producto, pero pasado a minuscula y en formato de slug, por ejemplo el nombre es 'Nvidia rtx 3090', lo deja en 'nvidia-rtx-3090'. Al ser un middleware ya que se ejecuta antes de guardar un documento, este tiene acceso a NEXT, para proceder con la cadena de funciones.
productSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

/*
productSchema.pre('save', function (next) {
  console.log('Guardando documento...');
  next();
});

// En el caso de un middleware POST, seria despues de guardar el documento, este ya no tiene acceso a THIS como el PRE, pero tiene a la callback function se le envia el documento guardado, asi que puedo mostrar en la consola los detalles del documento
productSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});
*/

// 2) Procedo a crear el modelo que se va a llamar Product y recibe el schema para saber que clase de cosas van a estar en el documento del producto. De esta forma ahora simplemente llamo al modelo cada vez que quiera crear un documento de un producto y este al estar consciente del schema, va a saber que clase de informacion se requiere para crear el documento del producto
const Product = mongoose.model('Product', productSchema);

// 3) Exporto el modelo para poder usarlo y crear documentos
module.exports = Product;
