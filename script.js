/* Строгий режим и область видимости без глобальных утечек. */
(function () {
  'use strict';

  /* ============ Мобильное меню (анимация через CSS-transition) ============ */
  var burger = document.getElementById('burger');
  var menuList = document.getElementById('menu-list');

  function closeMobileMenu() {
    burger.classList.remove('open');
    menuList.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }

  burger.addEventListener('click', function () {
    var opened = menuList.classList.toggle('open');
    burger.classList.toggle('open', opened);
    burger.setAttribute('aria-expanded', opened ? 'true' : 'false');
  });

  /* Раскрытие подменю по клику на мобильных устройствах. */
  Array.prototype.forEach.call(document.querySelectorAll('.menu__item--drop'), function (item) {
    var link = item.querySelector('.menu__link');
    link.addEventListener('click', function (event) {
      if (window.matchMedia('(max-width: 1023px)').matches) {
        event.preventDefault();
        item.classList.toggle('open');
      }
    });
  });

  /* Закрытие мобильного меню при переходе по ссылке. */
  Array.prototype.forEach.call(menuList.querySelectorAll('a'), function (link) {
    link.addEventListener('click', function () {
      if (window.matchMedia('(max-width: 1023px)').matches && !link.parentElement.classList.contains('menu__item--drop')) {
        closeMobileMenu();
      }
    });
  });

  /* ============ Слайдер отзывов ============ */
  var slider = document.getElementById('reviews-slider');
  var track = slider.querySelector('.slider__track');
  var slides = Array.prototype.slice.call(slider.querySelectorAll('.review'));
  var prevBtn = document.getElementById('slider-prev');
  var nextBtn = document.getElementById('slider-next');
  var dotsBox = document.getElementById('slider-dots');
  var current = 0;
  var timer = null;

  /* Точки навигации по слайдам. */
  slides.forEach(function (slide, index) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Отзыв ' + (index + 1));
    dot.addEventListener('click', function () {
      goTo(index);
      restartAutoplay();
    });
    dotsBox.appendChild(dot);
  });

  var dots = Array.prototype.slice.call(dotsBox.children);

  function goTo(page) {
    var pages = slides.length;
    if (page < 0) { page = pages - 1; }
    if (page >= pages) { page = 0; }
    current = page;
    /* Сдвиг в долях ширины одного слайда:
       слайд занимает 100%/N ширины трека, сдвигаем на page слайдов. */
    var slidePercent = 100 / slides.length;
    track.style.transform = 'translateX(-' + (page * slidePercent) + '%)';
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === current);
    });
  }

  function restartAutoplay() {
    if (timer) { clearInterval(timer); }
    timer = setInterval(function () {
      goTo(current + 1);
    }, 6000);
  }

  prevBtn.addEventListener('click', function () {
    goTo(current - 1);
    restartAutoplay();
  });

  nextBtn.addEventListener('click', function () {
    goTo(current + 1);
    restartAutoplay();
  });

  goTo(0);
  restartAutoplay();

  /* ============ Форма: LocalStorage, валидация, отправка через fetch ============ */
  var form = document.getElementById('contact-form');
  var submitBtn = document.getElementById('form-submit');
  var status = document.getElementById('form-status');
  var STORAGE_KEY = 'drupal-coder-contact-form';

  /* Восстановление ранее введённых значений из LocalStorage. */
  var saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    saved = null;
  }
  if (saved) {
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name && saved[el.name]) { el.value = saved[el.name]; }
    });
  }

  function saveForm() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) { data[el.name] = el.value; }
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      /* LocalStorage может быть недоступен — игнорируем. */
    }
  }

  form.addEventListener('input', saveForm);

  function validate() {
    var valid = true;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (input) {
      var ok = input.value.trim() !== '';
      if (input.type === 'email') {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      }
      input.classList.toggle('invalid', !ok);
      if (!ok) { valid = false; }
    });
    return valid;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = '';
    status.className = 'form-status field--wide';

    if (!validate()) {
      status.textContent = 'Пожалуйста, заполните обязательные поля корректно.';
      status.classList.add('form-status--error');
      return;
    }

    saveForm();

    /* Блокировка кнопки и анимация во время запроса. */
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    /* Сервис сохранения форм (форма из предыдущих заданий). */
    fetch('https://formcarry.com/s/ГОВОРИТЕ-ВАШ-ФОРМКЕЙ', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: form.elements.name.value,
        phone: form.elements.phone.value,
        email: form.elements.email.value,
        comment: form.elements.comment.value
      })
    })
      .then(function (response) {
        if (!response.ok) { throw new Error('Сервер вернул ошибку ' + response.status); }
        return response.json();
      })
      .then(function () {
        status.textContent = 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.';
        status.classList.add('form-status--ok');
        form.reset();
        try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* ignore */ }
      })
      .catch(function () {
        status.textContent = 'При отправке заявки произошла ошибка. Пожалуйста, отправьте форму ещё раз.';
        status.classList.add('form-status--error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      });
  });

})();
