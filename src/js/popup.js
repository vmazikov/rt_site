import { updateCityInElements } from './checkTechnicalPossibility.js';
import {dadataToken} from "./checkTechnicalPossibility.js"
import {openPopup} from './index.js'


// ================================
// ЭЛЕМЕНТЫ
// ================================
const locationPopup = document.getElementById("locationPopup");
const cityList = document.getElementById("cityList");
const currentCity = document.getElementById("currentCity");
const confirmCityButton = document.getElementById("confirmCity");
const changeCityButton = document.getElementById("changeCity");
const closePopupButton = document.getElementById("closePopupButton");
const bannerCityElement = document.querySelector(".popup-city-location");
const locationCityElements = document.querySelectorAll(".location__city-name");

// ================================
// ПЕРЕМЕННЫЕ
// ================================
let citiesData = [];
let defaultCity = "";
let popupShown = false; // Флаг отображения попапа
// Глобальный объект для хранения данных о местоположении пользователя
export let userLocation = {
  city: "",
  cityWitchType: "",
  address: "",      // Отформатированный адрес для проверки технической возможности (например: "г Кемерово Свободы улица 7")
  techResult: null,
  fullAddress: "",  // Полное представление адреса для отображения (например: "г Кемерово, пр-кт ленина, д 115")
};

// Сохраняет данные о местоположении пользователя
export function saveUserLocation({ city, cityWitchType, address = "", techResult = null, fullAddress = "", cityFias = "" }) {
  userLocation = { city, cityWitchType, address, techResult, fullAddress, cityFias };
  localStorage.setItem("userLocation", JSON.stringify(userLocation));
  console.log("[LOG] userLocation сохранён:", userLocation);
  window.dispatchEvent(new Event("userLocationChanged"));
  updateCityInElements(city, cityWitchType);
  // При необходимости можно вызвать updateTariffs()
}


// Глобальный объект для хранения данных о местоположении пользователя

// ================================
// ФУНКЦИИ ОБНОВЛЕНИЯ UI
// ================================
/**
 * Обновляет содержимое элементов на странице, где отображается город.
 */
function updateUI() {
  // Если в localStorage есть userLocation, пробуем его распарсить
  const stored = localStorage.getItem("userLocation");
  if (stored) {
    try {
      userLocation = JSON.parse(stored);
    } catch (e) {
      // console.error("[ERROR] Не удалось распарсить userLocation из localStorage:", e);
      return;
    }
  }
  currentCity.textContent = `${userLocation.city}`;
  locationCityElements.forEach((el) => {
    el.textContent = userLocation.city;
  });
  // console.log("[LOG] UI обновлён с данными:", userLocation);
}

// Слушатель кастомного события, чтобы обновлять UI при изменении userLocation
window.addEventListener("userLocationChanged", updateUI);
// Также слушаем событие storage (если изменения происходят в другом окне)
window.addEventListener("storage", (event) => {
  if (event.key === "userLocation") {
    updateUI();
  }
});

// ================================
// ФУНКЦИИ ПОПАПА
// ================================

/**
 * Позиционирует попап под элементом bannerCityElement.
 */
function positionPopup() {
  const bounds = bannerCityElement.getBoundingClientRect();
  if (window.scrollY === 0) {
    locationPopup.style.position = "absolute";
    locationPopup.style.top = `${bounds.bottom + window.scrollY + 10}px`;
    locationPopup.style.left = `${bounds.left + window.scrollX - 227}px`;
  } else {
    locationPopup.style.position = "fixed";
    locationPopup.style.top = "8px";
    locationPopup.style.left = `${bounds.left - 227}px`;
  }
}

/**
 * Сохраняет объект userLocation в localStorage и диспатчит событие "userLocationChanged".
 * @param {Object} data - объект с полями: city (обязательно), address (опционально), techResult (опционально)
 */
// function saveUserLocation({ city, address = "", techResult = null, fullAddress = "" }) {
//   userLocation = { city, address, techResult };
//   localStorage.setItem("userLocation", JSON.stringify(userLocation));
//   console.log("[LOG] userLocation сохранён:", userLocation);
//   window.dispatchEvent(new CustomEvent("userLocationChanged", { detail: userLocation }));
// }


/**
 * Загружает список городов из файла cities.json и отбирает записи с popup_visible: "yes".
 * Возвращает название дефолтного города.
 */
async function loadCities() {
  try {
    // console.log("[LOG] Загружаем список городов из cities.json...");
    const response = await fetch("./json/cities.json");
    const data = await response.json();
    citiesData = data.cities.filter((city) => city.popup_visible === "yes");
    const defaultCityData = data.cities.find((city) => city.default_city === "yes");
    defaultCity = defaultCityData ? defaultCityData.name : "Кемерово";
    // console.log("[LOG] Загружены города:", citiesData);
    // console.log(`[LOG] Город по умолчанию: ${defaultCity}`);
    renderCityList();
    return defaultCity;
  } catch (error) {
    // console.error("[ERROR] Ошибка загрузки городов:", error);
    return "Кемерово";
  }
}

/**
 * Отрисовывает список городов в элементе cityList.
 */
function renderCityList() {
  if (!citiesData || citiesData.length === 0) {
    console.error("[ERROR] Список городов пуст или не загружен.");
    cityList.innerHTML = "<li>Города не найдены</li>";
    return;
  }
  cityList.innerHTML = citiesData
    .map((city) => `<li data-city="${city.name}" data-type="${city.type}">${city.type ? city.type + " " : ""}${city.name}</li>`)
    .join("");
  cityList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", (event) => {
      console.log(event.target.dataset)
      const selectedCity = event.target.dataset.city;
      const cityWitchType = `${event.target.dataset.type} ${event.target.dataset.city}`
      saveUserLocation({ city: selectedCity, cityWitchType:cityWitchType });
      currentCity.textContent = li.textContent;
      currentCity.dataset.cityWitchType = cityWitchType
      locationPopup.classList.add("hidden");
      popupShown = true;
    });
  });
  // console.log("[LOG] Города успешно добавлены в список.");
}

/**
 * Получает координаты пользователя через Geolocation API.
 */
function getClientCoordinates() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      // console.log("[LOG] Запрашиваем координаты пользователя...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          // console.log("[LOG] Получены координаты:", coordinates);
          resolve(coordinates);
        },
        (error) => {
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

/**
 * Определяет город по координатам через DaData.
 */
async function detectCityByCoordinates() {
  try {
    const coordinates = await getClientCoordinates();
    if (!coordinates) {
      console.warn("[WARNING] Координаты пользователя не получены.");
      return null;
    }
    const { latitude, longitude } = coordinates;
    // console.log(`[LOG] Отправляем запрос в DaData с координатами: lat=${latitude}, lon=${longitude}`);
    const url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address";
    const requestData = { lat: latitude, lon: longitude, count: 1 };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${dadataToken}`,
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error(`Ошибка API DaData: ${response.statusText}`);
    }
    const data = await response.json();
    // console.log("[LOG] Ответ от DaData:", data);
    if (data && data.suggestions && data.suggestions.length > 0) {
      const suggestion = data.suggestions[0].data;
      console.log(`[LOG] Определён город: ${suggestion.city_with_type}`);
      return { cityWithType: suggestion.city_with_type, cityName: suggestion.city };
    } else {
      console.warn("[WARNING] Ответ от DaData не содержит информации о городе.");
      return null;
    }
  } catch (error) {
    console.error("[ERROR] Ошибка определения города:", error);
    return null;
  }
}

/**
 * Инициализирует попап.
 * Если в localStorage уже сохранён userLocation с непустым городом, то данные не изменяются.
 * Иначе загружается список городов и определяется город по координатам.
 */
async function initPopup() {
  // console.log("[LOG] Инициализация попапа...");

  // Если в localStorage уже сохранён userLocation с заданным городом, используем его.
  const storedData = localStorage.getItem("userLocation");
  if (storedData) {
    try {
      const storedLocation = JSON.parse(storedData);
      if (storedLocation.city && storedLocation.city.trim() !== "") {
        // console.log("[LOG] Данные найдены в localStorage:", storedLocation);
        userLocation = storedLocation;
        currentCity.textContent = `${storedLocation.city}`;
        updateCityInElements(storedLocation.city, storedLocation.cityWitchType);
        popupShown = true;
        console.log(currentCity)
        return;
      }
    } catch (e) {
      // console.error("[ERROR] Ошибка парсинга userLocation из localStorage:", e);
    }
  }

  // Если сохранённых данных нет, загружаем список городов и устанавливаем дефолтный город
  const defaultCityName = await loadCities();
  // console.log("[LOG] Устанавливаем дефолтный город...");
  currentCity.textContent = `${defaultCityName}`;
  setTimeout(() => {
    locationPopup.classList.remove("hidden");
}, 500);
  positionPopup();
  popupShown = true;

  // Пытаемся определить город по координатам, только если сохранённых данных нет
  const detectedCity = await detectCityByCoordinates();
  if (detectedCity && detectedCity.cityName && detectedCity.cityName !== defaultCityName) {
    // console.log(`[LOG] Определён город по координатам: ${detectedCity.cityName}`);
    currentCity.textContent = detectedCity.cityWithType;
  } else {
    console.warn("[WARNING] Город не удалось определить или он совпадает с дефолтным.");
  }
}

// Обработчики кнопок попапа
confirmCityButton.addEventListener("click", () => {
  console.log(currentCity)
  const city = currentCity.textContent.replace(/г\.|пгт\.|село /g, "").trim();
  saveUserLocation({ city, cityWitchType: currentCity.dataset.cityWitchType });
  locationPopup.classList.add("hidden");
});

changeCityButton.addEventListener("click", () => {
  // console.log("[LOG] Открытие попапа для смены города...");
  locationPopup.classList.add("hidden");
  openPopup(cityPopup)
  // locationPopup.classList.remove("hidden");
});

closePopupButton.addEventListener("click", () => {
  locationPopup.classList.add("hidden");
});

// Обновление позиции попапа при изменении окна или скролле
window.addEventListener("scroll", positionPopup);
window.addEventListener("resize", positionPopup);

// Запуск
initPopup();