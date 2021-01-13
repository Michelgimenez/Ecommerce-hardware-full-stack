import axios from 'axios';
import { getStorageItem, emptyStorageItem } from './utils.js';
import { showAlert } from './alerts.js';

export const createInPersonOrder = async () => {
  const phone = document.getElementById('phone').value;
  const date = document.getElementById('date').value;
  const houseDirection = document.getElementById('location').value;
  const province = document.getElementById('province').value;
  const city = document.getElementById('city').value;
  const postalCode = document.getElementById('postalCode').value;
  const userId = document.querySelector('.payment__form').dataset.id;
  const totalPrice = document
    .querySelector('.cart__total')
    .textContent.slice(9);
  const cart = getStorageItem('cart');
  const orderItems = [];

  cart.forEach((product) => {
    orderItems.push(product);
  });

  try {
    // 1) Realizo una solicitud a la api enviandole el email y la clave del usuario. Esto retorna una promesa que almaceno en la variable.
    const response = await axios({
      method: 'POST',
      url: '/api/v1/orders/create-in-person-order',
      data: {
        user: userId,
        orderItems: orderItems,
        totalPrice: `$${totalPrice}`,
        phoneNumber: phone,
        retirementDate: date,
        houseDirection: houseDirection ? houseDirection : '',
        province: province ? province : '',
        city: city ? city : '',
        postalCode: postalCode ? postalCode : '',
      },
    });

    // 2) Si sale todo bien, verifico en la respuesta almacenada en la variable, el field de data y dentro el field de status que si es SUCCESS, significa que salio todo bien, asi que procedo a mostrar una alerta y tras la alerta uso window para seleccionar la pagina y le aplico un timer que tras 1 segundo y medio me va a redireccionar a "/", por eso uso location que selecciona el URL y assign para seleccionar el nuevo URL.
    if (response.data.status === 'success') {
      showAlert('success', 'Orden creada exitosamente');
      emptyStorageItem('cart');
      window.setTimeout(() => {
        location.assign('/');
      }, 2500);
    }

    // 3) En caso de que se envie informacion incorrecta, yo estableci que la api de como respuesta un status de 401 con un error. Asi que ese error lo voy a atrapar usando try/catch
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
