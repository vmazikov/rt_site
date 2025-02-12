import $ from 'jquery';
import {closePopup} from './index.js'
import {userLocation} from "./popup.js"
import {saveUserLocation} from './popup.js'

export const dadataToken = '549f6e44bb6269eed79da8d09d37e0ff7042035f'; // Токен DaData
const regionFiasId = '393aeccb-89ef-4a7e-ae42-08d5cebc2e30';       // FIAS ID области
let technicalData = []; // Технические данные, загружаемые из JSON
let localCities = [];

// Загружаем список городов из файла cities.json
$.getJSON('./json/cities.json', function(data) {
  if (data && data.cities) {
    // Игнорируем поле visible при проверке наличия города
    localCities = data.cities; // Все города, без фильтрации по visible
  }
}).fail(function(jqxhr, textStatus, error) {
  console.error("Ошибка загрузки cities.json:", textStatus, error);
});


// Нормализуем типы улиц (улица, проспект и т.д.)
function normalizeStreetType(streetWithType) {
  if (!streetWithType) return '';
  const lower = streetWithType.toLowerCase();
  if (lower.includes('микрорайон') || lower.includes('мкр') || lower.includes('мкр.')) {
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
  if (lower.includes('кв-л')) {
    return 'квартал';
  }
  if (lower.includes('территория') || lower.includes('проезд')) {
    return 'территория';
  }
  return streetWithType;
}

// Функция для проверки и корректного добавления корпуса к дому
function normalizeHouse(building, block, blockType) {
  if (block && blockType) {
    // Если есть и корпус, и тип корпуса, то комбинируем
    return `${building} ${block}`.trim(); // Убираем "к", сохраняем только корпус
  }
  return building || ""; // Если корпуса нет, возвращаем только дом
}

// Формирует отформатированную строку адреса для проверки технической возможности.
function getFormattedAddressString(data) {
  let city = data.city_with_type || data.settlement_with_type || data.city || "";

  // Если есть settlement, проверим его в файле localCities (игнорируя поле visible)
  if (data.settlement) {
    const candidate = data.settlement.trim().toLowerCase();
    // Если settlement найдено среди городов, используем его
    const found = localCities.some(function(cityData) {
      return cityData.name.trim().toLowerCase() === candidate;
    });
    if (found) {
      city = data.settlement_with_type || data.settlement || "";
    }
  }

  let street = "";
  if (data.street) {
    const streetType = normalizeStreetType(data.street_with_type || "");
    street = data.street + ' ' + streetType;
  }

  // Используем функцию для нормализации поля house, добавляем корпус если нужно
  const building = normalizeHouse(data.house, data.block, data.block_type);

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
  const streetType = normalizeStreetType(data.street_with_type || '');
  const building = (data.house || '').toLowerCase();
  const block = (data.block || '').toLowerCase();
  return `${settlementWithType} ${streetName} ${streetType} ${building} ${block}`.replace(/\s+/g, ' ').trim();
}

// Формирует полное представление адреса для отображения (с разделителями и сокращениями).
function getFullAddressString(data) {
  const city = data.settlement_with_type || data.city_with_type || data.city || "";
  const building = data.house || "";
  const street = data.street || "";
  const street_with_type = data.street_with_type || "";
  const blockType = data.block_type
  const block = data.block
  
  const streetNormalized = street.trim().toLowerCase();
  const streetWithTypeNormalized = street_with_type.trim().toLowerCase();
  
  // Если street_with_type уже содержит street, то используем его как есть
  if (streetNormalized && streetWithTypeNormalized.includes(streetNormalized)) {
    return `${city.trim()}, ${street_with_type.trim()}, д ${building.trim()} ${(blockType && block) ? ` ${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
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
    } else if (streetTypeFull.includes("квартал")) {
      streetAbbr = "кв";
    } else if (streetTypeFull.includes("территория") || streetTypeFull.includes("проезд")) {
      streetAbbr = "тер.";
    } else {
      streetAbbr = street_with_type;
    }
    return `${city.trim()}, ${streetAbbr} ${street.trim()}, д ${building.trim()} ${(blockType && block) ? ` ${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
  }
}

// Проверяет техническую возможность, сравнивая нормализованный отформатированный адрес с техническими данными
function checkTechnicalPossibility(formattedAddress) {
  // console.log('Проверяем техническую возможность для:', formattedAddress);
  const normalizedAddress = formattedAddress.toLowerCase().replace(/\s+/g, ' ').trim();
  const match = technicalData.find(item => {
    const itemAddress = `${item.city} ${item.street} ${item.building} ${item.block || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
    return itemAddress === normalizedAddress;
  });
  if (match) {
    // console.log(`Техвозможность ${match.txb}`);
    return { isPossible: true, txb: match.txb };
  } else {
    // console.log('Техвозможность не найдена');
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
      block: item.block.toLowerCase(),  // Добавили block в технические данные
      txb: item.txb
    }));
    // console.log('Technical data loaded and normalized:', technicalData);
  });
}

function resolveCityName(data) {
  if (data.settlement) {
    var candidate = data.settlement.trim().toLowerCase();
    // Ищем в localCities (уже загруженных из cities.json) город с таким именем, игнорируя поле visible
    var found = localCities.some(function(city) {
      return city.name.trim().toLowerCase() === candidate;
    });
    if (found) {
      return data.settlement;
    }
  }
  return data.city || data.city_with_type || "";
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



// Инициализирует подсказки DaData для инпута адреса
function initManualAddressInput(inputSelector, regionFiasId = '') {
  let localCities = [];

  // Загружаем список городов из файла cities.json
  $.getJSON('./json/cities.json', function(data) {
    if (data && data.cities) {
      // Игнорируем поле visible при проверке наличия города
      localCities = data.cities; // Все города, без фильтрации по visible
    }
  }).fail(function(jqxhr, textStatus, error) {
    console.error("Ошибка загрузки cities.json:", textStatus, error);
  });

  $(inputSelector).on('input', function() {
    const inputVal = $(this).val();
    const parts = inputVal.split(',').map(s => s.trim()).filter(s => s.length > 0);

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
        // console.log(suggestions);
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
      // console.log(suggestion);




      // Используем resolveCityName для корректного города
      const cityName = resolveCityName(suggestion.data) || suggestion.data.settlement || suggestion.data.city || suggestion.data.city_with_type || "";

      // Формируем правильный адрес (город + улица + дом)
      const formattedAddressWithCity = `${cityName} ${suggestion.data.street_with_type || ''} ${suggestion.data.house || ''}`.trim();

      // Сохраняем данные
      saveUserLocation({
        city: cityName,
        address: formattedAddressWithCity, // Сохраняем отформатированный адрес
        techResult: techResult,
        fullAddress: fullAddressFormatted, // Неотформатированный адрес
        cityFias: suggestion.data.city_fias_id
      });

      updateCityInElements(cityName);
      closePopup();

      // if (techResult.isPossible) {
      //   alert(`Техническая возможность: ${techResult.txb}`);
      // } else {
      //   alert('Технической возможности нет');
      // }
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

  /**
   * Определяет, какое название населённого пункта использовать.
   * Если в ответе DaData есть поле settlement и оно совпадает с полем name у одного из городов из cities.json,
   * то возвращается settlement. Если совпадения нет, возвращается значение поля city (или city_with_type).
   *
   * @param {Object} data - объект с данными, полученными от DaData.
   * @returns {string} - выбранное название населённого пункта.
   */


  // Функция отображения локальных городов из файла cities.json (выводим только видимые города)
  function showLocalCities() {
    const $localCitiesDiv = $(popupSelector).find('#local-cities');
    $localCitiesDiv.empty();
    localCities.forEach(function(city) {
      if (city.visible === "yes") { // Показываем только те города, у которых visible === "yes"
        $localCitiesDiv.append(
          `<div class="local-city" data-city='${JSON.stringify(city)}'>
             ${city.type} ${city.name}
           </div>`
        );
      }
    });
    $localCitiesDiv.show();
  }

  // Загружаем список городов из файла cities.json
  $.getJSON('./json/cities.json', function(data) {
    if (data && data.cities) {
      // Игнорируем поле visible при проверке наличия города
      localCities = data.cities; // Все города, без фильтрации по visible
      showLocalCities(); // Показываем только видимые города в интерфейсе
    }
  }).fail(function(jqxhr, textStatus, error) {
    console.error("Ошибка загрузки cities.json:", textStatus, error);
  });

  // Функция удаления дубликатов подсказок (сравниваем по сырому значению)
  function deduplicateSuggestions(suggestions) {
    const seen = {};
    return suggestions.filter(suggestion => {
      if (seen[suggestion.raw]) return false;
      seen[suggestion.raw] = true;
      return true;
    });
  }

  // Запрос подсказок от DaData для поиска города
  // Возвращаются варианты, в которых присутствует хотя бы одно из полей: city, settlement или settlement_with_type.
  function fetchCitySuggestions(query) {
    const requestData = {
      query: query,
      count: 10,
      locations: []
    };

    // Не задаём from_bound и to_bound, чтобы получить и варианты с settlement.
    // Если в localStorage уже сохранён город, добавляем его fias_id для уточнения запроса.
    let locations = [];
    const storedLocationStr = localStorage.getItem('userLocation');
    if (storedLocationStr) {
      try {
        const storedLocation = JSON.parse(storedLocationStr);
        if (storedLocation.city && storedLocation.cityFias) {
          locations.push({ city_fias_id: storedLocation.cityFias });
        }
      } catch (e) {
        console.error("Ошибка парсинга userLocation:", e);
      }
    }
    locations.push({ region_fias_id: regionFiasId });
    requestData.locations = locations;

    $.ajax({
      url: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      method: 'POST',
      headers: { "Authorization": `Token ${dadataToken}` },
      contentType: 'application/json',
      data: JSON.stringify(requestData),
      success: function(response) {
        let suggestions = response.suggestions || [];
        // Преобразуем ответ – сохраняем сырой адрес (item.value) и объект с данными (item.data)
        suggestions = suggestions.map(item => ({
          data: item.data,
          raw: item.value
        }));

        // Фильтруем подсказки:
        suggestions = suggestions.filter(item => {
          if (!item.raw || item.raw.trim() === "") return false;
          const lowerRaw = item.raw.toLowerCase();
          // Отбрасываем варианты с «район» или «территория»
          if (lowerRaw.includes("район") || lowerRaw.includes("территория")) return false;
          // Исключаем варианты, где указан номер дома (это не чистый выбор города)
          if (item.data.house && item.data.house.trim() !== "") return false;
          // Разрешаем подсказку, если в данных присутствует хотя бы одно из полей:
          // city, settlement или settlement_with_type
          if (!item.data.city && !item.data.settlement && !item.data.settlement_with_type) return false;
          return true;
        });

        suggestions = deduplicateSuggestions(suggestions);

        const $suggestionsDiv = $(popupSelector).find('#suggestions');
        $suggestionsDiv.empty();
        if (suggestions.length > 0) {
          suggestions.forEach(function(suggestion) {
            $suggestionsDiv.append(
              `<div class="dadata-suggestion" data-suggestion='${JSON.stringify(suggestion)}'>
                 ${suggestion.raw}
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

  // Обработка ввода в поле попапа (поиск города)
  $(popupSelector).find('.popup-address__input').on('input', function() {
    const query = $(this).val().trim();
    if (query.length >= 3) {
      fetchCitySuggestions(query);
    } else {
      $(popupSelector).find('#suggestions').empty().hide();
      $(popupSelector).find('#local-cities').show();
    }
    // Сбрасываем активное состояние у подсказок и локальных городов
    $(popupSelector).find('.dadata-suggestion, .local-city').removeClass('input_active');
  });

  // Обработка клика по подсказке DaData
  $(popupSelector).on('click', '.dadata-suggestion', function() {
    let suggestionObj;
    try {
      suggestionObj = JSON.parse($(this).attr('data-suggestion'));
    } catch (e) {
      console.error("Ошибка парсинга данных подсказки DaData:", e);
      return;
    }
    const { data, raw } = suggestionObj;
    // Используем resolveCityName: если settlement присутствует и входит в localCities, возвращается settlement;
    // иначе – используется city (или city_with_type).
    const cityName = resolveCityName(data) || raw;
    // Очищаем инпут после выбора подсказки
    $(popupSelector).find('.popup-address__input').val('');
    $(popupSelector).find('#suggestions').empty().hide();
    $(popupSelector).find('.dadata-suggestion').removeClass('input_active');
    $(this).addClass('input_active');
    saveUserLocation({ city: cityName, fullAddress: "", cityFias: data.city_fias_id || "" });
    updateCityInElements(cityName);
    closePopup();
  });

  // Обработка клика по локальному городу (из списка cities.json)
  $(popupSelector).on('click', '.local-city', function() {
    let cityObj;
    try {
      cityObj = JSON.parse($(this).attr('data-city'));
    } catch (e) {
      console.error("Ошибка парсинга данных локального города", e);
      return;
    }
    $(popupSelector).find('#local-cities .local-city').removeClass('local-city-input_active');
    $(this).addClass('local-city-input_active');
    // Очищаем инпут после выбора
    $(popupSelector).find('.popup-address__input').val('');
    saveUserLocation({ city: cityObj.name, fullAddress: "", cityFias: cityObj.cityFiasId });
    updateCityInElements(cityObj.name);
    closePopup();
  });

  // Обработка нажатия клавиши Enter – сохраняем введённый город и очищаем инпут
  $(popupSelector).find('.popup-address__input').on('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputVal = $(this).val().trim();
      $(popupSelector).find('#suggestions').empty().hide();
      // Очищаем инпут
      $(popupSelector).find('.popup-address__input').val('');
      saveUserLocation({ city: inputVal, fullAddress: "" });
      updateCityInElements(inputVal);
      closePopup();
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
export function updateCityInElements(city) {
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
  loadTechnicalData('./json/address.json'); // Загружаем технические данные из JSON
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