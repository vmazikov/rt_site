import { initEquipmentSwiper } from './equipmentSwiper.js';

// Глобальная переменная (или модульная) для хранения загруженных данных
let equipmentData = [];

// Функция, которая генерирует карточки и инициализирует слайдер
function renderEquipment() {
  // 1) Генерируем карточки
  generateEquipmentCards(equipmentData);
  // 2) Инициализируем (или переинициализируем) слайдер
  initEquipmentSwiper();
}

// Функция генерации карточек оборудования из массива данных
function generateEquipmentCards(equipmentArray) {
  const container = document.querySelector('.equipment-section__items-container');
  container.innerHTML = ''; // очищаем контейнер

  // Получаем город пользователя из localStorage
  let userCity = null;
  try {
    const userLocation = JSON.parse(localStorage.getItem('userLocation'));
    userCity = userLocation && userLocation.city;
  } catch (e) {
    userCity = null;
  }

  // Города со скидками
  const discountCities = ['Кемерово', 'Новокузнецк', 'CityC'];

  equipmentArray.forEach(item => {
    // Копируем, чтобы не портить оригинальный объект
    const product = { ...item };

    // Если город в списке скидок — меняем цены
    if (userCity && discountCities.includes(userCity)) {
      if (product["data-category"] === "routers" && product.price?.rent) {
        product.price.rent = "99";
      }
      if (
        product["data-category"] === "set-top-boxes" &&
        product.model === "Wink" &&
        product.price?.rent
      ) {
        product.price.rent = "50";
      }
    }

    // Формируем HTML карточки
    // Генерируем HTML карточки с динамическим выбором типа оплаты
    let priceHtml = '';
    if (product.price?.rent) {
      priceHtml = `
        <p class="equipment-section__carousel__item-text">Аренда</p>
        <p class="equipment-section__carousel__item-text equipment-section__carousel__item-text_price">${product.price.rent} ₽/мес</p>
      `;
    } else if (product.price?.credit || product.price?.credit_12) {
      // Используем, например, credit или credit_12, если они есть
      const creditPrice = product.price.credit || product.price.credit_12;
      priceHtml = `
        <p class="equipment-section__carousel__item-text">Рассрочка</p>
        <p class="equipment-section__carousel__item-text equipment-section__carousel__item-text_price">от ${creditPrice} ₽/мес</p>
      `;
    } else if (product.price?.buy) {
      priceHtml = `
        <p class="equipment-section__carousel__item-text">Покупка</p>
        <p class="equipment-section__carousel__item-text equipment-section__carousel__item-text_price">${product.price.buy} ₽</p>
      `;
    }

    const cardHTML = `
      <div class="equipment-section__item" data-category="${product["data-category"]}">
        <div class="equipment-section__carousel__item-img-section">
          <img class="equipment-section__carousel__item-img" src="${product.picture}" alt="${product.model}">
        </div>
        <div>
          <p class="equipment-section__carousel__item-text">${product.type}</p>
          <p class="equipment-section__carousel__item-text equipment-section__carousel__item-text_model">${product.model}</p>
          ${ priceHtml }
        </div>
      </div>
    `;
    container.innerHTML += cardHTML;
  });
}

// 1) Загружаем данные из equipment.json
fetch('../json/equipment.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Ошибка загрузки equipment.json');
    }
    return response.json();
  })
  .then(data => {
    // Сохраняем в переменную
    equipmentData = data;
    // Рендерим карточки + слайдер
    renderEquipment();
  })
  .catch(error => {
    console.error('Error loading equipment data:', error);
  });

// 2) Слушаем кастомное событие userLocationChanged
//    Когда оно происходит, снова рендерим карточки + слайдер
window.addEventListener('userLocationChanged', () => {
  renderEquipment();
});
