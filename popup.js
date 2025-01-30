// Элементы
const locationPopup = document.getElementById("locationPopup");
const cityList = document.getElementById("cityList");
const currentCity = document.getElementById("currentCity");
const confirmCityButton = document.getElementById("confirmCity");
const changeCityButton = document.getElementById("changeCity");
const closePopupButton = document.getElementById("closePopupButton");
const bannerCityElement = document.querySelector(".banner .location__city");
const locationCityElements = document.querySelectorAll(".location__city-name"); // Элементы для обновления города

// Переменные
let citiesData = [];
let defaultCity = "";
let popupShown = false; // Контроль отображения попапа

// Функция позиционирования попапа под элементом
function positionPopup() {
  const bounds = bannerCityElement.getBoundingClientRect();
  locationPopup.style.top = `${bounds.bottom + window.scrollY + 10}px`;
  locationPopup.style.left = `${bounds.left + window.scrollX}px`;
}

// Сохранение выбранного города в localStorage
function saveCity(city) {
  localStorage.setItem("userCity", city);
  console.log(`[LOG] Город сохранен в localStorage: ${city}`);
  updateCityInElements(city); // Обновляем город в элементах
}

// Обновление города в элементах с классом location__city-name
function updateCityInElements(city) {
  locationCityElements.forEach(element => {
    element.textContent = city;
  });
  console.log(`[LOG] Город обновлён в элементах: ${city}`);
}

// Загрузка данных о городах из файла cities.json
async function loadCities() {
  try {
    console.log("[LOG] Загружаем список городов из cities.json...");
    const response = await fetch("./cities.json");
    const data = await response.json();

    // Фильтруем только города с popup_visible: "yes"
    citiesData = data.cities.filter(city => city.popup_visible === "yes");

    // Определяем город по умолчанию
    const defaultCityData = data.cities.find(city => city.default_city === "yes");
    defaultCity = defaultCityData ? defaultCityData.name : "Кемерово";

    console.log("[LOG] Загружены города:", citiesData);
    console.log(`[LOG] Город по умолчанию: ${defaultCity}`);

    // Отображаем список городов
    renderCityList();

    return defaultCity;
  } catch (error) {
    console.error("[ERROR] Ошибка загрузки городов:", error);
    return "Кемерово";
  }
}

// Отображение списка городов
function renderCityList() {
  if (!citiesData || citiesData.length === 0) {
    console.error("[ERROR] Список городов пуст или не загружен.");
    cityList.innerHTML = "<li>Города не найдены</li>";
    return;
  }

  cityList.innerHTML = citiesData
    .map(city => `<li data-city="${city.name}">${city.type ? city.type + " " : ""}${city.name}</li>`)
    .join("");

  // Обработчики кликов по городам
  cityList.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", event => {
      const selectedCity = event.target.dataset.city;
      saveCity(selectedCity);
      currentCity.textContent = `${li.textContent}`;
      locationPopup.classList.add("hidden");
      popupShown = true; // Фиксируем, что попап закрыт
    });
  });

  console.log("[LOG] Города успешно добавлены в список.");
}

// Получение координат пользователя
function getClientCoordinates() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      console.log("[LOG] Запрашиваем координаты пользователя...");
      navigator.geolocation.getCurrentPosition(
        position => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log("[LOG] Получены координаты:", coordinates);
          resolve(coordinates);
        },
        error => {
          console.warn("[WARNING] Геолокация недоступна:", error);
          resolve(null);
        }
      );
    } else {
      console.warn("[WARNING] Браузер не поддерживает геолокацию.");
      resolve(null);
    }
  });
}

// Определение города по координатам через Dadata
async function detectCityByCoordinates() {
  try {
    const coordinates = await getClientCoordinates();
    if (!coordinates) {
      console.warn("[WARNING] Координаты пользователя не получены.");
      return null;
    }

    const { latitude, longitude } = coordinates;
    console.log(`[LOG] Отправляем запрос в Dadata с координатами: lat=${latitude}, lon=${longitude}`);

    const url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address";

    const requestData = {
      lat: latitude,
      lon: longitude,
      count: 1,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token 549f6e44bb6269eed79da8d09d37e0ff7042035f`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Ошибка API DaData: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[LOG] Ответ от Dadata:", data);

    if (data && data.suggestions && data.suggestions.length > 0) {
      const suggestion = data.suggestions[0].data;
      const cityWithType = suggestion.city_with_type;
      const cityName = suggestion.city;
      console.log(`[LOG] Определён город: ${cityWithType}`);
      return { cityWithType, cityName };
    } else {
      console.warn("[WARNING] Ответ от Dadata не содержит информации о городе.");
      return null;
    }
  } catch (error) {
    console.error("[ERROR] Ошибка определения города:", error);
    return null;
  }
}

// Инициализация попапа
async function initPopup() {
  console.log("[LOG] Инициализация попапа...");

  // Проверяем сохранённый город
  const savedCity = localStorage.getItem("userCity");
  console.log(`[LOG] Проверяем localStorage, найден город: ${savedCity}`);
  if (savedCity) {
    console.log(`[LOG] Город найден в localStorage: ${savedCity}`);
    currentCity.textContent = `г. ${savedCity}`;
    updateCityInElements(savedCity);
    popupShown = true;
    return;
  }

  const defaultCityName = await loadCities();
  console.log("[LOG] Устанавливаем дефолтный город...");
  currentCity.textContent = `г. ${defaultCityName}`;
  locationPopup.classList.remove("hidden");
  positionPopup();

  popupShown = true;

  console.log("[LOG] Запрашиваем город по координатам...");
  const detectedCity = await detectCityByCoordinates();
  if (detectedCity) {
    console.log(`[LOG] Город обновлён на: ${detectedCity.cityName}`);
    currentCity.textContent = `${detectedCity.cityName}`;
    saveCity(detectedCity.cityName);
  } else {
    console.warn("[WARNING] Город не удалось определить, остаётся дефолтный город.");
  }
}

// Обработчики кнопок
confirmCityButton.addEventListener("click", () => {
  saveCity(currentCity.textContent.replace(/г\.|пгт\.|село /g, "").trim());
  locationPopup.classList.add("hidden");
});

changeCityButton.addEventListener("click", () => {
  console.log("[LOG] Открытие другого попапа...");
  locationPopup.classList.add("hidden");
});

closePopupButton.addEventListener("click", () => {
  locationPopup.classList.add("hidden");
});

// Обновление позиции попапа при изменении размеров окна или скролле
window.addEventListener("scroll", positionPopup);
window.addEventListener("resize", positionPopup);

// Запуск
initPopup();


