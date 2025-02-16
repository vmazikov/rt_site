import '../css/style.css'; // Импорт стилей
import './carousel.js'; 
import './checkTechnicalPossibility.js'; 
import './swiper.js'; 
import './createDynamicPlaceholder.js'; 
import './cards.js'; 
import './popup.js'; 
import './updateAddress.js'; 
import './phoneValidator.js'
import './sendDataToTelegram.js'
import Swiper from 'swiper';
import 'swiper/css'; // Подключаем стили Swiper

const swiper = new Swiper('.swiper-container', {
  slidesPerView: 1,
  spaceBetween: 10,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
});

// Элементы
const overlay = document.getElementById("overlay");
const popups = document.querySelectorAll(".popup");
const popup1 = document.getElementById("popup1");
const popup2 = document.getElementById("popup2");
const popup3 = document.getElementById("popup3");
const popup4 = document.getElementById("popup4");
const submitButton = document.getElementById("submitButton");
const errorText = document.getElementById("errorText");
const closeButtons = document.querySelectorAll(".popup__close-button");
const newConnectionBtn = document.getElementById("newConnection");
const existingConnectionBtn = document.getElementById("existingConnection");
const connectButtons = document.querySelectorAll(".connect-btn");
const callButton = document.querySelector(".location__call-button");
const cityPopup = document.querySelector(".popup-city-change")
const cityButtons = document.querySelectorAll(".location__city-name")

window.openPopup = openPopup;
// Назначаем обработчик событий для всех кнопок открытия попапа с городом
cityButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault(); // Отключаем стандартное поведение ссылки
    openPopup(cityPopup);
  });
});


// callButton.addEventListener("click", (e) =>{
//     e.preventDefault(); // Отключаем стандартное поведение ссылки
//     openFirstPopup();
// });


// Назначаем обработчик событий для всех кнопок
connectButtons.forEach((button) => {
  button.addEventListener("click", function(e) {
    e.preventDefault(); // Отключаем стандартное поведение ссылки
    // console.log("Клик по кнопке 'Подключить', передаем кнопку:", this);
    openFirstPopup(this); // Передаем саму кнопку, на которую был совершен клик
  });
});

// Функция открытия попапа
export function openPopup(popup) {
    overlay.classList.add("overlay_active");
    popup.classList.add("popup_active");
    document.body.style.overflow = "hidden"; // Блокировка прокрутки
    }


  
  // Функция закрытия попапа
export function closePopup() {
    overlay.classList.remove("overlay_active");
    popups.forEach((popup) => popup.classList.remove("popup_active"));
    document.body.style.overflow = ""; // Блокировка прокрутки
  }
  
  // Закрытие по клику на оверлей
  overlay.addEventListener("click", closePopup);
  
  // Закрытие по кнопке
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", closePopup);
  });
  
// Открытие первого попапа
export function attachEventListeners() {
// Заменяем обработчики событий для кнопок на делегирование событий
document.querySelector('.card-wrapper').addEventListener("click", function(e) {
  // Проверяем, был ли клик именно по кнопке "Подключить"
  if (e.target && e.target.classList.contains('connect-btn')) {
      e.preventDefault();
      openFirstPopup(e.target); // Передаем кнопку, на которую был совершен клик
  }
});
}

function openFirstPopup(button) {
  const card = button.closest(".card"); // Находим родительский элемент .card
  const tariffValue = card.getAttribute("data-tariff");

  // Логируем, что мы получаем из атрибута
  // console.log("Данные о тарифе из data-tariff:", tariffValue);

  // Проверка, что значение существует
  if (!tariffValue) {
    console.error("Данные о тарифе не найдены в карточке");
    alert("Данные о тарифе не найдены!");
    return;
  }

  const tariff = JSON.parse(tariffValue); // Преобразуем строку JSON в объект
  // console.log("Тариф после парсинга:", tariff);

  // Получаем данные пользователя из localStorage
  const userLocation = JSON.parse(localStorage.getItem("userLocation"));
  // console.log("Данные о местоположении пользователя:", userLocation);

  // Открываем первый попап (popup1)
  openPopup(popup1);

  // Когда пользователь выберет новый клиент, передаем данные в popup2
  newConnectionBtn.addEventListener("click", () => {
    closePopup();
    openPopup(popup2);

    // Логируем перед передачей данных
    // console.log("Передаем данные в popup2:", tariff, userLocation);

    // Заполняем скрытые поля в форме (формируем popup2)
    document.getElementById('tarif').value = JSON.stringify(tariff); // Передаем данные о тарифе в скрытое поле
    document.getElementById('location').value = userLocation.city;   // Передаем город
    document.getElementById('address').value = userLocation.fullAddress; // Передаем адрес

    // Логируем, что скрытые поля формы заполнены
    // console.log("Заполнили скрытые поля: ", document.getElementById('tarif').value);
  });

  // Когда пользователь выберет "Уже подключен", открываем popup3
  existingConnectionBtn.addEventListener("click", () => {
    closePopup();
    openPopup(popup3);
  });
}


  
// // Логика кнопок в первом попапе
// existingConnectionBtn.addEventListener("click", () => {
//   closePopup();
//   openPopup(popup3);
// });

// newConnectionBtn.addEventListener("click", () => {
//   closePopup();
//   openPopup(popup2);
// });


  
  