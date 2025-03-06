import '../css/style.css'; // Импорт стилей
import './carousel.js'; 
import './popup.js'; 
import './checkTechnicalPossibility.js'; 
import './swiper.js'; 
import './createDynamicPlaceholder.js'; 
import './cards.js'; 
import './updateAddress.js'; 
import Swiper from 'swiper';
import 'swiper/css'; // Подключаем стили Swiper
import './PopupCard.js'

const swiper = new Swiper('.swiper-container', {
  slidesPerView: 1,
  spaceBetween: 10,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
});

// Элементы

const popups = document.querySelectorAll(".popup");
const popup1 = document.getElementById("popup1");
const popup2 = document.getElementById("popup2");
const popup3 = document.getElementById("popup3");
const popup4 = document.getElementById("popup4");
const phoneInput = document.getElementById("phone");
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
window.closePopup = closePopup;
// Назначаем обработчик событий для всех кнопок открытия попапа с городом
cityButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault(); // Отключаем стандартное поведение ссылки
    openPopup(cityPopup);
  });
});


callButton.addEventListener("click", (e) => {
  e.preventDefault();
  openConnectFlow(null, "Обратный звонок"); // Для обратного звонка тариф может быть пустым
});

// Назначаем обработчик событий для всех кнопок
connectButtons.forEach((button) => {
  button.addEventListener("click", function(e) {
    e.preventDefault();
    openConnectFlow(this);
  });
});

// Функция открытия конкретного попапа
export function openPopup(popup) {
  popup.classList.add('popup_active');

  // Если это первый (и пока что единственный) открытый попап — блокируем прокрутку
  const allActivePopups = document.querySelectorAll('.popup_active');
  if (allActivePopups.length === 1) {
    document.body.style.overflow = 'hidden';
  }
}

// Функция закрытия конкретного попапа
export function closePopup(popup) {
  popup.classList.remove('popup_active');


  // Проверяем, остались ли ещё открытые попапы
  const allActivePopups = document.querySelectorAll('.popup_active');
  if (allActivePopups.length === 0) {
    document.body.style.overflow = ''; // Возвращаем прокрутку
  }
}

// Вешаем обработчики на оверлей и кнопку закрытия
popups.forEach((popup) => {
  const overlay = popup.querySelector('.popup__overlay');
  const closeButton = popup.querySelector('.popup__close-button');

  // Закрытие по клику на оверлей
  if (overlay) {
    overlay.addEventListener('click', () => {
      closePopup(popup);
    });
  }

  // Закрытие по клику на кнопку
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      closePopup(popup);
    });
  }
});
  

  
// Открытие первого попапа
export function attachEventListeners() {
// Заменяем обработчики событий для кнопок на делегирование событий
document.querySelector('.card-wrapper').addEventListener("click", function(e) {
  // Проверяем, был ли клик именно по кнопке "Подключить"
  if (e.target && e.target.classList.contains('connect-btn')) {
      e.preventDefault();
      openConnectFlow(e.target, null)
  }
});
}

export function openConnectFlow(sourceElement, tariffDataFromPopup = null) {
  let tariff;
  if (sourceElement) {
    const card = sourceElement.closest(".card");
    if (card) {
      const tariffValue = card.getAttribute("data-tariff");
      if (tariffValue) {
        tariff = JSON.parse(tariffValue);
      }
    }
  }
  // Если данные не были получены через родительскую карточку, попробуем использовать переданные данные
  if (!tariff && tariffDataFromPopup) {
    tariff = tariffDataFromPopup;
  }
  // Если всё равно нет данных, можно создать пустой объект или обработать логику для обратного звонка
  if (!tariff) {
    tariff = {};
  }
  
  // Открываем первый попап
  openPopup(popup1);
  
  // Обработчик кнопок выбора подключения:
  newConnectionBtn.addEventListener("click", () => {
    closePopup(popup1);
    openPopup(popup2);
    document.getElementById('tarif').value = JSON.stringify(tariff);
    document.getElementById('location').value = JSON.parse(localStorage.getItem("userLocation")).city || "";
    // Заполнить остальные поля, если нужно
  });
  
  existingConnectionBtn.addEventListener("click", () => {
    closePopup(popup1);
    openPopup(popup3);
  });
}
  // Получаем элементы формы

  const nameInput = document.getElementById("name");
  const addressInput = document.getElementById("address");


  // Функция валидации всей формы
  function validateForm() {
    const nameValue = nameInput.value.trim();
    const addressValue = addressInput.value.trim();
    const phoneValue = phoneInput.value.trim();
    const phoneValid = phoneValue.length === 12 && phoneValue.startsWith("+7");

    if (nameValue !== "" && addressValue !== "" && phoneValid) {
      submitButton.disabled = false;
      submitButton.classList.add("popup__submit-button_active");
      submitButton.style.backgroundColor = "#f8530f";
      errorText.style.display = "none";
    } else {
      submitButton.disabled = true;
      submitButton.classList.remove("popup__submit-button_active");
      submitButton.style.backgroundColor = "#cccccc";
    }
  }

  // Предзаполнение поля адреса из localStorage, если есть userLocation.fullAddress
  function prefillAddress() {
    const userLocation = JSON.parse(localStorage.getItem("userLocation"));
    if (userLocation && userLocation.fullAddress) {
      document.getElementById("address").value = userLocation.fullAddress;
    }
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class" && popup2.classList.contains("popup_active")) {
        prefillAddress();
      }
    });
  });
  
  observer.observe(popup2, { attributes: true });

  // Обработчик ввода для телефона: проверяем, чтобы значение начиналось с "+7"
  phoneInput.addEventListener("input", () => {
    if (!phoneInput.value.startsWith("+7")) {
      phoneInput.value = "+7";
    }
    validateForm();
  });

  // Обработчики ввода для имени и адреса
  nameInput.addEventListener("input", validateForm);
  addressInput.addEventListener("input", validateForm);

  // Отправка формы
  document.getElementById("phoneForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (submitButton.disabled) {
      errorText.textContent = "Пожалуйста, заполните все поля корректно.";
      errorText.style.display = "block";
      submitButton.classList.add("error");
      setTimeout(() => submitButton.classList.remove("error"), 500);
    } else {
      sendDataToTelegram();
    }
  });

  // Функция отправки данных в Telegram через AJAX
  function sendDataToTelegram() {
    const name = nameInput.value.trim();
    const address = addressInput.value.trim();
    const phone = phoneInput.value.trim();
    const tariffValue = document.getElementById("tarif").value;
    const userLocation = JSON.parse(localStorage.getItem("userLocation"));

    if (!tariffValue) {
      console.log("Ошибка: нет данных о тарифе.");
      return;
    }

    const tariff = JSON.parse(tariffValue);

    fetch("send_to_telegram.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        name: name,
        address: address,
        phone: phone,
        tariff: JSON.stringify(tariff),
        userLocation: JSON.stringify(userLocation)
      })
    })
      .then(response => response.text())
      .then(data => {
        console.log(data);
        if (data.includes("Заявка успешно отправлена")) {
          // Закрываем попап с формой и открываем попап подтверждения
          popups.forEach((popup) => {
            closePopup(popup);
          });
          openPopup(popup4);
        } else {
          alert("Ошибка при отправке заявки.");
        }
      })
      .catch(error => {
        console.error("Error:", error);
        alert("Ошибка при отправке заявки.");
      });
  }

