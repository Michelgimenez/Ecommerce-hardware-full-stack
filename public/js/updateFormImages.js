// 1) Aca agrego un eventlistener a cada input dentro del formulario para que cuando suba una foto al input, se actualice la imagen de la izquierda.
export const updateFormImages = (input, htmlImage) => {
  input.addEventListener('change', () => {
    const image = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      document.querySelector(`${htmlImage}`).src = e.target.result;
    };

    reader.readAsDataURL(image);
  });
};
