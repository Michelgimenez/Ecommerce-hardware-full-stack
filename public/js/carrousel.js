export const activateCarrousel = () => {
  // Selectores
  const slides = document.querySelectorAll('.slide');
  const btnLeft = document.querySelector('.slider__btn--left');
  const btnRight = document.querySelector('.slider__btn--right');
  const dotContainer = document.querySelector('.dots');

  let currentSlide = 0;
  const maxSlide = slides.length - 1;

  // Funciones
  const restartInterval = function () {
    clearInterval(changeSlide);
    changeSlide = setInterval(nextSlide, 7000);
  };

  const showContent = function (content) {
    document
      .querySelectorAll('.slide__container-content')
      .forEach((container) => {
        container.classList.remove('slide__container-content-active');
      });

    document
      .querySelector(`.slide__container-content[data-content="${content}"]`)
      .classList.add('slide__container-content-active');
  };

  const createDots = function () {
    slides.forEach((slide, index) => {
      dotContainer.insertAdjacentHTML(
        'beforeend',
        `<button class="dots__dot" data-slide="${index}"></button>`
      );
    });
  };

  const activateDot = function (slide) {
    document.querySelectorAll('.dots__dot').forEach((dot) => {
      dot.classList.remove('dots__dot--active');
    });

    document
      .querySelector(`.dots__dot[data-slide="${slide}"]`)
      .classList.add('dots__dot--active');
  };

  const goToSlide = function (slide) {
    slides.forEach((sli, index) => {
      sli.style.transform = `translateX(${100 * (index - slide)}%)`;
    });
  };

  const nextSlide = function () {
    if (currentSlide === maxSlide) {
      currentSlide = 0;
    } else {
      currentSlide++;
    }

    goToSlide(currentSlide);
    activateDot(currentSlide);
    restartInterval();
    showContent(currentSlide);
  };

  const prevSlide = function () {
    if (currentSlide === 0) {
      currentSlide = maxSlide;
    } else {
      currentSlide--;
    }

    goToSlide(currentSlide);
    activateDot(currentSlide);
    restartInterval();
    showContent(currentSlide);
  };

  const init = function () {
    goToSlide(0);
    createDots();
    activateDot(0);
    showContent(0);
  };

  init();

  // EVENT LISTENERS
  btnRight.addEventListener('click', nextSlide);

  btnLeft.addEventListener('click', prevSlide);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      prevSlide();
      restartInterval();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      restartInterval();
    }
  });

  dotContainer.addEventListener('click', function (e) {
    if (e.target.classList.contains('dots__dot')) {
      const slide = e.target.dataset.slide;
      goToSlide(slide);
      activateDot(slide);
      restartInterval();
      showContent(slide);
    }
  });

  let changeSlide = setInterval(nextSlide, 7000);
};
