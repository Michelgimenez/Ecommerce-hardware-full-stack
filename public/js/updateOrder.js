import axios from 'axios';
import { showAlert } from './alerts.js';

export const updateOrder = async (orderId) => {
  const phoneNumber = document.getElementById('orderuserphone').value;
  const paymentMethod = document.getElementById('orderpaymentMethod').value;
  const orderDelivered = document.getElementById('orderdelivered').value;
  const orderPaid = document.getElementById('orderispaid').value;
  const orderRetirementDate = document.getElementById('orderretirementdate')
    .value;
  const orderLocation = document.getElementById('orderlocation').value;
  const orderProvince = document.getElementById('orderprovince').value;
  const orderCity = document.getElementById('ordercity').value;
  const orderPostalcode = document.getElementById('orderpostalcode').value;
  const orderTotalPrice = document.getElementById('ordertotalprice').value;

  try {
    // 1) Realizo una solicitud a la api enviandole el email y la clave del usuario. Esto retorna una promesa que almaceno en la variable.
    const response = await axios({
      method: 'PATCH',
      url: `/api/v1/orders/${orderId}`,
      data: {
        phoneNumber: phoneNumber,
        paymentMethod: paymentMethod,
        isDelivered: orderDelivered === 'Si' ? true : false,
        isPaid: orderPaid === 'Si' ? true : false,
        retirementDate: orderRetirementDate,
        houseDirection: orderLocation,
        province: orderProvince,
        city: orderCity,
        postalCode: orderPostalcode,
        totalPrice: orderTotalPrice,
      },
    });

    if (response.data.status === 'success') {
      showAlert('success', 'Orden actualiza correctamente');
      window.setTimeout(() => {
        location.assign('/orders-list');
      }, 2000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
