// En esta class query equivale a la query resultante de llamar al modelo sin usar await, por ejemplo Product.find() eso da una query a la cual puedo encadenarle metodos antes de solicitar los documentos con await. Y queryString es req.query, es decir, todas las query que hay en la solicitud, esto contiene por ejemplo req.query.sort, req.query.featured, etc.
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 0) FILTER: Creo una copia de las query enviadas en la solicitud ycreo un objeto con las query y las almaceno en la variable. Y creo una variable para la clase de fields que quiero quitar de la solicitud en caso de encontrarla. Y procedo a loopear sobre la variable con las palabras y por cada palabra que encuentro, procedo a usar el operador de DELETE para eliminar de la variable con la copia de las query de la solicitud, esas query en caso de encontrarse dentro. ACLARACION IMPORTANTE, en el filtrado quito estos fields especificos porque el filtrado es solo para fields como por ejemplo los documentos que tengan featured TRUE, los fields de page se van a usar solo en la paginacion, es por eso que aca creo una copia de this.queryString que equivale a req.query, asi no quito del this.queryString original el field de page, ya que lo voy a usar en el metodo de PAGINATION(). Lo mismo aplica al field de sort, lo quito aca pero no lo quito de this.queryString original ya que voy a usarlo en el metodo de SORT()
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // 1) ADVANCED FILTERING: Aca procedo a convertir el objeto de javascript en una string y lo almaceno en una variable. Despues antes de entender lo que prosigue, es necesario entender la clase de informacion que se va a recibir en la solicitud. Por ejemplo yo quiero los productos cuyo precio es mayor a cierto numero, en este caso se usan operadores por ejemplo $GTE significa GREATER, en la solicitud se buscaria por ejemplo /api/v1/products?price[gte]=100, entonces la variable de queryObj equivaldria a {price: {gte: '100' }}, pero mongoDb para buscar documentos cuyo precio es mayor a 100, precisa de el signo de $, asi que procedo a citar la variable de queryStr y gracias a que pase el objeto a string, puedo usar REPLACE, el primer argumento coloco que quiero seleccionar para reemplazar y uso una regular expression para marcar todos los posibles operadores que pueden haber, y el segundo argumento es la callback function que me manda el operador en caso de encontrarlo y lo reemplazo agregandole el signo de $. Despues procedo a convertir todo en un objeto nuevamente con JSON.parse
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|regex|options)\b/g,
      (match) => `$${match}`
    );
    queryStr = JSON.parse(queryStr);

    // Una CLARACION IMPORTANTE: Agregue a la API es la busqueda por nombre de productos, en este caso la solicitud seria por ejemplo /api/v1/products?name[regex]=logite&name[options]=i, REGEX es para que cuando escriba por ejemplo logite, cuando busque ese documento va a buscar aquel que contenga parte de esa palabra, recibiendo el documento de logitech por ejemplo. Y repito nuevamente el mismo field de name y le agrego un segundo operador llamado OPTIONS que con el valor de "i" me permite que aunque yo busque logitech en minuscula y el documento tiene de nombre Logitech, de todas formas lo voy a recibir. Basicamente lo que se estaria colocando dentro de find() seria en este formato tras realizar la solicitud:
    // find({ name: { '$options': 'i', '$regex': 'logite' } }) y esto lo puedo ver simplemente mostrando en la consola el valor de queryStr antes de utilizar el metodo de find sobre el modelo de los productos
    // console.log(queryStr);

    // 2) Llamo al metodo de find sobre el modelo del producto para recibir todos los productos de la base de datos en caso de que queryStr no contenga nada, ya que cuando no hay nada especificado, find() da todos los documentos del modelo de productos. En caso de que por ejemplo en la solicitud se haya buscado por ejemplo /api/v1/products?featured=true, arriba ya filtre dentro de queryObj las query que se quiten de la solicitud (req.query), y dentro de queryStr le di formato a los operadores en caso de haberlos, asi que coloco queryStr dentro de find, eso equivaldria a colocar dentro de find un objeto buscando solo los documentos que tengan FEATURED TRUE o por ejemplo que tengan precios mayores a 100, basicamente seria como colocar find({featured: true, price: {'$gte': '100'}}), esto me da como retorno algo llamado QUERY, que todavia no contiene los documentos de la base de datos, eso solo pasaria si coloco await, pero no lo voy a hacer ya que esta QUERY tiene acceso a diferentes metodos ya que los hereda atraves del prototipo al que tiene acceso, si yo recibiera todos los documentos de una, no tendria acceso a la query y esos metodos.
    this.query = this.query.find(queryStr);
    // Product.find(queryStr); lo de arriba equivale a esto

    // Doy como retorno THIS que representa el objeto entero, asi donde llamo a esta class, tras llamar a filter(), esto da como retorno el objeto entero y puedo seguir encadenando todos los metodos ya que cada uno da como retorno nuevamente el objeto con acceso a todos los metodos.
    return this;
  }

  sort() {
    // 3) SORT: Ahora que en la variable de QUERY tengo la query con acceso a los metodos que dije antes puedo aplicarle metodos como SORT para ordenar los documentos antes de recibirlos. En este caso aplico el metodo solo si en la solicitud se encuentra el field de SORT. En ese caso aplico el metodo de SORT y le paso como valor, el sort de la solicitud (/api/v1/products?sort=price), que esta va a contener por ejemplo PRICE, y me los coloca de menor a mayor (es como colocar sort('price')). En caso de quererlos al reves, uso en la solicitud el signo menos sobre el valor de sort (/api/v1/products?sort=-price). En caso de que una persona quiera ordenar los productos por mas de un solo field, simplemente en la solicitud seria por ejemplo (/api/v1/products?sort=price,rating), pero sort lo esperaria asi: sort('price rating'), asi que procedo a extraer eso de req.query.sort, le aplico split para dividir las palabras donde esta la coma, y del array resultante, uno ambas strings con un espacio, quedando el formato de "price rating", asi que procedo a colocar sortBy dentro de sort(), pero por ahora no voy a implementar eso. En caso de que no haya nada en SORT, procedo a dejar un default para ordenar los productos desde los creados recientemente a los mas viejos (opcional, aunque podria colocar price para recibir por default los precios mas caros)
    if (this.queryString.sort) {
      // const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(this.queryString.sort); // sortBy
    } else {
      this.query = this.query.sort('-createdAt');
    }

    // Doy como retorno THIS que representa el objeto entero, asi donde llamo a esta class, tras llamar a filter(), esto da como retorno el objeto entero y puedo seguir encadenando todos los metodos ya que cada uno da como retorno nuevamente el objeto con acceso a todos los metodos.
    return this;
  }

  limitFields() {
    // 4) FIELD LIMITING: En este caso si el usuario envio una query por ejemplo /api/v1/products?fields=name,description,overview. Entonces procedo a realizar el proceso de seleccionar esto, aplicarle split para separar donde hay comas, termino con un array ["name", "description", "overview"], lo uno todo con un espacio teniendo finalmente "name, description, overview" y esto lo uso para aplicar el metodo SELECT() que justamente espera ese formato de una string con espacios, de esa forma quiero de cada documento solo esos fields especificados, esto sirve para evitar tanta carga al solicitar informacion de productos que tienen muchisima informacion (graphQL permite esto mismo, recibir los fields que yo quiera). Y en caso de que no haya ninguna query de fields en la solicitud, procedo a filtrar de todas formas ciertos fields que mongoDb le crea a los documentos por default por ejemplo "__v", entonces coloco el signo - sobre este field, para decir que quiero todo, menos ese field especifico.
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v -createdAt -updatedAt');
    }

    // Doy como retorno THIS que representa el objeto entero, asi donde llamo a esta class, tras llamar a filter(), esto da como retorno el objeto entero y puedo seguir encadenando todos los metodos ya que cada uno da como retorno nuevamente el objeto con acceso a todos los metodos.
    return this;
  }

  pagination() {
    // 5) PAGINATION: Supongamos que tengo 100 productos, y quiero mostrar solo 10, asi de esa forma no muestro los 100 y sobrecargo toda la pagina. En ese caso procedo a implementar la paginacion. La solicitud se veria por ejemplo: /api/v1/products?page=1&limit=10, de esa forma la pagina uno se limitaria a 10 resultados (1 a 10), pero al ir a la pagina 2, tendria que saltear los primeros resultados para pasar de 11 a 20, entonces para aplicar esto primeroe extraigo de la solicitud, la query de PAGE que lo paso a numero multiplicando por 1. Si no hay nada en req.query.page entonces uso el operador de || para que por default se almacene el numero 1. Para el limite le doy como default 20 en caso de no haber nada en la solicitud. Y para saber cuantos elementos salteo por ejemplo en la pagina 3 sabiendo que por pagina di un limite de 10 resultados. Entonces procedo a hacer la pagina - 1, estoy en la pagina 3, entonces queda en 2, y a esto lo multiplico por el limite, seria 2 * 10, 20, entonces ya se que tengo que saltear 20 elementos. Y finalmente modifico la query con los documentos filtrados hasta ahora(o todos los documentos en caso de no haber enviado ninguna query anteriormente), y uso el metodo SKIP para saltear cierto numero de documentos, en este caso por ejemplo salteo 20, comenzando a partir del documento 21, y limito los resultados al valor de limit (10), entonces recibo del 21 al 30. EL SKIP ES AUTOMATICO, si voy a la pagina 2, aca automaticamente se calcula la cantidad de items a saltear.
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // Doy como retorno THIS que representa el objeto entero, asi donde llamo a esta class, tras llamar a filter(), esto da como retorno el objeto entero y puedo seguir encadenando todos los metodos ya que cada uno da como retorno nuevamente el objeto con acceso a todos los metodos.
    return this;
  }
}

module.exports = APIFeatures;
