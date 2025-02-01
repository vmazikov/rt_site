// ================================
// ПЕРЕМЕННЫЕ И НАСТРОЙКИ
// ================================
const dadataToken = '549f6e44bb6269eed79da8d09d37e0ff7042035f'; // Токен DaData
const regionFiasId = '393aeccb-89ef-4a7e-ae42-08d5cebc2e30';       // FIAS ID области
let technicalData = []; // Технические данные, загружаемые из JSON

// Глобальный объект для хранения данных о местоположении пользователя
let userLocation = {
  city: "",
  address: "",
  techResult: null,
};

// ================================
// ФУНКЦИИ ОБРАБОТКИ АДРЕСА
// ================================

/**
 * Нормализует тип улицы (например, «ул.», «улица» → «улица»; «пр-кт», «проспект» → «проспект» и т.д.).
 * @param {string} streetWithType - строка с улицей и типом.
 * @returns {string} - нормализованный тип.
 */
function determineFullStreetType(streetWithType) {
  if (!streetWithType) return '';
  const lower = streetWithType.toLowerCase();
  if (lower.includes('ул.') || lower.includes('ул ') || lower.includes('улица')) {
    return 'улица';
  }
  if (lower.includes('пр-кт') || lower.includes('проспект')) {
    return 'проспект';
  }
  if (lower.includes('пер.') || lower.includes('переулок')) {
    return 'переулок';
  }
  if (lower.includes('ш.') || lower.includes('шоссе')) {
    return 'шоссе';
  }
  if (lower.includes('б-р') || lower.includes('бульвар')) {
    return 'бульвар';
  }
  return streetWithType;
}

/**
 * Форматирует адрес на основе объекта, полученного от DaData.
 * @param {Object} data - объект адреса из DaData.
 * @returns {string} - отформатированный адрес.
 */
function formatAddressFromDaData(data) {
  const settlementWithType = (data.settlement_with_type || data.city_with_type || '').toLowerCase();
  const streetName = (data.street || '').toLowerCase();
  const streetType = determineFullStreetType(data.street_with_type || '');
  const building = (data.house || '').toLowerCase();
  return `${settlementWithType} ${streetName} ${streetType} ${building}`.replace(/\s+/g, ' ').trim();
}

/**
 * Проверяет техническую возможность по загруженным JSON-данным.
 * @param {string} address - отформатированный адрес.
 * @returns {Object} - результат проверки, например: { isPossible: true, txb: 'fttb' }.
 */
function checkTechnicalPossibility(address) {
  console.log('Проверяем техническую возможность для:', address);
  const normalizedAddress = address.toLowerCase().replace(/\s+/g, ' ').trim();
  const match = technicalData.find(item => {
    const itemAddress = `${item.city} ${item.street} ${item.building}`
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    return itemAddress === normalizedAddress;
  });
  if (match) {
    console.log(`Техвозможность ${match.txb}`);
    return { isPossible: true, txb: match.txb };
  } else {
    console.log('Техвозможность не найдена');
    return { isPossible: false };
  }
}

/**
 * Загружает технические данные из JSON-файла и нормализует их.
 * @param {string} jsonUrl - путь к JSON файлу.
 */
function loadTechnicalData(jsonUrl) {
  $.getJSON(jsonUrl, function(data) {
    technicalData = data.map(item => ({
      city: item.city.toLowerCase(),
      street: item.street.toLowerCase(),
      building: item.building.toLowerCase(),
      txb: item.txb
    }));
    console.log('Technical data loaded and normalized:', technicalData);
  });
}

// ================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ
// ================================

/**
 * Сохраняет данные о местоположении в объект userLocation и localStorage.
 * @param {Object} data - объект с полями: city (обязательно), address (опционально), techResult (опционально)
 */
function saveUserLocation({ city, address = "", techResult = null }) {
  userLocation = { city, address, techResult };
  localStorage.setItem("userLocation", JSON.stringify(userLocation));
  console.log("[LOG] userLocation сохранён:", userLocation);
  updateCityInElements(city);
  // Можно также вызвать updateTariffs() здесь, если требуется обновление карточек
  // updateTariffs();
}

// ================================
// ФУНКЦИИ АВТОПОДСКАЗОК ДАДАТА (АДРЕС)
// ================================

/**
 * Функция для удаления дубликатов подсказок по отформатированному адресу.
 * @param {Array} suggestions - массив объектов с полем data.
 * @returns {Array} - отфильтрованный массив подсказок.
 */
function deduplicateSuggestions(suggestions) {
  const seen = {};
  return suggestions.filter(item => {
    const formatted = formatAddressFromDaData(item.data);
    if (seen[formatted]) return false;
    seen[formatted] = true;
    return true;
  });
}

/**
 * Инициализирует автоподсказки для поля ввода адреса.
 * @param {string} inputSelector - селектор поля ввода.
 * @param {string} regionFiasId - FIAS ID региона.
 */
function initManualAddressInput(inputSelector, regionFiasId = '') {
  $(inputSelector).on('input', function() {
    const inputVal = $(this).val();
    // Разбиваем введённый текст по запятым и убираем лишние пробелы
    const parts = inputVal.split(',').map(s => s.trim()).filter(s => s.length > 0);

    // Определяем режим ввода:
    // 1 часть – свободный режим;
    // 2 части – выбран город, вводится улица;
    // 3 и более – вводится дом.
    let stage = 'free';
    let requestData = {
      query: inputVal.trim(),
      count: 5,
      locations: regionFiasId ? [{ region_fias_id: regionFiasId }] : []
    };

    if (parts.length === 2) {
      stage = 'street';
      requestData.from_bound = { value: "street" };
      requestData.to_bound = { value: "street" };
      requestData.query = (parts[0] ? parts[0] + ' ' : '') + parts[1];
    } else if (parts.length >= 3) {
      stage = 'house';
      requestData.from_bound = { value: "house" };
      requestData.to_bound = { value: "house" };
      requestData.query = ((parts[0] ? parts[0] + ' ' : '') + (parts[1] ? parts[1] + ' ' : '')) + parts[2];
    }

    if (requestData.query.trim().length < 3) {
      $('#suggestions').empty();
      return;
    }

    $.ajax({
      url: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      method: 'POST',
      headers: { "Authorization": `Token ${dadataToken}` },
      contentType: 'application/json',
      data: JSON.stringify(requestData),
      success: function(data) {
        let suggestions = data.suggestions || [];
        // Убираем дублирующиеся подсказки
        suggestions = deduplicateSuggestions(suggestions);
        const suggestionsDiv = $('#suggestions');
        suggestionsDiv.empty();

        suggestions.forEach(item => {
          const formattedAddress = formatAddressFromDaData(item.data);
          if (!formattedAddress || formattedAddress.trim() === '') return;
          if (stage === 'house') {
            if (item.data.fias_level !== '8' || !item.data.house) return;
          }
          suggestionsDiv.append(
            `<div data-full-address='${JSON.stringify(item.data)}'>${formattedAddress}</div>`
          );
        });
      },
      error: function(err) {
        console.error('Ошибка DaData:', err);
      }
    });
  });

  // При клике по подсказке – обновляем инпут и, если адрес полный, сохраняем данные.
  $('#suggestions').on('click', 'div', function() {
    let itemData = $(this).data('full-address');
    if (typeof itemData === 'string') {
      try {
        itemData = JSON.parse(itemData);
      } catch (e) {
        console.error('Ошибка парсинга данных подсказки', e);
        return;
      }
    }
    const formattedAddress = formatAddressFromDaData(itemData);
    const isComplete = itemData.house && itemData.house.trim() !== '';
    $(inputSelector).val(formattedAddress);
    $('#suggestions').empty();
    if (isComplete) {
      const techResult = checkTechnicalPossibility(formattedAddress);
      // Определяем город – берем itemData.city, если есть, иначе первую часть форматированного адреса
      const cityName = itemData.city || formattedAddress.split(' ')[0];
      updateCityInElements(cityName);
      // Сохраняем данные о местоположении (город, полный адрес и результат проверки)
      saveUserLocation({ city: cityName, address: formattedAddress, techResult: techResult });
      closePopup()
      if (techResult.isPossible) {
        alert(`Техническая возможность: ${techResult.txb}`);
      } else {
        alert('Технической возможности нет');
      }
    }
  });

  // Обработка нажатия клавиши Enter – для подтверждения адреса, введённого вручную.
//   $(inputSelector).on('keydown', function(e) {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       const currentAddress = $(this).val().trim();
//       $('#suggestions').empty();
//       if (currentAddress.indexOf(',') !== -1) {
//         const parts = currentAddress.split(',');
//         const tempData = {
//           city: parts[0] || '',
//           street: parts[1] || '',
//           house: parts[2] || ''
//         };
//         const formatted = formatAddressFromDaData(tempData);
//         const techResult = checkTechnicalPossibility(formatted);
//         if (!techResult.isPossible) {
//           alert('Технической возможности нет');
//           // Можно вызвать функцию очистки карточек, если требуется: clearTariffs();
//         } else {
//           alert(`Техническая возможность: ${techResult.txb}`);
//         }
//         const cityName = parts[0].trim();
//         updateCityInElements(cityName);
//         // Сохраняем данные о местоположении с полным адресом и результатом проверки
//         saveUserLocation({ city: cityName, address: currentAddress, techResult: techResult });
//       } else {
//         saveUserLocation({ city: currentAddress });
//       }
//     }
//   });
}

// ================================
// ФУНКЦИЯ ДЛЯ ПОПАПА ВЫБОРА ГОРОДА
// ================================

/**
 * Инициализирует попап выбора города/адреса.
 * Логика:
 *  - Если в localStorage уже сохранён userLocation с непустым городом, то при открытии попапа он используется.
 *  - Если пользователь вводит полный адрес (город, улица, дом), то проверяется техническая возможность, и в userLocation сохраняются
 *    выбранный город, полный адрес и результат проверки.
 *  - Если введён только город, то сохраняется только город.
 *  - Также в попапе показывается предзагруженный список городов из файла cities.json.
 *
 * @param {string} popupSelector - селектор попапа.
 */
function initCityPopup(popupSelector) {
  let localCities = [];

  // Используем уже существующую функцию saveUserLocation вместо отдельного saveSelection.
  // Таким образом, данные сохраняются в localStorage под ключом "userLocation".
  
  // Устанавливаем стили для контейнеров с подсказками и локальными городами
  $(popupSelector).find('#suggestions, #local-cities').css({
    'max-height': '300px',
    'overflow-y': 'auto'
  });

  // Функция отображения локальных городов из файла cities.json
  function showLocalCities() {
    const $localCitiesDiv = $(popupSelector).find('#local-cities');
    $localCitiesDiv.empty();
    localCities.forEach(function(city) {
      $localCitiesDiv.append(
        `<div class="local-city" data-city='${JSON.stringify(city)}'>
          ${city.name} ${city.type}
        </div>`
      );
    });
    $localCitiesDiv.show();
  }

  // Загружаем список городов из файла cities.json (отбираем записи с "visible": "yes")
  $.getJSON('cities.json', function(data) {
    if (data && data.cities) {
      localCities = data.cities.filter(function(city) {
        return city.visible === "yes";
      });
      localCities.sort((a, b) => a.name.localeCompare(b.name));
      showLocalCities();
    }
  }).fail(function(jqxhr, textStatus, error) {
    console.error("Ошибка загрузки cities.json:", textStatus, error);
  });

  // Функция для удаления дубликатов подсказок по отформатированному адресу
  function deduplicateSuggestions(suggestions) {
    const seen = {};
    return suggestions.filter(suggestion => {
      if (seen[suggestion.formatted]) return false;
      seen[suggestion.formatted] = true;
      return true;
    });
  }

  /**
   * Запрашивает подсказки от DaData.
   * Если в localStorage уже сохранён userLocation, то первым ищутся адреса по его city_fias_id (если он указан),
   * затем – по региональному fias.
   * @param {string} query - запрос пользователя.
   */
  function fetchDaDataSuggestions(query) {
    let locations = [];
    const storedLocationStr = localStorage.getItem('userLocation');
    if (storedLocationStr) {
      try {
        const storedLocation = JSON.parse(storedLocationStr);
        if (storedLocation.city && storedLocation.cityFiasId) {
          locations.push({ city_fias_id: storedLocation.cityFiasId });
        }
      } catch (e) {
        console.error("Ошибка парсинга userLocation:", e);
      }
    }
    locations.push({ region_fias_id: regionFiasId });

    const requestData = {
      query: query,
      count: 10,
      locations: locations
    };

    $.ajax({
      url: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      method: 'POST',
      headers: { "Authorization": `Token ${dadataToken}` },
      contentType: 'application/json',
      data: JSON.stringify(requestData),
      success: function(data) {
        let suggestions = data.suggestions || [];
        suggestions = suggestions.map(item => ({
          data: item.data,
          formatted: formatAddressFromDaData(item.data)
        }));
        suggestions = deduplicateSuggestions(suggestions);

        const $suggestionsDiv = $(popupSelector).find('#suggestions');
        $suggestionsDiv.empty();
        if (suggestions.length > 0) {
          suggestions.forEach(function(suggestion) {
            $suggestionsDiv.append(
              `<div class="dadata-suggestion" data-data='${JSON.stringify(suggestion.data)}'>
                ${suggestion.formatted}
              </div>`
            );
          });
          $suggestionsDiv.show();
          $(popupSelector).find('#local-cities').hide();
        } else {
          $suggestionsDiv.hide();
          $(popupSelector).find('#local-cities').show();
        }
      },
      error: function(err) {
        console.error("Ошибка DaData:", err);
      }
    });
  }

  // Обработка ввода в поле попапа
  $(popupSelector).find('.popup-address__input').on('input', function() {
    const query = $(this).val().trim();
    if (query.length >= 3) {
      fetchDaDataSuggestions(query);
    } else {
      $(popupSelector).find('#suggestions').hide();
      $(popupSelector).find('#local-cities').show();
    }
    $(popupSelector).find('.dadata-suggestion, .local-city').removeClass('input_active');
  });

  // При клике по подсказке DaData
  $(popupSelector).on('click', '.dadata-suggestion', function() {
    let dataAttr = $(this).attr('data-data');
    let suggestionData;
    try {
      suggestionData = JSON.parse(dataAttr);
    } catch (e) {
      console.error("Ошибка парсинга данных DaData:", e);
      return;
    }
    const formatted = formatAddressFromDaData(suggestionData);
    const isFullAddress = suggestionData.house && suggestionData.house.trim() !== '';
    $(popupSelector).find('.popup-address__input').val(formatted);
    $(popupSelector).find('#suggestions').empty().hide();
    $(popupSelector).find('.dadata-suggestion').removeClass('input_active');
    $(this).addClass('input_active');

    if (isFullAddress) {
      const techResult = checkTechnicalPossibility(formatted);
      const selectedCity = {
        name: suggestionData.city || formatted,
        cityFiasId: suggestionData.city_fias_id || ''
      };
      saveUserLocation({
        city: selectedCity.name,
        address: formatted,
        techResult: techResult
      });
      if (techResult.isPossible) {
        alert(`Техническая возможность: ${techResult.txb}`);
      } else {
        alert('Технической возможности нет');
      }
    } else {
      const selectedCity = {
        name: suggestionData.city || formatted,
        cityFiasId: suggestionData.city_fias_id || ''
      };
      closePopup()
      saveUserLocation({ city: selectedCity.name });
    }
  });

  // При клике по локальному городу (из cities.json)
  $(popupSelector).on('click', '.local-city', function() {
    let dataAttr = $(this).attr('data-city');
    let cityObj;
    try {
      cityObj = JSON.parse(dataAttr);
    } catch (e) {
      console.error("Ошибка парсинга данных локального города", e);
      return;
    }
    $(popupSelector).find('.popup-address__input').val(cityObj.name);
    $(popupSelector).find('#local-cities .local-city').removeClass('input_active');
    $(this).addClass('input_active');
    saveUserLocation({ city: cityObj.name, address: "" });
    closePopup()
  });

  // Обработка нажатия клавиши Enter в попапе
  $(popupSelector).find('.popup-address__input').on('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputVal = $(this).val().trim();
      $(popupSelector).find('#suggestions').empty().hide();
      if (inputVal.indexOf(',') !== -1) {
        const techResult = checkTechnicalPossibility(inputVal);
        const cityName = inputVal.split(',')[0].trim();
        closePopup()
        saveUserLocation({ city: cityName, address: inputVal, techResult: techResult });
        if (techResult.isPossible) {
          alert(`Техническая возможность: ${techResult.txb}`);
        } else {
          alert('Технической возможности нет');
        }
      } else {
        closePopup()
        saveUserLocation({ city: inputVal });
      }
    }
  });
}

// ================================
// ФУНКЦИЯ ОБНОВЛЕНИЯ ЭЛЕМЕНТОВ С ГОРОДОМ
// ================================
/**
 * Обновляет все элементы на странице, где отображается город.
 * Например, элементы с классом ".location__city-name".
 */
function updateCityInElements(city) {
  const locationCityElements = document.querySelectorAll(".location__city-name");
  locationCityElements.forEach(element => {
    element.textContent = city;
  });
  console.log(`[LOG] Город обновлён в элементах: ${city}`);
}

// ================================
// ИНИЦИАЛИЗАЦИЯ
// ================================
$(document).ready(function() {
  loadTechnicalData('./adress.json'); // Загружаем технические данные из JSON
  initManualAddressInput('.popup-address__input', regionFiasId); // Инициализируем автоподсказки для поля адреса
  initCityPopup('.popup-city-change', regionFiasId); // Инициализируем попап выбора города/адреса
  // Инициализируем попап только если в localStorage нет сохранённого userLocation с непустым городом
//   (async function initPopup() {
//     console.log("[LOG] Инициализация попапа...");
//     const storedData = localStorage.getItem("userLocation");
//     if (storedData) {
//       try {
//         const storedLocation = JSON.parse(storedData);
//         if (storedLocation.city && storedLocation.city.trim() !== "") {
//           console.log("[LOG] Данные найдены в localStorage:", storedLocation);
//           userLocation = storedLocation;
//           currentCity.textContent = `г. ${storedLocation.city}`;
//           updateCityInElements(storedLocation.city);
//           return; // Не перезаписываем сохранённый город
//         }
//       } catch (e) {
//         console.error("[ERROR] Ошибка парсинга userLocation из localStorage:", e);
//       }
//     }
    // // Если данных нет – загружаем список городов и устанавливаем дефолтный город
    // const defaultCityName = await loadCities();
    // console.log("[LOG] Устанавливаем дефолтный город...");
    // currentCity.textContent = `г. ${defaultCityName}`;
    // locationPopup.classList.remove("hidden");
    // // Позиционируем попап
    // const bannerCityElement = document.querySelector(".banner .location__city");
    // if (bannerCityElement) {
    //   const bounds = bannerCityElement.getBoundingClientRect();
    //   locationPopup.style.top = `${bounds.bottom + window.scrollY + 10}px`;
    //   locationPopup.style.left = `${bounds.left + window.scrollX}px`;
    // }
//     // Пытаемся определить город по координатам
//     const detectedCity = await detectCityByCoordinates();
//     if (detectedCity && detectedCity.cityName) {
//       console.log(`[LOG] Определён город по координатам: ${detectedCity.cityName}`);
//       currentCity.textContent = detectedCity.cityName;
//       saveUserLocation({ city: detectedCity.cityName });
//     } else {
//       console.warn("[WARNING] Город не удалось определить, остаётся дефолтный город.");
//     }
//   })();
});