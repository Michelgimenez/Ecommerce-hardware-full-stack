import axios from 'axios';
import { showAlert } from './alerts.js';

// TYPE: 'PASSWORD' / 'DATA'
// En caso de que se llame a esta funcion cienso TYPE data, es decir que estoy actualizando el nomre/email/foto del usuario, entonces procedo a hacer que la variable de URL contenga el url de la api que actualiza esa clase de informacion. Y le paso el objeto con esa informacion que se va a encontrar en DATA. Caso contrario que sea password, el url va a contener el url de la api donde actualizo la clave. Y en DATA voy a estar recibiendo el objeto que contiene la clave actual, la clave nueva y la clave nueva confirmada.
export const createProduct = async (data) => {
  try {
    const url = '/api/v1/products';

    const response = await axios({
      method: 'POST',
      url: url,
      data: data,
    });

    if (response.data.status === 'success') {
      showAlert('success', 'Producto creado correctamente');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
