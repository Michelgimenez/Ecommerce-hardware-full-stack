import axios from 'axios';
import { setupStore } from './store.js';
import { setUpCart } from './setupCart.js';

export const init = async () => {
  const {
    data: {
      data: { allDocuments },
    },
  } = await axios({
    method: 'GET',
    url: `/api/v1/products`,
  });

  setupStore(allDocuments);
  setUpCart();
};
