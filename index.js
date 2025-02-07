// Элементы
const overlay = document.getElementById("overlay");
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
    console.log("Клик по кнопке 'Подключить', передаем кнопку:", this);
    openFirstPopup(this); // Передаем саму кнопку, на которую был совершен клик
  });
});

// Функция открытия попапа
function openPopup(popup) {
    overlay.classList.add("overlay_active");
    popup.classList.add("popup_active");
    document.body.style.overflow = "hidden"; // Блокировка прокрутки
    }
  
  // Функция закрытия попапа
function closePopup() {
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
function attachEventListeners() {
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
  console.log("Данные о тарифе из data-tariff:", tariffValue);

  // Проверка, что значение существует
  if (!tariffValue) {
    console.error("Данные о тарифе не найдены в карточке");
    alert("Данные о тарифе не найдены!");
    return;
  }

  const tariff = JSON.parse(tariffValue); // Преобразуем строку JSON в объект
  console.log("Тариф после парсинга:", tariff);

  // Получаем данные пользователя из localStorage
  const userLocation = JSON.parse(localStorage.getItem("userLocation"));
  console.log("Данные о местоположении пользователя:", userLocation);

  // Открываем первый попап (popup1)
  openPopup(popup1);

  // Когда пользователь выберет новый клиент, передаем данные в popup2
  newConnectionBtn.addEventListener("click", () => {
    closePopup();
    openPopup(popup2);

    // Логируем перед передачей данных
    console.log("Передаем данные в popup2:", tariff, userLocation);

    // Заполняем скрытые поля в форме (формируем popup2)
    document.getElementById('tarif').value = JSON.stringify(tariff); // Передаем данные о тарифе в скрытое поле
    document.getElementById('location').value = userLocation.city;   // Передаем город
    document.getElementById('address').value = userLocation.fullAddress; // Передаем адрес

    // Логируем, что скрытые поля формы заполнены
    console.log("Заполнили скрытые поля: ", document.getElementById('tarif').value);
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

// Функция для валидации телефона
function validatePhone() {
    const phoneValue = phoneInput.value.trim();
    const isValid = phoneValue.length === 12 && phoneValue.startsWith("+7");
    if (isValid) {
      submitButton.disabled = false;
      submitButton.classList.add("popup__submit-button_active")
    } else {
      submitButton.disabled = true;
      submitButton.classList.remove("popup__submit-button_active")
    }
  }
  
  // Обработка ввода телефона
  phoneInput.addEventListener("input", () => {
    if (!phoneInput.value.startsWith("+7")) {
      phoneInput.value = "+7";
    }
    validatePhone();
  });
  
// Отправка формы
document.getElementById("phoneForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (submitButton.disabled) {
    errorText.textContent = "Не верный формат номера";
    errorText.style.display = "block";
    submitButton.classList.add("error");
    setTimeout(() => submitButton.classList.remove("error"), 500);
  } else {
    // Отправка данных через AJAX
    sendDataToTelegram();
  }
});
  
  phoneInput.addEventListener("input", () => {
    if (!phoneInput.value.startsWith("+7")) {
      phoneInput.value = "+7";
    }
  
    // Валидация
    const isValid = phoneInput.value.length === 12 && phoneInput.value.startsWith("+7");
    submitButton.disabled = !isValid;
    submitButton.style.backgroundColor = isValid ? "#f8530f" : "#cccccc";
  });
  

  // Функция отправки данных в Telegram через AJAX
  function sendDataToTelegram() {
    const form = document.getElementById("phoneForm");
    
    // Получаем данные из скрытых полей формы
    const userLocation = JSON.parse(localStorage.getItem("userLocation"));
    const tariffValue = document.getElementById('tarif').value;
    
    // Проверяем, есть ли данные о тарифе
    if (!tariffValue) {
      alert("Ошибка: нет данных о тарифе.");
      return;
    }
  
    const tariff = JSON.parse(tariffValue); // Десериализация данных о тарифе
    const phone = phoneInput.value; // Получаем номер телефона
  
    // Отправляем данные через AJAX
    fetch('send_to_telegram.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        userLocation: JSON.stringify(userLocation),
        tariff: JSON.stringify(tariff),
        phone: phone
      })
    })
    .then(response => response.text())
    .then(data => {
      console.log(data); // Ответ от сервера
      if (data.includes("Заявка успешно отправлена")) {
        closePopup(); // Закрыть текущий попап
        openPopup(popup4); // Открыть попап подтверждения
      } else {
        alert("Ошибка при отправке заявки.");
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert("Ошибка при отправке заявки.");
    });
  }
  