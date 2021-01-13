import axios from 'axios';
import { showAlert } from './alerts.js';

export const deleteDocument = async (type, id) => {
  try {
    // 1) Realizo una solicitud a la api enviandole el email y la clave del usuario. Esto retorna una promesa que almaceno en la variable.
    const response = await axios({
      method: 'DELETE',
      url: `/api/v1/${type}/${id}`,
    });

    // 2) Si sale todo bien, verifico en la respuesta almacenada en la variable, el field de data y dentro el field de status que si es SUCCESS, significa que salio todo bien, asi que procedo a mostrar una alerta y tras la alerta uso window para seleccionar la pagina y le aplico un timer que tras 1 segundo y medio me va a redireccionar a "/", por eso uso location que selecciona el URL y assign para seleccionar el nuevo URL.
    if (response.status === 204) {
      showAlert('success', 'Documento eliminado exitosamente');
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }

    // 3) En caso de que se envie informacion incorrecta, yo estableci que la api de como respuesta un status de 401 con un error. Asi que ese error lo voy a atrapar usando try/catch
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
