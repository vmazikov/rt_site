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

window.onload = function() {
  // Инициализация переменных для координат и города
  let latitude, longitude, city;

  // Проверяем, поддерживается ли геолокация
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      // Отправляем запрос на API, чтобы получить данные о местоположении
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(response => response.json())
        .then(data => {
          city = data.address.city || data.address.town || data.address.village;
          const state = data.address.state;
          const country = data.address.country;

          // Проверяем, что город находится в Кемеровской области России
          if (country === "Россия" && state === "Кемеровская область") {
            // Если город в Кемеровской области, подставляем название города
            document.getElementById('user-city').textContent = `в ${city}`;
          } else {
            // Если город не в Кемеровской области, оставляем фразу по умолчанию
            document.getElementById('user-city').textContent = '';
          }
        })
        .catch(() => {
          document.getElementById('user-city').textContent = '';
        });
    }, function(error) {
      document.getElementById('user-city').textContent = '';
    });
  }

  // Функция для получения тарифа из карточки
  document.querySelectorAll('.connect-btn').forEach(function(button) {
    button.addEventListener('click', function() {
      // Извлекаем тариф из карточки
      const tarif = this.closest('.card').querySelector('.details').innerText.trim();
      document.getElementById('tarif').value = tarif;  // Устанавливаем тариф в скрытое поле

      // Устанавливаем местоположение и координаты в скрытые поля
      document.getElementById('location').value = city || '';  // Если город найден, устанавливаем его
      document.getElementById('coordinates').value = `${latitude}, ${longitude}`;  // Устанавливаем координаты
    });
  });

  // Обработка отправки формы
  document.getElementById('phoneForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Останавливаем стандартную отправку формы

    const phone = document.getElementById('phone').value;
    const tarif = document.getElementById('tarif').value;
    const location = document.getElementById('location').value;
    const coordinates = document.getElementById('coordinates').value;

    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('tarif', tarif);
    formData.append('location', location);
    formData.append('coordinates', coordinates);

    // Отправка данных на сервер
    fetch('send_to_telegram.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.text())
    .then(data => {
      openPopup(popup4);
    })
    .catch(error => {
      console.error('Ошибка:', error);
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const cityDisplay = document.getElementById("current-city");
  const cityPopup = document.getElementById("location-popup");
  const cityList = document.getElementById("city-list");
  const citySearch = document.getElementById("city-search");
  const changeCityLink = document.getElementById("change-city");
  const editIcon = document.querySelector(".edit-icon");
  let currentCity = null; // Город по умолчанию не задан
  let citiesData = [];

  // Используем уже существующую функцию получения локации
  const initializeLocation = () => {
    const locationData = {
      city: document.getElementById("user-city").textContent.trim(),
    };

    if (locationData.city) {
      const matchedCity = citiesData.find(city => city.name.includes(locationData.city));
      if (matchedCity) {
        setCity(matchedCity);
      }
    }
  };

  // Загрузка городов из JSON
  fetch("cities.json")
    .then(response => response.json())
    .then(data => {
      citiesData = data.cities;
      renderCities(citiesData.filter(city => city.visible === "yes"));

      // Инициализируем локацию после загрузки городов
      initializeLocation();
    })
    .catch(error => console.error("Ошибка загрузки cities.json:", error));

  // Установить текущий город
  const setCity = (city) => {
    currentCity = city;
    updateCityDisplay();
    localStorage.setItem("selectedCity", JSON.stringify(currentCity));
  };

  // Обновление отображения текущего города
  const updateCityDisplay = () => {
    if (currentCity) {
      cityDisplay.textContent = `${currentCity.type} ${currentCity.name}`;
      cityDisplay.closest(".location-section").style.display = "block";
    }
  };

  // Рендер городов
  const renderCities = (cities) => {
    cityList.innerHTML = ""; // Очищаем список
    cities.forEach(city => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = city.name; // Отображаем только name в попапе
      link.dataset.name = city.name;
      link.dataset.type = city.type;

      if (currentCity && city.name === currentCity.name && city.type === currentCity.type) {
        li.classList.add("selected");
      }

      link.addEventListener("click", e => {
        e.preventDefault();
        setCity(city);
        closePopup();
      });

      li.appendChild(link);
      cityList.appendChild(li);
    });
  };

  // Открытие попапа
  const openPopup = () => {
    cityPopup.classList.add("active");
    document.body.style.overflow = "hidden"; // Блокировка прокрутки
  };

  // Закрытие попапа
  const closePopup = () => {
    cityPopup.classList.remove("active");
    document.body.style.overflow = ""; // Разблокировка прокрутки
  };

  // Поиск городов
  citySearch.addEventListener("input", e => {
    const searchValue = e.target.value.toLowerCase().trim();
    if (searchValue.length > 0) {
      const filteredCities = citiesData.filter(city =>
        city.name.toLowerCase().includes(searchValue)
      );
      renderCities(filteredCities);
    } else {
      renderCities(citiesData.filter(city => city.visible === "yes"));
    }
  });

  // Обработчики событий для открытия попапа
  [cityDisplay, editIcon, changeCityLink].forEach(element => {
    if (element) {
      element.addEventListener("click", openPopup);
    }
  });

  cityPopup.querySelector(".close-btn").addEventListener("click", closePopup);

  // Проверка сохраненного города
  const savedCity = JSON.parse(localStorage.getItem("selectedCity"));
  if (savedCity) {
    currentCity = savedCity;
    updateCityDisplay();
  }
});