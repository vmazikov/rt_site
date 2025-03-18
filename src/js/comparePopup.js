// comparePopup.js
import { openConnectFlow } from "./index.js";
// Массив выбранных тарифов (объекты). Будем хранить их в localStorage.
let selectedTariffs = [];

// Таймер для автосворачивания попапа
let hidePopupTimer = null;

// Максимальное количество тарифов
const MAX_TARIFFS = 4;

// Находим элементы попапа
const comparePopup = document.getElementById('comparePopup');
const fullComparePopup = document.querySelector('.popup-compare')
const comparePopupMinimized = document.getElementById('comparePopupMinimized');
const compareList = document.getElementById('compareList');
const compareCountSpan = document.getElementById('compareCount');
const compareError = document.getElementById('compareError');
const compareBadge = document.getElementById('compareBadge');
const compareBtn = document.getElementById('compareBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// 1) Загрузка из localStorage
function loadSelectedTariffs() {
  const data = localStorage.getItem('selectedTariffs');
  if (data) {
    try {
      selectedTariffs = JSON.parse(data);
    } catch (e) {
      selectedTariffs = [];
    }
  }
}

// 2) Сохранение в localStorage
function saveSelectedTariffs() {
  localStorage.setItem('selectedTariffs', JSON.stringify(selectedTariffs));
}

// 3) Проверяем, есть ли тариф уже в списке (по id)
function isTariffSelected(tariffId) {
  return selectedTariffs.some(t => t.id === tariffId);
}

// 4) Добавляем тариф (если ещё не 4)
function addTariff(tariff) {
  if (selectedTariffs.length >= MAX_TARIFFS) {
    // Показываем ошибку
    showError();
    return false; // Ничего не добавляем
  }
  selectedTariffs.push(tariff);
  return true;
}

// 5) Удаляем тариф по id
function removeTariff(tariffId) {
  selectedTariffs = selectedTariffs.filter(t => t.id !== tariffId);
}

// 6) Показываем попап и сбрасываем таймер
function showComparePopup() {
  comparePopup.style.display = 'block';
  comparePopupMinimized.style.display = 'none';
  resetHideTimer();
}

// 7) Сворачиваем попап
function hideComparePopup() {
  comparePopup.style.display = 'none';
  comparePopupMinimized.style.display = 'flex';
}

// 8) Сбрасываем/запускаем таймер автосворачивания (10 секунд)
function resetHideTimer() {
  if (hidePopupTimer) {
    clearTimeout(hidePopupTimer);
  }
  hidePopupTimer = setTimeout(() => {
    hideComparePopup();
  }, 10000);
}

// 9) Обновляем интерфейс попапа (список тарифов, счётчик и т.д.)
function updateComparePopupUI() {
  // Обновляем счётчик
  compareCountSpan.textContent = selectedTariffs.length;
  // Обновляем бейдж на свернутом попапе
  compareBadge.textContent = selectedTariffs.length;

  // Заполняем список выбранных тарифов
  compareList.innerHTML = '';
  selectedTariffs.forEach(tariff => {
    const item = document.createElement('div');
    item.classList.add('compare-popup__item');

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('compare-popup__item-name');
    nameSpan.textContent = tariff.name;

    const deleteIcon = document.createElement('div');
    deleteIcon.classList.add('compare-popup__item-delete');
    deleteIcon.addEventListener('click', () => {
      removeTariff(tariff.id);
      saveSelectedTariffs();
      updateComparePopupUI();
      updateCardButtonState(tariff.id, false);
    });

    item.appendChild(nameSpan);
    item.appendChild(deleteIcon);
    compareList.appendChild(item);
  });

  // Если есть выбранные тарифы, показываем развернутый попап,
  // иначе скрываем оба попапа (развернутый и свернутый)
  if (selectedTariffs.length > 0) {
    showComparePopup();
  } else {
    comparePopup.style.display = 'none';
    comparePopupMinimized.style.display = 'none';
  }
}


window.addEventListener("userTariffChanged", () => {
  if(selectedTariffs.length === 0) {
    comparePopupMinimized.style.display = 'none';
  }
  compareBadge.textContent = selectedTariffs.length;
});


// 10) Показать/Скрыть ошибку
function showError() {
  compareError.style.display = 'block';
  setTimeout(() => {
    compareError.style.display = 'none';
  }, 3000);
}

// 11) Удалить все тарифы
function clearAllTariffs() {
  selectedTariffs = [];
  saveSelectedTariffs();
  updateComparePopupUI();
  // Сброс состояния кнопок на карточках
  document.querySelectorAll('.card').forEach(card => {
    const dataStr = card.getAttribute('data-tariff');
    if (!dataStr) return;
    const tariffData = JSON.parse(dataStr);
    updateCardButtonState(tariffData.id, false);
  });
}

// 12) Обновляем состояние кнопки «Добавить к сравнению» на карточке
function updateCardButtonState(tariffId, isSelected) {
  const card = [...document.querySelectorAll('.card')].find(c => {
    const dataStr = c.getAttribute('data-tariff');
    if (!dataStr) return false;
    const data = JSON.parse(dataStr);
    return data.id === tariffId;
  });
  if (!card) return;

  const compareButton = card.querySelector('.card__compare-button');
  if (!compareButton) return;

  const compareButtonText = compareButton.querySelector('.card__compare-button__text');
  const compareButtonImg = compareButton.querySelector('.card__compare-button__img');

  if (isSelected) {
    compareButtonText.textContent = 'Добавлено к сравнению';
    compareButtonImg.classList.add('card__compare-button__img_active');
  } else {
    compareButtonText.textContent = 'Добавить к сравнению';
    compareButtonImg.classList.remove('card__compare-button__img_active');
  }
}

let compareInitialized = false;

// 13) Инициализация логики (вызвать после рендеринга карточек)
export function initCompare() {
  // Считываем выбранные тарифы из localStorage
  loadSelectedTariffs();

  // Обновляем состояние кнопок на карточках (только для элементов с data-tariff)
  document.querySelectorAll('.card').forEach(card => {
    const dataStr = card.getAttribute('data-tariff');
    if (!dataStr) return;
    const tariffData = JSON.parse(dataStr);
    console.log(tariffData);
    const isSelected = isTariffSelected(tariffData.id);
    updateCardButtonState(tariffData.id, isSelected);
  });

  // Навешиваем обработчики только один раз
  if (!compareInitialized) {
    const cardsContainer = document.querySelector('.card-wrapper');
    cardsContainer.addEventListener('click', function(e) {
      const compareButton = e.target.closest('.card__compare-button');
      if (!compareButton) return;

      const card = compareButton.closest('.card');
      if (!card) return;
      const dataStr = card.getAttribute('data-tariff');
      if (!dataStr) return;
      const tariffData = JSON.parse(dataStr);

      // Если тариф уже выбран — удаляем его, иначе добавляем
      if (isTariffSelected(tariffData.id)) {
        removeTariff(tariffData.id);
        updateCardButtonState(tariffData.id, false);
      } else {
        const ok = addTariff(tariffData);
        if (ok) {
          updateCardButtonState(tariffData.id, true);
        }
      }

      // Сохраняем выбранные тарифы и обновляем попап сравнения
      saveSelectedTariffs();
      updateComparePopupUI();
    });

    compareBtn.addEventListener('click', () => {
      console.log('Сравнение тарифов:', selectedTariffs);
      // Здесь можно добавить логику перехода на страницу сравнения
      hideComparePopup()
    });

    clearAllBtn.addEventListener('click', () => {
      clearAllTariffs();
    });

    comparePopupMinimized.addEventListener('click', () => {
      showComparePopup();
    });

    compareInitialized = true;
  }

  // Обновляем UI попапа сравнения (счетчики, список тарифов)
  updateComparePopupUI();
}

  // Объект с данными для характеристик (для цены и мобильной связи логика особая)



// Объект с SVG‑иконками (пример, замените содержимое svg по необходимости)
const svgIcons = {
  checked: `<span class="popup-compare__icon popup-card__status-img_checked"></span>`,
  none: `<span class="popup-compare__icon popup-card__status-img_none"></span>`
};



function populateComparePopup() {
  const container = document.querySelector('.popup-compare__container');

  // Если тарифов нет – выводим блок с сообщением
  if (selectedTariffs.length === 0) {
    container.innerHTML = `
      <div class="popup-compare__empty">
        <p>Сравнивать пока нечего<br>
        Добавьте тарифы, чтобы сравнить их опции.<br>
        Подобрать подходящий тариф стало проще!</p>
        <button class="popup-compare__add-all-btn">Добавить тарифы</button>
      </div>
    `;
    const addAllBtn = container.querySelector('.popup-compare__add-all-btn');
    if (addAllBtn) {
      addAllBtn.addEventListener('click', () => {
        closePopup(fullComparePopup);
        hideComparePopup();
        const navSection = document.querySelector('.nav-section');
        if (navSection) {
          navSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
    return;
  }

  // Если тарифов меньше 4 – добавляем пустышку (placeholder)
  const placeholderExists = selectedTariffs.length < 4;
  const totalTariffCols = selectedTariffs.length + (placeholderExists ? 1 : 0);

  // Объект с SVG-иконками для проверки (здесь можно заменить содержимое на нужные вам SVG)
  const svgIcons = {
    checked: `<span class="popup-compare__icon popup-card__status-img_checked"></span>`,
    none: `<span class="popup-compare__icon popup-card__status-img_none"></span>`
  };

  // Объект с данными для характеристик (кроме цены)
  const propertyData = {
    speed: {
      label: "Скорость тарифа",
      svg: `<svg class="popup-compare__property-icon" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M15.04 19.94a8.507 8.507 0 005.427-7.19h-3.48c-.11 2.928-.848 5.505-1.947 7.19zM12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8.96 4.06a8.507 8.507 0 00-5.427 7.19h3.48c.11-2.928.848-5.505 1.947-7.19zm-.445 7.19c.09-2.266.587-4.243 1.291-5.65.825-1.65 1.688-2.1 2.194-2.1.507 0 1.369.45 2.194 2.1.704 1.407 1.2 3.384 1.291 5.65h-6.97zm0 1.5c.09 2.266.587 4.243 1.291 5.65.825 1.65 1.688 2.1 2.194 2.1.507 0 1.369-.45 2.194-2.1.704-1.407 1.2-3.384 1.291-5.65h-6.97zm-1.501 0c.108 2.928.847 5.505 1.946 7.19a8.507 8.507 0 01-5.427-7.19h3.48zm9.972-1.5c-.108-2.928-.847-5.505-1.946-7.19a8.507 8.507 0 015.427 7.19h-3.48z" clip-rule="evenodd"></path>
            </svg>`,
      suffix: " Мбит/Сек"
    },
    wink: {
      label: "Wink",
      svg: `<svg class="popup-compare__property-icon" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M11.477 12l-1.025 1.049-3.553 3.632 3.312 3.389 7.89-8.07-7.89-8.07L6.9 7.317l3.553 3.634 1.025 1.05zM9.38 12l-4.236 4.332a.5.5 0 000 .699l4.711 4.819a.5.5 0 00.715 0l9.289-9.5a.5.5 0 000-.7l-9.289-9.5a.5.5 0 00-.715 0L5.143 6.968a.5.5 0 000 .699L9.378 12z" clip-rule="evenodd"></path>
            </svg>`,
      subtitle: "Тысячи фильмов и сериалов в высоком качестве"
    },
    channels: {
      label: "Количество каналов",
      svg: `<svg class="popup-compare__property-icon" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M5 4.5h14A1.5 1.5 0 0120.5 6v9a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 15V6A1.5 1.5 0 015 4.5zM2 6a3 3 0 013-3h14a3 3 0 013 3v9a3 3 0 01-3 3h-6.25v1.5H16V21H8v-1.5h3.25V18H5a3 3 0 01-3-3V6zm7.278 2.498h1.995v-.896H6.198v.896h1.977V14h1.103V8.498zm6.79-.896l-1.626 5.005-1.608-5.005h-1.218L13.91 14h1.077l2.303-6.398h-1.222z" clip-rule="evenodd"></path>
            </svg>`,
      suffix: " Каналов"
    },
    sim: {
      label: "Мобильная связь",
      svg: `<svg class="popup-compare__property-icon" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M9 4.5h6A1.5 1.5 0 0116.5 6v12a1.5 1.5 0 01-1.5 1.5H9A1.5 1.5 0 017.5 18V6A1.5 1.5 0 019 4.5zM6 6a3 3 0 013-3h6a3 3 0 013 3v12a3 3 0 01-3 3H9a3 3 0 01-3-3V6zm8 10.5h-4V18h4v-1.5z" clip-rule="evenodd"></path>
            </svg>`
    },
    games: {
      label: "Игровые опции",
      svg: `<svg class="popup-compare__property-icon" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M15.4229 6.52393H6.54952C4.73715 6.52393 3.22457 7.90747 3.06339 9.71266L2.51179 15.8905C2.43344 16.7681 3.12477 17.5239 4.00585 17.5239H4.73342C5.13124 17.5239 5.51277 17.3659 5.79408 17.0846L6.88611 15.9926C7.18617 15.6925 7.59314 15.5239 8.01748 15.5239L13.9346 15.5239C14.359 15.5239 14.766 15.6925 15.066 15.9926L16.158 17.0846C16.4393 17.3659 16.8209 17.5239 17.2187 17.5239H17.9942C18.8779 17.5239 19.5701 16.7638 19.4876 15.8839L18.9076 9.69723C18.739 7.89869 17.2293 6.52393 15.4229 6.52393ZM6.54952 5.02393C3.96042 5.02393 1.79959 7.00042 1.56933 9.57926L1.01774 15.7571C0.861025 17.5123 2.24368 19.0239 4.00585 19.0239H4.73342C5.52907 19.0239 6.29213 18.7079 6.85474 18.1452L7.94677 17.0532C7.96552 17.0345 7.99096 17.0239 8.01748 17.0239L13.9346 17.0239C13.9612 17.0239 13.9866 17.0345 14.0053 17.0532L15.0974 18.1452C15.66 18.7079 16.4231 19.0239 17.2187 19.0239H17.9942C19.7616 19.0239 21.146 17.5037 20.9811 15.7439L20.4011 9.55722C20.1602 6.98787 18.0035 5.02393 15.4229 5.02393H6.54952ZM13.4806 11.0302C14.3115 11.0302 14.9851 10.3573 14.9851 9.5271C14.9851 8.69694 14.3115 8.02396 13.4806 8.02396C12.6497 8.02396 11.9761 8.69694 11.9761 9.5271C11.9761 10.3573 12.6497 11.0302 13.4806 11.0302ZM16.4806 14.0302C17.3115 14.0302 17.9851 13.3573 17.9851 12.5271C17.9851 11.6969 17.3115 11.024 16.4806 11.024C15.6497 11.024 14.9761 11.6969 14.9761 12.5271C14.9761 13.3573 15.6497 14.0302 16.4806 14.0302ZM5.72606 14.0239V12.2739H3.97606V10.7739H5.72606V9.02393H7.22606V10.7739H8.97606V12.2739H7.22606V14.0239H5.72606Z">
            </svg>`
    },
    discount: {
      label: "Размер скидки",
      svg: `<svg class="popup-compare__property-icon" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5958 5C17.8527 4.55767 17.9998 4.04366 17.9998 3.49527C17.9998 2.28651 17.2705 1.19418 16.1557 0.726901C14.4952 0.0308633 12.5919 0.931918 12.0866 2.66008L11.9999 2.95665L11.9132 2.66008C11.408 0.931918 9.50469 0.0308633 7.84417 0.726901C6.72938 1.19418 6 2.28651 6 3.49527C6 4.04366 6.14714 4.55767 6.4041 5H4C3.44772 5 3 5.44772 3 6V9C3 9.74028 3.4022 10.3866 4 10.7324V18.0003C4 19.6572 5.34315 21.0003 7 21.0003H17C18.6569 21.0003 20 19.6572 20 18.0003V10.7324C20.5978 10.3866 21 9.74028 21 9V6C21 5.44772 20.5523 5 20 5H17.5958ZM11.0331 4.99521H8.99995C8.17155 4.99521 7.5 4.32367 7.5 3.49527C7.5 2.89335 7.86439 2.34487 8.42403 2.11028C9.26355 1.75839 10.2208 2.21668 10.4735 3.081L11.0331 4.99521ZM12.9667 4.99521H14.9999C15.8283 4.99521 16.4998 4.32367 16.4998 3.49527C16.4998 2.89335 16.1355 2.34487 15.5758 2.11028C14.7363 1.75839 13.7791 2.21668 13.5264 3.081L12.9667 4.99521ZM4.5 9V6.5H11.25V9.5H5C4.72386 9.5 4.5 9.27614 4.5 9ZM12.75 9.5V6.5H19.5V9C19.5 9.27614 19.2761 9.5 19 9.5H12.75ZM5.5 11H11.25L11.25 19.5003H7C6.17157 19.5003 5.5 18.8287 5.5 18.0003V11ZM12.75 11L12.75 19.5003H17C17.8284 19.5003 18.5 18.8287 18.5 18.0003V11H12.75Z">
            </svg>`
    },
    simCards: {
      label: "5 сим-карт",
      svg: `<svg class="popup-compare__property-icon" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M19.5 8v8a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 16v-4.757c0-.398.158-.78.44-1.061l3.242-3.243a1.5 1.5 0 011.06-.439H18A1.5 1.5 0 0119.5 8zM6 19a3 3 0 01-3-3v-4.757a3 3 0 01.879-2.122L7.12 5.88A3 3 0 019.243 5H18a3 3 0 013 3v8a3 3 0 01-3 3H6zm7-8.5h3a.5.5 0 01.5.5v3a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5zm-2 .5a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3z" clip-rule="evenodd"></path>
            </svg>`,
      subtitle: "Единый баланс Гб, минут и СМС для всех сим-карт, входящих в пакет"
    }
  };

  // Порядок характеристик (стоимость обрабатывается отдельно)
  const keysOrder = ["speed", "wink", "channels", "sim", "games", "discount", "simCards"];

  let htmlContent = '';

  // --- Заголовок (первая строка) ---
  htmlContent += `
    <div class="popup-compare__tile-row popup-compare__tile-row_head">
      <div class="popup-compare__tile-col popup-compare__tile-col-property">
        <span class="popup-compare__property-title">Параметры <br>тарифов</span>
      </div>`;
  selectedTariffs.forEach(t => {
    htmlContent += `
      <div class="popup-compare__tile-col popup-compare__tile-col_offer popup-compare__tile-col_white tile-scroll" data-tariff-id="${t.id}">
        <button class="popup-compare__tile-col_offer-close-btn"></button>
        <p class="popup-compare__offer">${t.name}</p>
      </div>`;
  });
  if (placeholderExists) {
    htmlContent += `
      <div class="popup-compare__tile-col popup-compare__tile-plug tile-scroll">
        <button class="popup-compare__add-btn">Добавить тариф</button>
      </div>`;
  }
  htmlContent += `</div>`;

  // --- Тело (ряды с характеристиками) ---
  keysOrder.forEach(key => {
    const prop = propertyData[key];
    if (!prop) return;
    // Для "Размер скидки": если discount пустой во всех тарифах, строку не показываем
    if (key === "discount") {
      const hasDiscount = selectedTariffs.some(t => t.discount && t.discount.trim() !== '');
      if (!hasDiscount) return;
    }
    // Проверяем наличие значений
    let hasValue = false;
    if (key === "sim") {
      hasValue = selectedTariffs.some(t => t.sim_description && (t.sim_description.min || t.sim_description.gb || t.sim_description.sms));
    } else if (key === "games") {
      hasValue = selectedTariffs.some(t => t.game_options === true);
    } else if (key === "simCards") {
      hasValue = selectedTariffs.some(t => t.sim_cards && t.sim_cards.trim() !== '');
    } else if (key === "wink") {
      hasValue = selectedTariffs.some(t => t.wink_description && t.wink_description.trim() !== '');
    } else {
      hasValue = selectedTariffs.some(t => t[key] && t[key].trim() !== '');
    }
    if (!hasValue) return;
    
    htmlContent += `<div class="popup-compare__tile-row">`;
    htmlContent += `
      <div class="popup-compare__tile-col popup-compare__tile-col-property">
        <div class="popup-compare__title-container">
          ${prop.svg}
          <span class="popup-compare__property-title">${prop.label}</span>
        </div>
          ${prop.subtitle ? `<span class="popup-compare__property-subtitle">${prop.subtitle}</span>` : ''}
      </div>`;
    selectedTariffs.forEach(t => {
      let value = '';
      if (key === "sim") {
        if (t.sim_description) {
          const min = t.sim_description.min ? t.sim_description.min + ' Минут' : '';
          const gb = t.sim_description.gb ? t.sim_description.gb + ' ГБ' : '';
          const sms = t.sim_description.sms ? t.sim_description.sms + ' СМС' : '';
          value = [min, gb, sms].filter(Boolean).join(', ');
        }
        if (!value) {
          value = svgIcons.none;
        }
      } else if (key === "games") {
        value = t.game_options === true ?
                svgIcons.checked : svgIcons.none;
      } else if (key === "simCards") {
        value = (t.sim_cards && t.sim_cards.trim() === "5") ? svgIcons.checked : svgIcons.none;
      } else if (key === "wink") {
        value = (t.wink_description && t.wink_description.trim() !== '') ? t.wink_description : svgIcons.none;
      } else {
        value = (t[key] && t[key].trim() !== '') ? t[key] : svgIcons.none;
        if (prop.suffix && value.indexOf("popup-card__status-img_none") === -1) {
          value += prop.suffix;
        }
        
      }
      if (key === "discount") {
        if (t.discount && t.discount.trim() !== '') {
          value = t.discount + (t.discount_duration && t.discount_duration.trim() !== '' ? ' на ' + t.discount_duration : '');
        } else {
          value = svgIcons.none;
        }
      }
      htmlContent += `
        <div class="popup-compare__tile-col popup-compare__tile-col_white tile-scroll">
          ${value}
        </div>`;
    });
    if (placeholderExists) {
      htmlContent += `<div class="popup-compare__tile-col popup-compare__tile-plug tile-scroll"></div>`;
    }
    htmlContent += `</div>`;
  });

  // --- Цена (особая логика) ---
  const hasPricePromo = selectedTariffs.some(t => t.price_promo && t.price_promo.trim() !== '');
  if (hasPricePromo) {
    htmlContent += `<div class="popup-compare__tile-row">`;
    htmlContent += `
      <div class="popup-compare__tile-col popup-compare__tile-col-property">
        <div class="popup-compare__title-container">
          <svg class="popup-compare__property-icon" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M18.25 7.012H19a2 2 0 012 2V18.055a3 3 0 01-3 3H6a3 3 0 01-3-3V9.012a2 2 0 012-2h2.874l6.485-3.755a1.495 1.495 0 012.046.548l1.846 3.207zm-1.73 0l-1.413-2.455-4.24 2.455h5.653zm2.48 1.5H5a.5.5 0 00-.5.5v9.043a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5v-1.012H14a2 2 0 01-2-2v-2.019a2 2 0 012-2h5.5V9.012a.5.5 0 00-.5-.5zm.5 4.012v3.019H14a.5.5 0 01-.5-.5v-2.019a.5.5 0 01.5-.5h5.5z" clip-rule="evenodd"></path>
          </svg>
          <span class="popup-compare__property-title">Стоимость</span>
        </div>
      </div>`;
    selectedTariffs.forEach(t => {
      htmlContent += `
        <div class="popup-compare__tile-col popup-compare__tile-col_white tile-scroll">
          <div class="popup-compare__tile-price-container">`;
      if (t.price_after_promo && t.price_after_promo.trim() !== '') {
        htmlContent += `
            <div class="popup-compare__tile-price">${t.price_after_promo}</div>
            <div class="popup-compare__tile-price-promo">${t.price_promo && t.price_promo.trim() !== '' ? t.price_promo : svgIcons.none}</div>
            <div class="popup-compare__tile-price-text">₽/мес</div>`;
      } else {
        htmlContent += `
            <div class="popup-compare__tile-price-promo">${t.price_promo && t.price_promo.trim() !== '' ? t.price_promo : svgIcons.none}</div>
            <div class="popup-compare__tile-price-text">₽/мес</div>`;
      }
      htmlContent += `
          </div>
        </div>`;
    });
    if (placeholderExists) {
      htmlContent += `<div class="popup-compare__tile-col popup-compare__tile-plug tile-scroll"></div>`;
    }
    htmlContent += `</div>`;
  }





  // --- Нижняя строка (кнопки "Подключить") ---
  htmlContent += `<div class="popup-compare__tile-row popup-compare__tile-row_bottom">
    <div class="popup-compare__tile-col popup-compare__tile-col-property"></div>`;
  selectedTariffs.forEach(t => {
    htmlContent += `
      <div class="popup-compare__tile-col popup-compare__tile-col_white tile-scroll">
        <button class="popup-compare__connect-btn" data-tariff='${JSON.stringify(t)}'>Подключить</button>
      </div>`;
  });
  if (placeholderExists) {
    htmlContent += `<div class="popup-compare__tile-col popup-compare__tile-plug tile-scroll"></div>`;
  }
  htmlContent += `</div>`;

  container.innerHTML = htmlContent;

  // Привязываем обработчики для кнопок удаления тарифов
  container.querySelectorAll('.popup-compare__tile-col_offer-close-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tariffCol = this.closest('.popup-compare__tile-col_offer');
      const tariffId = tariffCol ? tariffCol.getAttribute('data-tariff-id') : null;
      if (tariffId) {
        removeTariffFromCompare(tariffId);
      }
    });
  });

  // Привязываем обработчик для кнопки "Добавить тариф"
  const addBtn = container.querySelector('.popup-compare__add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      closePopup(fullComparePopup);
      hideComparePopup();
      const navSection = document.querySelector('.nav-section');
      if (navSection) {
        navSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const connectBtns = container.querySelectorAll('.popup-compare__connect-btn');
  connectBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tariffData = JSON.parse(btn.getAttribute("data-tariff") || "{}");
      openConnectFlow(null, tariffData);
    });
  });

  initCompareSlider();
}




function removeTariffFromCompare(tariffId) {
  removeTariff(tariffId)
  saveSelectedTariffs();
  updateCardButtonState(tariffId, false);
  populateComparePopup();
  window.dispatchEvent(new Event("userTariffChanged"));
}


// Функция инициализации слайдера для попапа сравнения
function initCompareSlider() {
    // Элементы попапа
    console.log(12344)
    const popupContainer = document.querySelector('.popup-compare__container');
    const rows = Array.from(popupContainer.querySelectorAll('.popup-compare__tile-row'));
    const navBar = document.querySelector('.popup-compare__nav-bar')
    const prevArrow = document.querySelector('.arrow-prev');
    const nextArrow = document.querySelector('.arrow-next');
    const dotsContainer = document.querySelector('.popup-compare__dots');
  
    // Заголовок с тарифными колонками
    const headerRow = popupContainer.querySelector('.popup-compare__tile-row_head');
    const tariffCols = headerRow.querySelectorAll('.popup-compare__tile-col_offer');
    const plugCol = headerRow.querySelector('.popup-compare__tile-plug');
    const tariffCount = tariffCols.length;
  
    // Если тарифов 4, то заглушки не должно быть – иначе, если тарифов 3 и меньше, заглушка добавляется.
    let plugColumnExists;
    if (tariffCount === 4) {
      if (plugCol) {
        plugCol.style.display = 'none';
      }
      plugColumnExists = false;
    } else {
      if (plugCol) {
        plugCol.style.display = '';
      }
      plugColumnExists = true;
    }
    // Общее число тарифных колонок для прокрутки = количество тарифов плюс заглушка (если она есть)
    const totalColumns = tariffCount + (plugColumnExists ? 1 : 0);
  
    // Глобальные переменные карусели
    let currentIndex = 0;            // Индекс первого видимого тарифного столбца (от 0 до totalColumns - 1)
    let tariffColumnWidth = 0;       // Ширина одного тарифного столбца (рассчитывается динамически)
    let visibleCount = 0;            // Сколько тарифных колонок умещается в видимой области
    let isAnimating = false;
    const animationDuration = 300;   // Длительность анимации в мс
  
    // Функция для динамического определения gap
    function getGridGap() {
      // Если ширина окна меньше 1024, gap = 4px, иначе 8px
      return window.innerWidth < 1024 ? 4 : 8;
    }
  
    // Пересчёт размеров и количества видимых тарифных колонок
    function updateDimensions() {
      if (tariffCols.length > 0) {
        tariffColumnWidth = tariffCols[0].offsetWidth;
      }
      const gridGap = getGridGap();
      // Доступная ширина = ширина строки за вычетом фиксированной колонки (характеристик)
      const firstRow = rows[0];
      const propertyCol = firstRow.querySelector('.popup-compare__tile-col-property');
      if (!propertyCol) return;
      const availableWidth = firstRow.offsetWidth - propertyCol.offsetWidth;
      visibleCount = Math.floor((availableWidth + gridGap) / (tariffColumnWidth + gridGap));
      // Ограничиваем visibleCount от 1 до totalColumns
      visibleCount = Math.max(1, Math.min(visibleCount, totalColumns));
    }
  
    // Отображение/скрытие стрелок
    function updateArrowsVisibility() {
      if (totalColumns <= visibleCount) {
        navBar.style.display = 'none';
      } else {
        navBar.style.display = '';
      }
    }
  
    // Обновление активных точек (dots)
    function updateDots() {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalColumns; i++) {
        const dot = document.createElement('span');
        dot.classList.add('popup-compare__dot');
        // Активные точки – это те, что попадают в окно: от currentIndex до currentIndex + visibleCount
        if (i >= currentIndex && i < currentIndex + visibleCount) {
          dot.classList.add('popup-compare__dot_active');
        }
        dotsContainer.appendChild(dot);
      }
    }
  
    // Анимация прокрутки от позиции from до to за animationDuration мс
    function animateScroll(from, to, callback) {
      const startTime = performance.now();
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        const current = from + (to - from) * progress;
        
        // Применяем transform только к тарифным колонкам (все столбцы, кроме колонки с характеристиками)
        rows.forEach(row => {
          const children = row.querySelectorAll('.popup-compare__tile-col:not(.popup-compare__tile-col-property)');
          children.forEach(child => {
            child.style.transform = `translateX(${-current}px)`;
          });
        });
    
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          if (callback) callback();
        }
      }
      requestAnimationFrame(animate);
    }
  
    
    
    // Переключение слайда на заданный индекс
    function slideTo(index) {
      if (isAnimating) return;
      
      // Максимально возможный индекс, чтобы последняя колонка попала на экран
      const maxIndex = totalColumns - visibleCount;
      index = Math.max(0, Math.min(index, maxIndex));
      
      if (index === currentIndex) return;
      
      isAnimating = true;
      const gridGap = getGridGap();
      const partialPeek = 0; // Подберите нужное значение, например 50px
      
      let from, to;
      
      // Вычисляем исходное смещение (from)
      if (currentIndex === maxIndex) {
        // Если мы уже на последнем слайде, смещение берём с эффектом peek
        const contentWidth = totalColumns * (tariffColumnWidth + gridGap);
        const firstRow = rows[0];
        const propertyCol = firstRow.querySelector('.popup-compare__tile-col-property');
        const availableWidth = firstRow.offsetWidth - propertyCol.offsetWidth;
        const leftover = contentWidth - availableWidth;
        from = leftover - partialPeek;
        if (from < 0) { from = 0; }
      } else {
        from = currentIndex * (tariffColumnWidth + gridGap);
      }
      
      // Вычисляем целевое смещение (to)
      if (index === maxIndex) {
        const contentWidth = totalColumns * (tariffColumnWidth + gridGap);
        const firstRow = rows[0];
        const propertyCol = firstRow.querySelector('.popup-compare__tile-col-property');
        const availableWidth = firstRow.offsetWidth - propertyCol.offsetWidth;
        const leftover = contentWidth - availableWidth;
        to = leftover - partialPeek;
        if (to < 0) { to = 0; }
      } else {
        to = index * (tariffColumnWidth + gridGap);
      }
      
      animateScroll(from, to, () => {
        currentIndex = index;
        isAnimating = false;
        updateDots();
      });
    }
    
    
    // Переход к следующему слайду (сдвиг на 1)
    function slideNext() {
      if (currentIndex < totalColumns - visibleCount) {
        slideTo(currentIndex + 1);
      }
    }
    
    // Переход к предыдущему слайду
    function slidePrev() {
      if (currentIndex > 0) {
        slideTo(currentIndex - 1);
      }
    }
    
    // Обработчики клика по стрелкам
    nextArrow.addEventListener('click', slideNext);
    prevArrow.addEventListener('click', slidePrev);
    
    // Обработка свайпов (touch-события)
    let touchStartX = 0;
    let touchCurrentX = 0;
    let isTouching = false;
    
    popupContainer.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        isTouching = true;
      }
    });
    
    popupContainer.addEventListener('touchmove', function(e) {
      if (!isTouching) return;
      touchCurrentX = e.touches[0].clientX;
      e.preventDefault();
    });
    
    popupContainer.addEventListener('touchend', function(e) {
      if (!isTouching) return;
      const deltaX = touchStartX - touchCurrentX;
      const swipeThreshold = 50; // порог для срабатывания свайпа (в пикселях)
      if (deltaX > swipeThreshold) {
        slideNext();
      } else if (deltaX < -swipeThreshold) {
        slidePrev();
      }
      isTouching = false;
    });
    
   window.addEventListener('resize', function() {
    updateDimensions();
    updateArrowsVisibility();
  
    const gridGap = getGridGap();
    const maxIndex = totalColumns - visibleCount;
    // Если currentIndex теперь выходит за пределы, корректируем его:
    if (currentIndex > maxIndex) {
      currentIndex = maxIndex;
    }
  
    // Если после ресайза видимых тарифных колонок стало больше, 
    // возможно, нужно сбросить позицию в начало (например, currentIndex = 0)
    // Или можно оставить текущий currentIndex, если он не превышает maxIndex.
    // Здесь я оставляю корректировку currentIndex = maxIndex, если нужно – сбросьте в 0
  
    rows.forEach(row => {
      const children = row.querySelectorAll('.popup-compare__tile-col:not(.popup-compare__tile-col-property)');
      children.forEach(child => {
        child.style.transition = 'none';
  
        let offset;
        // Если мы на последнем слайде, применяем логику peek
        if (currentIndex === maxIndex) {
          const contentWidth = totalColumns * (tariffColumnWidth + gridGap);
          const firstRow = rows[0];
          const propertyCol = firstRow.querySelector('.popup-compare__tile-col-property');
          const availableWidth = firstRow.offsetWidth - propertyCol.offsetWidth;
          const leftover = contentWidth - availableWidth;
          const partialPeek = 50; // подберите нужное значение peek
          offset = leftover - partialPeek;
          if (offset < 0) { offset = 0; }
        } else {
          offset = currentIndex * (tariffColumnWidth + gridGap);
        }
        
        child.style.transform = `translateX(${-offset}px)`;
      });
    });
    
    updateDots();
  });
    
    // Начальная настройка
    updateDimensions();
    updateArrowsVisibility();
    updateDots();
};

// --- Обработчик нажатия на кнопку "Сравнить тарифы" ---
compareBtn.addEventListener('click', () => {
  console.log('Сравнение тарифов:', selectedTariffs);
  updateComparePopupUI(); // обновление маленького попапа, если нужно
  populateComparePopup();
  openPopup(fullComparePopup);
  requestAnimationFrame(() => {
    initCompareSlider();
  });
});

document.querySelectorAll('.popup-compare__header-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.popup-compare__header-button').forEach(btn => btn.classList.remove('popup-compare__header-button_active'));
    button.classList.add('popup-compare__header-button_active');

    if (button.textContent.trim().toLowerCase().includes('разница')) {
      document.querySelectorAll('.popup-compare__tile-row').forEach(row => {
        if (row.classList.contains('popup-compare__tile-row_head') || row.classList.contains('popup-compare__tile-row_bottom')) return;
        // Выбираем только ячейки тарифов (с классом popup-compare__tile-col_white)
        const cells = Array.from(row.querySelectorAll('.popup-compare__tile-col_white'));
        const values = cells.map(cell => cell.textContent.trim());
        if (values.length > 0 && values.every(val => val === values[0] && val !== '')) {
          // Накладываем opacity только на ячейки тарифов
          cells.forEach(cell => cell.style.opacity = '0.5');
        } else {
          cells.forEach(cell => cell.style.opacity = '');
        }
      });
    } else {
      document.querySelectorAll('.popup-compare__tile-row').forEach(row => {
        const cells = row.querySelectorAll('.popup-compare__tile-col_white');
        cells.forEach(cell => cell.style.opacity = '');
      });
    }
  });
});