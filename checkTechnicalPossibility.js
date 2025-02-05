const dadataToken = '549f6e44bb6269eed79da8d09d37e0ff7042035f'; // Токен DaData
const regionFiasId = '393aeccb-89ef-4a7e-ae42-08d5cebc2e30';       // FIAS ID области
let technicalData = []; // Технические данные, загружаемые из JSON

// Глобальный объект для хранения данных о местоположении пользователя
let userLocation = {
  city: "",
  address: "",      // Отформатированный адрес для проверки технической возможности (например: "г Кемерово Свободы улица 7")
  techResult: null,
  fullAddress: "",  // Полное представление адреса для отображения (например: "г Кемерово, пр-кт ленина, д 115")
};

// Функция нормализации типа улицы. Если обнаруживается "микрорайон" или его сокращения, возвращает "микрорайон"
function determineFullStreetType(streetWithType) {
    if (!streetWithType) return '';
    const lower = streetWithType.toLowerCase();
    if (lower.includes('микрорайон') || lower.includes(' мкр') || lower.includes('мкр.')) {
        return 'микрорайон';
    }
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
  
// Формирует отформатированную строку адреса для проверки технической возможности.
// Пример: если поля DaData таковы:
//   data.city_with_type = "г Кемерово"
//   data.street = "Свободы"
//   data.street_with_type = "улица"
//   data.house = "7"
// то функция вернёт: "г Кемерово Свободы улица 7"
function getFormattedAddressString(data) {
    const city = data.settlement_with_type || data.city_with_type || data.city || "";
    let street = "";
    if (data.street) {
        const streetType = determineFullStreetType(data.street_with_type || "");
        street = data.street + ' ' + streetType;
    }
    const building = data.house || "";
    return `${city.trim()} ${street.trim()} ${building.trim()}`.replace(/\s+/g, " ").trim();
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


// Формирует полное представление адреса для отображения (с разделителями и сокращениями).
// Если поле street_with_type уже содержит название улицы, то используется оно без дублирования.
// Пример 1:
//   data.city_with_type = "г Кемерово"
//   data.street = "Ленина"
//   data.street_with_type = "пр-кт ленина"
//   data.house = "115"
// Вернёт: "г Кемерово, пр-кт ленина, д 115"
// Пример 2:
//   data.city_with_type = "г Кемерово"
//   data.street = "Свободы"
//   data.street_with_type = "улица"
//   data.house = "7"
// Вернёт: "г Кемерово, ул Свободы, д 7"
function getFullAddressString(data) {
    const city = data.settlement_with_type || data.city_with_type || data.city || "";
    const building = data.house || "";
    const street = data.street || "";
    const street_with_type = data.street_with_type || "";
    
    const streetNormalized = street.trim().toLowerCase();
    const streetWithTypeNormalized = street_with_type.trim().toLowerCase();
    
    // Если street_with_type уже содержит street, то используем его как есть
    if (streetNormalized && streetWithTypeNormalized.includes(streetNormalized)) {
        return `${city.trim()}, ${street_with_type.trim()}, д ${building.trim()}`.replace(/\s+/g, " ").trim();
    } else {
        // Иначе, определяем сокращённое обозначение типа улицы
        let streetAbbr = "";
        let streetTypeFull = street_with_type.toLowerCase();
        if (streetTypeFull.includes("улица")) {
            streetAbbr = "ул";
        } else if (streetTypeFull.includes("проспект")) {
            streetAbbr = "пр-кт";
        } else if (streetTypeFull.includes("переулок")) {
            streetAbbr = "пер";
        } else if (streetTypeFull.includes("шоссе")) {
            streetAbbr = "ш.";
        } else if (streetTypeFull.includes("бульвар")) {
            streetAbbr = "бул";
        } else if (streetTypeFull.includes("микрорайон") || streetTypeFull.includes(" мкр") || streetTypeFull.includes("мкр.")) {
            streetAbbr = "мкр";
        } else {
            streetAbbr = street_with_type;
        }
        return `${city.trim()}, ${streetAbbr} ${street.trim()}, д ${building.trim()}`.replace(/\s+/g, " ").trim();
    }
}
  
// Проверяет техническую возможность, сравнивая нормализованный отформатированный адрес с техническими данными
function checkTechnicalPossibility(formattedAddress) {
    console.log('Проверяем техническую возможность для:', formattedAddress);
    const normalizedAddress = formattedAddress.toLowerCase().replace(/\s+/g, ' ').trim();
    const match = technicalData.find(item => {
      const itemAddress = `${item.city} ${item.street} ${item.building}`.toLowerCase().replace(/\s+/g, ' ').trim();
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
  
// Загружает технические данные из JSON-файла и нормализует их (приводит все строки к нижнему регистру)
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
  
// Сохраняет данные о местоположении пользователя
// city – название города,
// address – отформатированный адрес (например, "г Кемерово Свободы улица 7"),
// fullAddress – полное представление адреса (например, "г Кемерово, пр-кт ленина, д 115"),
// techResult – результат проверки технической возможности.
function saveUserLocation({ city, address = "", techResult = null, fullAddress = "", cityFias = "" }) {
    userLocation = { city, address, techResult, fullAddress, cityFias };
    localStorage.setItem("userLocation", JSON.stringify(userLocation));
    console.log("[LOG] userLocation сохранён:", userLocation);
    window.dispatchEvent(new Event("userLocationChanged"));
    updateCityInElements(city);
    // При необходимости можно вызвать updateTariffs()
}
  
// Удаляет дубликаты подсказок, сравнивая отформатированные адреса (приводим к нижнему регистру)
function deduplicateSuggestions(suggestions) {
    const seen = {};
    return suggestions.filter(item => {
      const formatted = getFormattedAddressString(item.data);
      if (seen[formatted.toLowerCase()]) return false;
      seen[formatted.toLowerCase()] = true;
      return true;
    });
}
  
// Обновляет элементы на странице, где отображается название города
function updateCityInElements(city) {
    const locationCityElements = document.querySelectorAll(".location__city-name");
    locationCityElements.forEach(element => {
      element.textContent = city;
    });
    console.log(`[LOG] Город обновлён в элементах: ${city}`);
}
  
// Инициализирует подсказки DaData для инпута адреса
function initManualAddressInput(inputSelector, regionFiasId = '') {
  $(inputSelector).on('input', function() {
    const inputVal = $(this).val();
    // Разбиваем введённый текст по запятым, убираем лишние пробелы и пустые элементы
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
        // Удаляем дубликаты подсказок
        suggestions = deduplicateSuggestions(suggestions);
        const suggestionsDiv = $('#suggestions');
        suggestionsDiv.empty();

        suggestions.forEach(item => {
          // Для отображения используем неотформатированный адрес, полученный от DaData (item.value)
          const rawAddress = item.value;
          // Если режим "house", проверяем, что адрес полный (fias_level === "8" и поле house присутствует)
          if (stage === 'house') {
            if (item.data.fias_level !== '8' || !item.data.house) return;
          }
          suggestionsDiv.append(
            `<div data-suggestion='${JSON.stringify(item)}'>${rawAddress}</div>`
          );
        });
      },
      error: function(err) {
        console.error('Ошибка DaData:', err);
      }
    });
  });

  // Обработка клика по подсказке: обновляем инпут и сохраняем данные, если адрес полный
  $('#suggestions').on('click', 'div', function() {
    let suggestion = $(this).data('suggestion');
    if (typeof suggestion === 'string') {
      try {
        suggestion = JSON.parse(suggestion);
      } catch (e) {
        console.error('Ошибка парсинга данных подсказки', e);
        return;
      }
    }

    // Формируем отформатированную строку адреса (без запятых) для проверки технической возможности
    const formattedAddress = getFormattedAddressString(suggestion.data);
    // Формируем полное представление адреса (с разделителями и сокращениями)
    const fullAddressFormatted = getFullAddressString(suggestion.data);
    const isComplete = suggestion.data.house && suggestion.data.house.trim() !== '';
    // Обновляем инпут неотформатированным адресом, полученным от DaData
    $(inputSelector).val(suggestion.value);
    $('#suggestions').empty();
    if (isComplete) {
      const techResult = checkTechnicalPossibility(formattedAddress);
      console.log(suggestion);
      // Если в ответе от DaData присутствует другой населённый пункт (например, пгт, село и т.д.), используем его,
      // иначе возвращаем значение для города
      const cityName = suggestion.data.settlement || suggestion.data.city|| suggestion.data.city_with_type || "";
      updateCityInElements(cityName);
      // Сохраняем данные: address – отформатированный адрес, fullAddress – полное представление адреса
      saveUserLocation({ city: cityName, address: formattedAddress, techResult: techResult, fullAddress: fullAddressFormatted, cityFias: suggestion.data.city_fias_id });
      closePopup();
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
  // $(popupSelector).find('#suggestions').css({

  // });

  // Функция отображения локальных городов из файла cities.json
  function showLocalCities() {
    const $localCitiesDiv = $(popupSelector).find('#local-cities');
    $localCitiesDiv.empty();
    localCities.forEach(function(city) {
      $localCitiesDiv.append(
        `<div class="local-city" data-city='${JSON.stringify(city)}'>
         ${city.type} ${city.name} 
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
        techResult: techResult,
        cityFias: suggestionData.city_fias_id
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
      saveUserLocation({ city: selectedCity.name, cityFias: suggestionData.city_fias_id });
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
    $(popupSelector).find('#local-cities .local-city').removeClass('input_active');
    $(this).addClass('input_active');
    saveUserLocation({ city: cityObj.name, address: "", cityFias: cityObj.cityFiasId });
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