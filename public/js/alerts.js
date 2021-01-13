// Este es el metodo que es llamado para ocultar la alerta donde selecciono el elemento con class de alert. En caso de encontrar alguno, selecciono su padre, y le digo al padre que elimino su hijo pasandole la variable que contiene el hijo, asi se termina de eliminar el html de la alerta.
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// TYPE = 'SUCCESS' / 'ERROR'
// Procedo a crear un markup para la alerta donde le paso el type para colocarle un css en base a eso y dentro el mensaje. Y procedo a seleccionar el body del documento y le inserto el div de la alerta usando afterbegin que significa justo despues del comienzo del body. Pero antes de todo llamo a la funcion que elimina cualquier alerta creada y al final de todo oculta la alerta despues de 4 segundos de ser creada.
export const showAlert = (type, message) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 4000);
};
