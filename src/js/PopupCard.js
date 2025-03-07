import {attachEventListeners, openPopup} from "./index.js"
import internetIcon from "../assets/images/internet_icon.png";
import routerIcon from "../assets/images/router_icon.png";
import tvCardIcon from "../assets/images/tv-card_icon.png";
import winkIcon from "../assets/images/wink_icon.png";
import smartphoneIcon from "../assets/images/smartphone_icon.png";
import checkIcon from "../assets/images/check_icon.png";
import downArrow from "../assets/images/down-arrow.png";
import videoIcon from "../assets/images/video-camera-icon.png";
import gameIcon from "../assets/images/gaming.png";
import tvBoxIcon from "../assets/images/tv-box-icon.png";

import { openConnectFlow } from "./index.js";
// Делегирование кликов на контейнере карточек (.card-wrapper)
const cardsContainer = document.querySelector('.card-wrapper');

cardsContainer.addEventListener('click', function(e) {
  // Если клик по кнопке "Подключить" – ничего не делаем
  if (e.target.closest('.card__connect-btn')) return;

  // Находим карточку, в которую попал клик (если клик произошёл внутри нее)
  const card = e.target.closest('.card');
  if (!card) return;

  const tariffData = JSON.parse(card.getAttribute('data-tariff'));
  updatePopupContent(tariffData);
  const popup = document.querySelector('.popup-card');
  openPopup(popup);
});

// Закрытие попапа по кнопке закрытия
document.querySelector('.popup__close-button').addEventListener('click', function() {
  const popup = this.closest('.popup');
  closePopup(popup);
});


// Функция обновления содержимого попапа на основе данных тарифа
function updatePopupContent(tariffData) {
  const popup = document.querySelector('.popup-card');
  popup.setAttribute("data-tariff", JSON.stringify(tariffData));
  // Обновляем заголовок и описание
  popup.querySelector('.popup-card__title').textContent = tariffData.name || '';
  popup.querySelector('.popup-card__description').textContent = tariffData.tariff_description || '';
  
  // Получаем данные userLocation из localStorage
  let userLocation = {};
  const userLocationStr = localStorage.getItem("userLocation");
  if (userLocationStr) {
    try {
      userLocation = JSON.parse(userLocationStr);
    } catch (e) {
      console.error("Ошибка парсинга userLocation:", e);
    }
  }
  
// Обновляем блок статуса в попапе в зависимости от userLocation.techResult.isPossible
const statusContainer = popup.querySelector('.popup-card__status');
const techResult = userLocation.techResult;

// 1) Тариф доступен
if (techResult && techResult.isPossible === true) {
  statusContainer.innerHTML = `
    <p class="popup-card__status-text">Доступен по вашему адресу</p>
    <span class="popup-card__status-img popup-card__status-img_checked"></span>
  `;

// 2) Тариф недоступен
} else if (techResult && techResult.isPossible === false) {
  statusContainer.innerHTML = `
    <p class="popup-card__status-text">
      Тариф не доступен по вашему адресу.
      <a href="#" class="popup-card__adrress-link">Изменить</a>
    </p>
    <span class="popup-card__status-img popup-card__status-img_none"></span>
  `;

// 3) Адрес не определён (null, undefined и т.д.)
} else {
  statusContainer.innerHTML = `
    <p class="popup-card__status-text">
      Проверьте, доступен ли тариф по вашему адресу.
      <a href="#" class="popup-card__adrress-link">Укажите адрес</a>
    </p>
    <span class="popup-card__status-img popup-card__status-img_location"></span>
  `;
}
  
  // Формируем динамические секции для popup-card__items
  const itemsContainer = popup.querySelector('.popup-card__items');
  let itemsHTML = '';
  
  // Секция для интернета, если есть data.speed
  if (tariffData.speed) {
    itemsHTML += `
      <div class="popup-card__item popup-card__item_internet">
        <div class="popup-card__item-container">
          <div class="popup-card__container-items">
            <div class="popup-card__item-section">
              <img class="popup-card__item__img" src="${internetIcon}" alt="">
              <h3 class="popup-card__item__title">Интернет: <span class="popup-card__item__title_speed">${tariffData.speed}</span> Мбит/с</h3>
              <img class="popup-card__item__button-arrow" src="${downArrow}" alt="">
            </div>
            <span class="popup-card__item__title-span"></span>
            <div class="popup-card__item-content">
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">Скорость:</span>
                <span class="popup-card__item-content__additional-item">
                  <span class="popup-card__item-content__additional-item_speed">${tariffData.speed}</span> Мбит/с
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">Технология подключения:</span>
                <span class="popup-card__item-content__additional-item popup-card__item-content__additional-item_technology">
                  ${tariffData.technology ? tariffData.technology.toUpperCase() : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Секция для телевидения, если есть data.channels
  if (tariffData.channels) {
    itemsHTML += `
      <div class="popup-card__item popup__item_tv">
        <div class="popup-card__item-container">
          <div class="popup-card__container-items">
            <div class="popup-card__item-section">
              <img class="popup-card__item__img" src="${tvCardIcon}" alt="">
              <h3 class="popup-card__item__title">ТВ: <span class="popup-card__item__title_channels">${tariffData.channels}</span> Каналов</h3>
              <img class="popup-card__item__button-arrow" src="${downArrow}" alt="">
            </div>
            <span class="popup-card__item__title-span"></span>
            <div class="popup-card__item-content">
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">ТВ каналы:</span>
                <span class="popup-card__item-content__additional-item popup-card__item-content__additional-item_channels">${tariffData.channels}</span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">Архив ТВ-каналов:</span>
                <span class="popup-card__item-content__additional-item">72 часа</span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}">
                  Управление эфиром – просмотр архива телепередач, возможность постановки программы на паузу и перемотки на нужный момент
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}">
                  Родительский контроль - возможность устанавливать период просмотра телевидения, фильтруя контент по возрастному цензу
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}">
                  Просмотр телевидения на любом устройстве: телевизоре, смартфоне, планшете, ПК
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Секция для мобильной связи, если есть data.sim_cards и data.sim_description
  if (tariffData.sim_cards && tariffData.sim_description) {
    itemsHTML += `
      <div class="popup-card__item popup-card__item_mobile">
        <div class="popup-card__item-container">
          <div class="popup-card__container-items">
            <div class="popup-card__item-section">
              <img class="popup-card__item__img" src="${smartphoneIcon}" alt="">
              <h3 class="popup-card__item__title">
                Связь: <span class="popup-card__item__title_sim">
                  ${tariffData.sim_description.min} МИН ${tariffData.sim_description.gb} ГБ ${tariffData.sim_description.sms} СМС
                </span>
              </h3>
              <img class="popup-card__item__button-arrow" src="${downArrow}" alt="">
            </div>
            <span class="popup-card__item__title-span"></span>
            <div class="popup-card__item-content">
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">Минуты:</span>
                <span class="popup-card__item-content__additional-item popup-card__item-content__additional-item_min">${tariffData.sim_description.min}</span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">ГБ:</span>
                <span class="popup-card__item-content__additional-item popup-card__item-content__additional-item_gb">${tariffData.sim_description.gb}</span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">СМС:</span>
                <span class="popup-card__item-content__additional-item popup-card__item-content__additional-item_sms">${tariffData.sim_description.sms}</span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">Количество Сим:</span>
                <span class="popup-card__item-content__additional-item popup-card__item-content__additional-item_count-sim">${tariffData.sim_cards}</span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}">
                  Мобильная связь Ростелекома работает на сетях t2
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}">
                  Безлимитный трафик на соцсети и мессенджеры
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}">
                  Широкая зона покрытия мобильной связью
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Секция для Wink (если есть data.wink_description)
  if (tariffData.wink_description) {
    itemsHTML += `
      <div class="popup-card__item popup-card__item_wink">
        <div class="popup-card__item-container">
          <div class="popup-card__container-items">
            <div class="popup-card__item-section">
              <img class="popup-card__item__img" src="${winkIcon}" alt="">
              <h3 class="popup-card__item__title">Wink</h3>
              <img class="popup-card__item__button-arrow" src="${downArrow}" alt="">
            </div>
            <span class="popup-card__item__title-span">${tariffData.wink_description}</span>
            <div class="popup-card__item-content">
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Огромный выбор контента. В каталоге представлено более 80 000 фильмов и сериалов в Full HD. Фильмотека регулярно обновляется отечественными и зарубежными новинками.
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Доступ к контенту с любого устройства. В одну учётную запись можно войти с 5 разных гаджетов
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Просмотр фильмов без доступа к интернету. Можно загружать кино и сериалы на мобильные устройства и смотреть даже там, где нет стабильного интернета (на даче или в поездке)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (tariffData.name === "Игровой") {
    itemsHTML += `
      <div class="popup-card__item popup-card__item_games">
        <div class="popup-card__item-container">
          <div class="popup-card__container-items">
            <div class="popup-card__item-section">
              <img class="popup-card__item__img" src="${gameIcon}" alt="">
              <h3 class="popup-card__item__title">Игровые опции</h3>
              <img class="popup-card__item__button-arrow" src="${downArrow}" alt="">
            </div>
            <span class="popup-card__item__title-span"></span>
            <div class="popup-card__item-content">
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Надежный высокоскоростной доступ в интернет
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Низкий пинг в играх
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Эксклюзивные игровые бонусы от Lesta Games, VK Play и Фогейм
                </span>
              </div>
                            <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Возможность подключить еще один игровой аккаунт для себя или для друга
                </span>
              </div>
                            <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Облачные игры VK Play, игровая валюта и скины по специальной цене для абонентов тарифа
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Секция для видеонаблюдения (если есть data.video)
  if (tariffData.video) {
    itemsHTML += `
      <div class="popup-card__item popup-card__item_video">
        <div class="popup-card__item-container">
          <div class="popup-card__container-items">
            <div class="popup-card__item-section">
              <img class="popup-card__item__img" src="${videoIcon}" alt="">
              <h3 class="popup-card__item__title">Видеонаблюдение</h3>
              <img class="popup-card__item__button-arrow" src="${downArrow}" alt="">
            </div>
            <span class="popup-card__item__title-span"></span>
            <div class="popup-card__item-content">
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">Количество камер:</span>
                <span class="popup-card__item-content__additional-item">${tariffData.video}</span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">Количество дней хранения:</span>
                <span class="popup-card__item-content__additional-item">7</span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Все данные с видеокамер сохраняются на удаленном облачном сервисе Ростелекома от 7 до 30 дней
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> Ведите удаленный контроль из любой точки мира с любого устройства с интернетом и не ограничивайте себя в передвижениях
                </span>
              </div>
              <div class="popup-card__item-content__additional">
                <span class="popup-card__item-content__additional-item">
                  <img class="card__additional-info-img" src="${checkIcon}"> В архиве в любой момент можно найти нужную запись с камеры видеонаблюдения по дате и времени события
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 6. Секция для Wi‑Fi роутера (если есть router_price)
  if (tariffData.router_price) {
    itemsHTML += `
          <div class="popup-card__item popup-card__item_router">
            <div>
              <div class="popup-card__item-container">
                <div class="popup-card__container-items">
                  <div class="popup-card__item-section">
                    <img class="popup-card__item__img" src="${routerIcon}" alt="Интернет">
                    <span class="popup-card__item__title">Wi-Fi роутер</span>
                    <label class="popup-card__item__label">
                      <input type="checkbox" class="popup-card__toggle" id="wifi-router" checked>
                      <span class="popup-card__toggle__label"></span>
                    </label>
                  </div>
                  <span class="popup-card__item__title-span"></span>
                </div>
              </div>
            </div>
          </div>
    `;
  }
  
  // 7. Секция для ТВ‑приставки (если есть tv-box) – отделённая секция!
  if (tariffData.tv_box) {
    itemsHTML += `          
          <div class="popup-card__item popup-card__item_tv-box">
            <div>
              <div class="popup-card__item-container">
                <div class="popup-card__container-items">
                  <div class="popup-card__item-section">
                    <img class="popup-card__item__img" src="${tvBoxIcon}" alt="">
                    <span class="popup-card__item__title">ТВ-приставка</span>
                    <label class="popup-card__item__label">
                      <input type="checkbox" class="popup-card__toggle" id="tv-box">
                      <span class="popup-card__toggle__label"></span>
                    </label>
                  </div>
                  <span class="popup-card__item__title-span">Для просмотра ТВ-каналов на некоторых телевизорах</span>
                </div>
              </div>
            </div>
          </div>
    `;
  }

  // Вставляем сформированную разметку в контейнер popup-card__items
  itemsContainer.innerHTML = itemsHTML;

  function setupEquipmentSelection(tariffData) {
    const pricingContainer = document.querySelector('.popup-card__pricing__detail-equipment'); // Контейнер с ценами
    const routerToggle = document.querySelector('#wifi-router');
    const tvBoxToggle = document.querySelector('#tv-box');

    function updatePricing() {
        // Очищаем контейнер перед обновлением
        pricingContainer.innerHTML = '';

        // Определяем название оборудования в зависимости от технологии
        let routerTitle = '';
        if (tariffData.technology === 'gpon') {
            routerTitle = 'Оптический модем с Wi-Fi';
        } else if (tariffData.technology === 'fttb') {
            routerTitle = 'WiFi Роутер';
        }

        // Если Wi-Fi роутер включен
        if (routerToggle && routerToggle.checked) {
            const routerPrice = tariffData.router_price || '0 ₽/мес';
            pricingContainer.innerHTML += `
                <div class="popup-card__pricing-detail" id="router-price">
                  <span class="popup-card__pricing__subtitle">${routerTitle}</span>
                  <span class="popup-card__pricing__value">${routerPrice}</span>
                </div>
            `;
        }

        // Если ТВ-приставка включена
        if (tvBoxToggle && tvBoxToggle.checked) {
            const tvBoxPrice = tariffData.tv_box || '0 ₽/мес';
            pricingContainer.innerHTML += `
                <div class="popup-card__pricing-detail" id="tv-box-price">
                  <span class="popup-card__pricing__subtitle">ТВ приставка</span>
                  <span class="popup-card__pricing__value">${tvBoxPrice}</span>
                </div>
            `;
        }
    }

    // Навешиваем обработчики на инпуты
    if (routerToggle) routerToggle.addEventListener('change', updatePricing);
    if (tvBoxToggle) tvBoxToggle.addEventListener('change', updatePricing);

    // Вызываем сразу, чтобы данные обновились при рендеринге, если инпут уже checked
    updatePricing();

    popup.addEventListener('click', function (event) {
      const link = event.target.closest('.popup-card__adrress-link');
      if (link) {
        event.preventDefault(); // Предотвращаем переход по ссылке
        openPopup(popupAddress) // Здесь вызываем функцию, которая должна открыть попап
      }
    });
  }

  document.querySelector('.popup-card__connect-btn').addEventListener("click", function(e) {
    e.preventDefault();
    const popup = document.querySelector('.popup-card');
    const tariffData = JSON.parse(popup.getAttribute("data-tariff") || "{}");
    openConnectFlow(null, tariffData);
  });

  setupEquipmentSelection(tariffData)

  // Обновляем блок ценообразования
  const pricingPriceEl = popup.querySelector('.popup-card__pricing__price');
  const pricingDiscountEl = popup.querySelector('.popup-card__pricing__discount');
  const pricingPriceAfterEl = popup.querySelector('.popup-card__pricing__price_after');

  if (tariffData.price_after_promo) {
    pricingPriceEl.textContent = `${tariffData.price_promo} ₽/мес`;
    pricingDiscountEl.textContent = `${tariffData.discount} ${tariffData.discount_duration}`;
    const durationNumber = parseInt(tariffData.discount_duration);
    const nextMonth = isNaN(durationNumber) ? '' : (durationNumber + 1);
    pricingPriceAfterEl.innerHTML = `<span class="popup-card__pricing__price_after_bold">${tariffData.price_after_promo} ₽/мес</span> с ${nextMonth}-го месяца`;
  } else {
    pricingPriceEl.textContent = `${tariffData.price_promo} ₽/мес`;
    pricingDiscountEl.style.display = 'none';
    pricingPriceAfterEl.style.display = 'none';
  }

  // Навешиваем обработчики для переключения выпадающих списков в секциях
  popup.querySelectorAll('.popup-card__item-container').forEach(container => {
    container.addEventListener('click', () => {
      const item = container.closest('.popup-card__item');
      const content = item.querySelector('.popup-card__item-content');
      const arrow = item.querySelector('.popup-card__item__button-arrow');
      const label = item.querySelector('.popup-card__toggle__label');
      
      if (!content || !arrow) return;
      
      // Переключаем класс для открытия/закрытия содержимого секции
      content.classList.toggle('popup-card__item-content_active');
      arrow.classList.toggle('popup-card__item__button-arrow_active');
      
      if (label) {
        label.classList.toggle('hidden');
      }
    });
  });

}
// Функция для отправки события при изменении userLocation
function handleUserLocationChanged() {
  const popup = document.querySelector('.popup-card');
  if (!popup) return;
  const tariffData = JSON.parse(popup.getAttribute("data-tariff") || "{}");
  updatePopupContent(tariffData);
}

window.addEventListener("userLocationChanged", handleUserLocationChanged);