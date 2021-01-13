import { getStorageItem, setStorageItem } from './utils.js';

export let store = getStorageItem('store');

export const setupStore = (formattedProducts) => {
  store = formattedProducts.map((product) => {
    const {
      _id,
      name,
      featured,
      brand,
      description,
      overview,
      price,
      imageCover,
      images,
      countInStock,
      category,
    } = product;

    return {
      _id,
      name,
      featured,
      brand,
      description,
      overview,
      price,
      imageCover,
      images,
      countInStock,
      category,
    };
  });

  setStorageItem('store', store);
};

export const findProduct = (id) => {
  let product = store.find((product) => product._id === id);
  return product;
};
