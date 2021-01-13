import axios from 'axios';
import { formatPrice } from './utils.js';

export const displayProducts = async (page, products, pagination) => {
  const {
    data: {
      data: { allDocuments },
    },
  } = await axios({
    method: 'GET',
    url: `/api/v1/products`,
  });

  const totalDocuments = allDocuments.length;
  const limit = 3;
  const actualPage = page || 1;

  const {
    data: {
      data: { allDocuments: allProducts },
    },
  } = await axios({
    method: 'GET',
    url: `/api/v1/products?page=${actualPage}&limit=${limit}`,
  });

  pagination.innerHTML = `
  ${
    actualPage !== 1 && actualPage - 1 !== 1
      ? `<a class='pagination-btn' href="?page=1">1</a>`
      : ''
  }
  ${
    actualPage > 1
      ? `<a class='pagination-btn' href="?page=${actualPage - 1}">${
          actualPage - 1
        }</a>`
      : ''
  }
  <a class='pagination-btn active' href="?page=${actualPage}">${actualPage}</a>
  ${
    limit * actualPage < totalDocuments
      ? `<a class='pagination-btn' href="?page=${actualPage + 1}">${
          actualPage + 1
        }</a>`
      : ''
  }
  ${
    Math.ceil(totalDocuments / limit) !== actualPage &&
    actualPage + 1 !== Math.ceil(totalDocuments / limit)
      ? `<a class='pagination-btn' href="?page=${Math.ceil(
          totalDocuments / limit
        )}">${Math.ceil(totalDocuments / limit)}</a>`
      : ''
  }
  `;

  products.innerHTML = allProducts
    .map((product) => {
      const { name, price, imageCover, slug } = product;
      return `
    <a href="product/${slug}" class="products__item">
        <div class="products__image">
          <img src="/img/products/${imageCover}" alt="producto" />
        </div>
        <h3 class="products__title">${name}</h3>
         <p class="products__price">${formatPrice(price)}</p>
      </a>
    `;
    })
    .join('');
};

export const filterProducts = async (
  filterSearch,
  filterCategories,
  products,
  page,
  filterPagination,
  pagination
) => {
  pagination.remove();

  const searchValue = filterSearch.value;
  const categoryValue = filterCategories.value;

  const {
    data: {
      data: { allDocuments },
    },
  } = await axios({
    method: 'GET',
    url: `/api/v1/products?name[options]=i&name[regex]=${searchValue}${
      categoryValue === 'Todo' ? '' : `&category=${categoryValue}`
    }`,
  });

  const limit = 3;
  const actualPage = page || 1;

  const {
    data: {
      data: { allDocuments: allProducts },
    },
  } = await axios({
    method: 'GET',
    url: `/api/v1/products?name[options]=i&name[regex]=${searchValue}${
      categoryValue === 'Todo' ? '' : `&category=${categoryValue}`
    }&page=${actualPage}&limit=${limit}`,
  });

  // Para aplicar la paginacion en los filtros yo necesito obtener la cantidad total de items encontrados pero sin aplicar la paginacion y el limit que tengo en allProducts, ya que sin importar que busque, al tener el limit, cuando aplique length aunque haya encontrado 8 documentos, recibo 3 por el limit , de esa forma entonces realice una solicitud sin aplicar esas query para obtener la cantidad total de documentos filtrados y asi poder usarlos para aplicar la paginacion.
  const totalDocuments = allDocuments.length;

  filterPagination.innerHTML = `
  ${
    actualPage !== 1 && actualPage - 1 !== 1
      ? `<a class='filter-pagination-btn' href="?page=1">1</a>`
      : ''
  }
  ${
    actualPage > 1
      ? `<a class='filter-pagination-btn' href="?page=${actualPage - 1}">${
          actualPage - 1
        }</a>`
      : ''
  }
  <a class='filter-pagination-btn active'  href="?page=${actualPage}">${actualPage}</a>
  ${
    limit * actualPage < totalDocuments
      ? `<a class='filter-pagination-btn' href="?page=${actualPage + 1}">${
          actualPage + 1
        }</a>`
      : ''
  }
  ${
    Math.ceil(totalDocuments / limit) !== actualPage &&
    actualPage + 1 !== Math.ceil(totalDocuments / limit)
      ? `<a class='filter-pagination-btn' href="?page=${Math.ceil(
          totalDocuments / limit
        )}">${Math.ceil(totalDocuments / limit)}</a>`
      : ''
  }
  `;

  products.innerHTML = allProducts
    .map((product) => {
      const { name, price, imageCover, slug } = product;
      return `
    <a href="product/${slug}" class="products__item">
        <div class="products__image">
          <img src="/img/products/${imageCover}" alt="producto" />
        </div>
        <h3 class="products__title">${name}</h3>
         <p class="products__price">${formatPrice(price)}</p>
      </a>
    `;
    })
    .join('');
};
