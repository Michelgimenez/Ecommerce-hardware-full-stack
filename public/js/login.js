// Importo la libreria que instale usando la sintaxis de es6
import axios from 'axios';
import { showAlert } from './alerts.js';

export const login = async (email, password) => {
  try {
    // 1) Realizo una solicitud a la api enviandole el email y la clave del usuario. Esto retorna una promesa que almaceno en la variable.
    const response = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });

    // 2) Si sale todo bien, verifico en la respuesta almacenada en la variable, el field de data y dentro el field de status que si es SUCCESS, significa que salio todo bien, asi que procedo a mostrar una alerta y tras la alerta uso window para seleccionar la pagina y le aplico un timer que tras 1 segundo y medio me va a redireccionar a "/", por eso uso location que selecciona el URL y assign para seleccionar el nuevo URL.
    if (response.data.status === 'success') {
      showAlert('success', 'Inicio de sesion exitoso');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

    // 3) En caso de que se envie informacion incorrecta, yo estableci que la api de como respuesta un status de 401 con un error. Asi que ese error lo voy a atrapar usando try/catch
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

// Aca procedo a llamar a la ruta en la api que ejecuta el metodo de logour el cual se encarga de reemplazar la cookie con el token, por una cookie con una string, entonces procedo a usar location.assign para redireccionar la url a / para ir nuevamente al inicio y ya sin tener la cookie por lo tanto no se detecta ningun usuario y se despliegan los botones de iniciar sesion/cerrar sesion
export const logout = async () => {
  try {
    const response = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    if (response.data.status === 'success') location.assign('/');
  } catch (error) {
    showAlert(
      'error',
      'Hubo un error intentando cerrar la sesion. Por favor intentelo de nuevo'
    );
  }
};
