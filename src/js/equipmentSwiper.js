export function initEquipmentSwiper() {
  const categoryButtons = document.querySelectorAll('.equipment-section__button');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      categoryButtons.forEach(b => b.classList.remove('equipment-section__button_active'));
      btn.classList.add('equipment-section__button_active');
      initCategorySlider(btn.getAttribute('data-category'));
    });
  });

  // Инициализируем слайдер для категории по умолчанию (с активной кнопкой)
  const activeButton = document.querySelector('.equipment-section__button_active');
  if (activeButton) {
    initCategorySlider(activeButton.getAttribute('data-category'));
  }
};

function initCategorySlider(category) {
  const itemsContainer = document.querySelector('.equipment-section__items-container');
  const container = document.querySelector('.equipment-section__container');
  const dotsContainer = document.querySelector('.equipment-section__carousel__dots');
  const allItems = Array.from(document.querySelectorAll('.equipment-section__item'));

  // Отображаем карточки только выбранной категории
  allItems.forEach(item => {
    item.style.display = (item.getAttribute('data-category') === category) ? 'block' : 'none';
  });

  // Собираем только видимые карточки
  const items = Array.from(itemsContainer.querySelectorAll('.equipment-section__item'))
                     .filter(item => item.style.display !== 'none');
  const totalItems = items.length;
  if (totalItems === 0) return;

  // Стили для контейнера
  container.style.overflow = 'hidden';
  itemsContainer.style.display = 'flex';
  itemsContainer.style.transition = 'transform 0.3s ease';
  itemsContainer.style.gridTemplateColumns = 'none';
  itemsContainer.style.gridColumnGap = '0';
  itemsContainer.style.transform = 'translateX(0px)';

  // ---- Все ключевые переменные в замыкании ----
  let visibleCount = getVisibleCount(); // сколько карточек показывать
  const minCardWidth = 250;
  const maxCardWidth = 330;
  const margin = 16; // отступ между карточками
  let containerWidth = container.clientWidth;

  // Функция расчёта ширины карточки так, чтобы ровно уместить visibleCount штук
  function calcItemWidth() {
    containerWidth = container.clientWidth;
    const maxWidthThatFits = (containerWidth - (visibleCount - 1) * margin) / visibleCount;
    return Math.min(Math.max(maxWidthThatFits, minCardWidth), maxCardWidth);
  }

  let itemWidth = calcItemWidth();

  // Устанавливаем карточкам нужную ширину и отступы
  items.forEach(item => {
    item.style.minWidth = itemWidth + 'px';
    item.style.flexShrink = '0';
    item.style.marginRight = margin + 'px';
  });

  // Общая ширина всех карточек (с учетом margin)
  let totalSlidesWidth = totalItems * (itemWidth + margin) - margin;
  // Функция, возвращающая максимальное смещение, чтобы последняя карточка была у правого края
  function getMaxOffset() {
    return Math.max(totalSlidesWidth - containerWidth, 0);
  }

  // Индекс текущего "окна"
  let currentIndex = 0;
  // Предыдущее смещение
  let prevTranslate = 0;
  // Последний допустимый индекс
  let maxIndex = totalItems - visibleCount;

  // ========== Генерация точек ==========
  function generateDots() {
    if (totalSlidesWidth <= containerWidth) {
      dotsContainer.classList.add('invisible');
      dotsContainer.innerHTML = '';
      return;
    } else {
      dotsContainer.classList.remove('invisible');
    }

    dotsContainer.innerHTML = '';
    const totalDots = totalItems;
    const maxDotsDisplayed = 6;
    let dotStart = 0;
    if (totalDots > maxDotsDisplayed) {
      dotStart = Math.min(
        Math.max(currentIndex - Math.floor(maxDotsDisplayed / 2), 0),
        totalDots - maxDotsDisplayed
      );
    }
    const dotEnd = (totalDots > maxDotsDisplayed) ? dotStart + maxDotsDisplayed : totalDots;

    for (let i = dotStart; i < dotEnd; i++) {
      const dot = document.createElement('span');
      dot.classList.add('equipment-section__carousel__dot');
      if (i >= currentIndex && i < currentIndex + visibleCount) {
        dot.classList.add('equipment-section__carousel__dot_active');
      }
      dot.addEventListener('click', () => {
        currentIndex = Math.min(i, maxIndex);
        updateSlider();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    generateDots();
  }

  // Возвращает смещение (в пикселях) с учетом margin и ограничений
  function getClampedOffset(index) {
    const offset = index * (itemWidth + margin);
    return Math.min(offset, getMaxOffset());
  }

  function updateSlider() {
    const offset = getClampedOffset(currentIndex);
    itemsContainer.style.transform = `translateX(-${offset}px)`;
    prevTranslate = -offset;
    updateDots();
  }

  // ===== ЛОГИКА СВАЙПА И ТАПА =====
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  // Флаг, который определяет, что было значительное движение (свайп)
  let isSwiping = false;
  // Сохраняем начальный элемент, на котором начался touch/mousedown
  let startTarget = null;

  function getPositionX(e) {
    return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
  }

  function dragStart(e) {
    isDragging = true;
    isSwiping = false; // сбрасываем флаг свайпа
    startTarget = e.target;
    startX = getPositionX(e);
    itemsContainer.style.transition = 'none';
    if (!e.type.includes('mouse')) {
      e.preventDefault();
    }
  }

  function dragMove(e) {
    if (!isDragging) return;
    const currentPosition = getPositionX(e);
    const diff = currentPosition - startX;
    // Если движение больше 10px, считаем, что это свайп
    if (Math.abs(diff) > 10) {
      isSwiping = true;
    }
    currentTranslate = prevTranslate + diff;
    itemsContainer.style.transform = `translateX(${currentTranslate}px)`;
    if (!e.type.includes('mouse')) {
      e.preventDefault();
    }
  }

  function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    const movedBy = currentTranslate - prevTranslate;
    console.log(movedBy)
    // Если движение меньше 10px, считаем, что это просто тап
    if (!isSwiping && Math.abs(movedBy) < 500) {
      // Если тап произошел по карточке, вызываем попап
      const card = startTarget.closest('.equipment-section__item');
      if (card) {
        openPopupWithInfo(card);
      }
      // Сбрасываем трансформацию
      itemsContainer.style.transition = 'transform 0.3s ease';
      updateSlider();
      return;
    }
    // Если свайп значительный – меняем индекс
    if (movedBy < -50 && currentIndex < maxIndex) {
      currentIndex++;
    } else if (movedBy > 50 && currentIndex > 0) {
      currentIndex--;
    }
    itemsContainer.style.transition = 'transform 0.3s ease';
    updateSlider();
  }

  // Подключаем события для мыши
  itemsContainer.addEventListener('mousedown', dragStart);
  itemsContainer.addEventListener('mousemove', dragMove);
  itemsContainer.addEventListener('mouseup', dragEnd);
  itemsContainer.addEventListener('mouseleave', dragEnd);

  // И для тач-устройств (с опцией passive: false)
  itemsContainer.addEventListener('touchstart', dragStart, { passive: false });
  itemsContainer.addEventListener('touchmove', dragMove, { passive: false });
  itemsContainer.addEventListener('touchend', dragEnd);

  // ========== ОБРАБОТЧИК RESIZE ==========
  window.addEventListener('resize', () => {
    visibleCount = getVisibleCount();
    maxIndex = totalItems - visibleCount;
    itemWidth = calcItemWidth();
    items.forEach(item => {
      item.style.minWidth = itemWidth + 'px';
    });
    totalSlidesWidth = totalItems * (itemWidth + margin) - margin;
    if (currentIndex > maxIndex) {
      currentIndex = maxIndex;
    }
    if (currentIndex < 0) {
      currentIndex = 0;
    }
    const offset = getClampedOffset(currentIndex);
    prevTranslate = -offset;
    updateSlider();
  });

  // Первичная инициализация
  updateSlider();
}

/**
 * Возвращает, сколько карточек показывать на экране
 */
function getVisibleCount() {
  const width = window.innerWidth;
  if (width >= 1024) {
    return 3;
  } else if (width >= 768) {
    return 2;
  } else {
    return 1;
  }
}

// Пример функции открытия попапа (реализуйте по своему усмотрению)
function openPopupWithInfo(cardElement) {

  // Здесь можно реализовать логику показа попапа с информацией о карточке
}
