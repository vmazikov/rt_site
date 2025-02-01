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
const cityButtons = document.querySelectorAll(".location__city")


// Назначаем обработчик событий для всех кнопок открытия попапа с городом
cityButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault(); // Отключаем стандартное поведение ссылки
    openPopup(cityPopup);
  });
});


callButton.addEventListener("click", (e) =>{
    e.preventDefault(); // Отключаем стандартное поведение ссылки
    openFirstPopup();
});


// Назначаем обработчик событий для всех кнопок
connectButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault(); // Отключаем стандартное поведение ссылки
      openFirstPopup();
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

  // Функция для открытия первого попапа
function openFirstPopup() {
    openPopup(popup1); // popup1 — ваш первый попап
  }
  
// Открытие первого попапа
function attachEventListeners() {
  document.querySelectorAll(".connect-btn").forEach(button => {
      button.addEventListener("click", (e) => {
          e.preventDefault();
          openPopup(popup1);
      });
  });
}
// Логика кнопок в первом попапе
newConnectionBtn.addEventListener("click", () => {
closePopup();
openPopup(popup2);
});
  
existingConnectionBtn.addEventListener("click", () => {
closePopup();
openPopup(popup3);
});

// Функция для валидации телефона
function validatePhone() {
    const phoneValue = phoneInput.value.trim();
    const isValid = phoneValue.length === 12 && phoneValue.startsWith("+7");
    if (isValid) {
      errorText.style.display = "none";
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
      closePopup(); // Закрыть текущий попап
  
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
    errorText.style.display = isValid ? "none" : "block";
  });
  
