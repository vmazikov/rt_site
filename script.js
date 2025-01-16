const buttons = document.querySelectorAll(".equipment-buttons button");
const track = document.querySelector(".carousel-track");
const dots = document.querySelectorAll(".dot");
let currentIndex = 0;
let autoSlideInterval;

const updateCarousel = (index) => {
  track.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
};

const setActiveCategory = (category) => {
  const items = document.querySelectorAll(".carousel-item");
  items.forEach(item => {
    if (item.dataset.category === category) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
};

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    setActiveCategory(button.dataset.category);
  });
});

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    currentIndex = index;
    updateCarousel(index);
  });
});

const autoSlide = () => {
  autoSlideInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % dots.length;
    updateCarousel(currentIndex);
  }, 7000);
};

autoSlide();

// Получаем все кнопки "Подключить"
const connectButtons = document.querySelectorAll(".connect-btn");

// Функция для открытия первого попапа
function openFirstPopup() {
  openPopup(popup1); // popup1 — ваш первый попап
}

// Назначаем обработчик событий для всех кнопок
connectButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault(); // Отключаем стандартное поведение ссылки
    openFirstPopup();
  });
});
// Элементы
const phoneInput = document.getElementById("phone");
const submitButton = document.getElementById("submitButton");
const errorText = document.getElementById("errorText");

// Функция для валидации телефона
function validatePhone() {
  const phoneValue = phoneInput.value.trim();
  const isValid = phoneValue.length === 12 && phoneValue.startsWith("+7");
  if (isValid) {
    errorText.style.display = "none";
    submitButton.disabled = false;
    submitButton.style.backgroundColor = "#f8530f";
  } else {
    submitButton.disabled = true;
    submitButton.style.backgroundColor = "#cccccc";
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
// Элементы
const overlay = document.getElementById("overlay");
const popups = document.querySelectorAll(".popup");
const popup1 = document.getElementById("popup1");
const popup2 = document.getElementById("popup2");
const popup3 = document.getElementById("popup3");
const popup4 = document.getElementById("popup4");
const closeButtons = document.querySelectorAll(".close-btn");
const newConnectionBtn = document.getElementById("newConnection");
const existingConnectionBtn = document.getElementById("existingConnection");


// Функция открытия попапа
function openPopup(popup) {
  overlay.classList.add("active");
  popup.classList.add("active");
}

// Функция закрытия попапа
function closePopup() {
  overlay.classList.remove("active");
  popups.forEach((popup) => popup.classList.remove("active"));
}

// Закрытие по клику на оверлей
overlay.addEventListener("click", closePopup);

// Закрытие по кнопке
closeButtons.forEach((btn) => {
  btn.addEventListener("click", closePopup);
});

// Открытие первого попапа
document.querySelector(".connect-btn").addEventListener("click", (e) => {
  e.preventDefault();
  openPopup(popup1);
});

// Логика кнопок в первом попапе
newConnectionBtn.addEventListener("click", () => {
  closePopup();
  openPopup(popup2);
});

existingConnectionBtn.addEventListener("click", () => {
  closePopup();
  openPopup(popup3);
});

// // Валидация формы телефона
// phoneInput.addEventListener("input", () => {
//   const isValid = phoneInput.value.length === 12 && phoneInput.value.startsWith("+7");
//   submitButton.disabled = !isValid;
//   if (isValid) {
//     errorText.style.display = "none";
//     submitButton.style.backgroundColor = "#f8530f";
//   } else {
//     submitButton.style.backgroundColor = "#cccccc";
//   }
// });

// // Обработка отправки формы
// document.getElementById("phoneForm").addEventListener("submit", (e) => {
//   e.preventDefault();
//   if (submitButton.disabled) {
//     errorText.textContent = "Не верный формат номера";
//     errorText.style.display = "block";
//     submitButton.classList.add("error");
//     setTimeout(() => submitButton.classList.remove("error"), 500);
//   } else {
//     closePopup();
//     openPopup(popup4);
//   }
// });

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

document.getElementById("phoneForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Останавливаем стандартную отправку формы
  
  // Проверяем, валиден ли номер
  if (!submitButton.disabled) {
    const formData = new FormData(this);
    
    fetch('send_email.php', {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())
    .then(data => {
      // Успешная отправка
      if (data.success) {
        openPopup(popup4);
      } else {
        alert("Произошла ошибка при отправке.");
      }
    })
    .catch(error => {
      console.log("Произошла ошибка при отправке данных.");
    });
  } else {
    errorText.textContent = "Не верный формат номера";
    errorText.style.display = "block";
  }
});

window.onload = function() {
  // По умолчанию показываем текст "Подключить интернет от Ростелеком"
  document.getElementById('user-city').textContent = '';

  // Проверяем, поддерживается ли геолокация
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Отправляем запрос на API, чтобы получить данные о местоположении
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(response => response.json())
        .then(data => {
          const city = data.address.city || data.address.town || data.address.village;
          const state = data.address.state;  // Получаем название области
          const country = data.address.country;

          // Проверяем, что город находится в Кемеровской области России
          if (country === "Russia" && state === "Kemerovo Oblast") {
            // Если город в Кемеровской области, подставляем название города
            document.getElementById('user-city').textContent = `в ${city}`;
          } else {
            // Если город не в Кемеровской области, оставляем фразу по умолчанию
            document.getElementById('user-city').textContent = '';
          }
        })
        .catch(() => {
          // Если произошла ошибка, оставляем фразу по умолчанию
          document.getElementById('user-city').textContent = '';
        });
    }, function(error) {
      // Если пользователь не дал разрешение на геолокацию, оставляем фразу по умолчанию
      document.getElementById('user-city').textContent = '';
    });
  } else {
    // Если геолокация не поддерживается, оставляем фразу по умолчанию
    document.getElementById('user-city').textContent = '';
  }
};