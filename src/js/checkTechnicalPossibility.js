import $ from 'jquery';
import {closePopup} from './index.js'
import {saveUserLocation, userLocation} from './popup.js'

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
  const city = data.city_with_type || data.city || "";
  const settlement = data.settlement_with_type || "";
  const building = data.house || "";
  const street = data.street || "";
  const street_with_type = data.street_with_type || "";
  const blockType = data.block_type;
  const block = data.block;

  // Если улица существует, нормализуем её для сравнения
  const streetNormalized = street.trim().toLowerCase();
  const streetWithTypeNormalized = street_with_type.trim().toLowerCase();

  // Если есть и город, и населенный пункт (settlement), но нет улицы
  if (city && settlement && !street) {
    return `${city.trim()}, ${settlement.trim()}, д ${building.trim()} ${(blockType && block) ? `${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
  }

  // Если есть и город, и населенный пункт, и улица
  if (city && settlement) {
    // Если street_with_type уже содержит street, используем его как есть
    if (streetNormalized && streetWithTypeNormalized.includes(streetNormalized)) {
      return `${city.trim()}, ${settlement.trim()}, ${street_with_type.trim()}, д ${building.trim()} ${(blockType && block) ? `${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
    } else {
      // Определяем сокращённое обозначение типа улицы
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
      return `${city.trim()}, ${settlement.trim()}, ${streetAbbr} ${street.trim()}, д ${building.trim()} ${(blockType && block) ? `${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
    }
  }

  // Если есть только город и улица
  if (city && !settlement) {
    return `${city.trim()}, ${street.trim()}, д ${building.trim()} ${(blockType && block) ? `${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
  }

  // Если только settlement (без города), но есть улица и дом
  if (!city && settlement && street && building) {
    return `${settlement.trim()}, ${street.trim()}, д ${building.trim()} ${(blockType && block) ? `${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
  }

  // Если только settlement без улицы (смотрим на другие данные)
  if (!city && settlement) {
    return `${settlement.trim()}, д ${building.trim()} ${(blockType && block) ? `${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
  }

  // Если только settlement без улицы и дома
  if (!city && !settlement) {
    return `${street.trim()}, д ${building.trim()} ${(blockType && block) ? `${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
  }

  // Если нет ни города, ни settlement, то просто улица и дом
  return `${street.trim()}, д ${building.trim()} ${(blockType && block) ? `${blockType} ${block}` : ''}`.replace(/\s+/g, " ").trim();
}


// Проверяет техническую возможность, сначала по fias, а затем по нормализованному адресу
function checkTechnicalPossibility(formattedAddress, fias) {
  // Сначала проверяем по fias
  const matchByFias = technicalData.find(item => item.fias === fias);
  
  if (matchByFias) {
    console.log(`По фиас`)
    return { isPossible: true, txb: matchByFias.txb };
  }

  // Если по fias не нашли, то проверяем по нормализованному адресу
  const normalizedAddress = formattedAddress.toLowerCase().replace(/\s+/g, ' ').trim();
  const matchByAddress = technicalData.find(item => {
    const itemAddress = `${item.city} ${item.street} ${item.building} ${item.block || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
    return itemAddress === normalizedAddress;
  });

  if (matchByAddress) {
    console.log(`По адресу`)
    return { isPossible: true, txb: matchByAddress.txb };
  } else {
    return { isPossible: false };
  }
}

// Загружает технические данные из JSON-файла и нормализует их (приводит все строки к нижнему регистру)
function loadTechnicalData(jsonUrl) {
  $.getJSON(jsonUrl, function(data) {
    technicalData = data.map(item => ({
      city: item.city_witch_type.toLowerCase(),
      street: item.street.toLowerCase(),
      building: item.house.toLowerCase(),
      block: item.block.toLowerCase(),  // Добавили block в технические данные
      txb: item.txb, 
      fias: item.fias
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
  $(inputSelector).on('input', function() {
    const inputVal = $(this).val();
    const parts = inputVal.split(',').map(s => s.trim()).filter(s => s.length > 0);

    let stage = 'free';
    let requestData = {
      query: inputVal.trim(),
      count: 5,
      locations: regionFiasId ? [{ region_fias_id: regionFiasId }] : []
    };

    // Если город из userLocation существует, добавляем его в запрос
    if (userLocation.cityFias) {
      requestData.locations.push({ region_fias_id: userLocation.cityFias });
    }

    // Обработка ввода
    if (parts.length === 2) {
      stage = 'street';
      requestData.from_bound = { value: "street" };
      requestData.to_bound = { value: "street" };
      requestData.query = (parts[0] ? parts[0] + ' ' : '') + parts[1];
      requestData.from_level = '7'; // Уровень для улиц
    } else if (parts.length >= 3) {
      stage = 'house';
      requestData.from_bound = { value: "house" };
      requestData.to_bound = { value: "house" };
      requestData.query = ((parts[0] ? parts[0] + ' ' : '') + (parts[1] ? parts[1] + ' ' : '')) + parts[2];
      requestData.from_level = '8'; // Уровень для домов
    }

    // Если длина запроса меньше 3 символов, не делаем запрос
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
        // Сортируем подсказки, чтобы те, что соответствуют фиас городу пользователя, шли первыми
        suggestions = suggestions.sort((a, b) => {
          const isCityA = a.data.city_fias_id === userLocation.cityFias;
          const isCityB = b.data.city_fias_id === userLocation.cityFias;
          return isCityB - isCityA; // Сортируем, чтобы вначале шли подсказки с фиас города пользователя
        });

        // Удаляем дубликаты подсказок
        suggestions = deduplicateSuggestions(suggestions);
        const suggestionsDiv = $('#suggestions');
        suggestionsDiv.empty();
       

        suggestions.forEach(item => {
          console.log(item)
          // Формируем строку адреса
          const rawAddress = item.value;
          const cityName = resolveCityName(item.data) || item.data.settlement || item.data.city || item.data.city_with_type || "";
          const street = item.data.street_with_type || '';
          const house = item.data.house || '';
          const regionText = `${item.data.region_with_type} ${item.data.city_with_type || ''} ${item.data.settlement_with_type || ''}`.trim() || '';

          // Проверяем, есть ли улица
          let address = '';
          let region = '';

          if (street) {
            // Если есть улица, используем текущую логику
            address = `${street} ${house}`.trim();
            region = `${item.data.region_with_type|| ''} ${item.data.city_with_type || ''} ${item.data.settlement_with_type || ''}`.trim() || '';
          } else {
            // Если улицы нет, показываем city_with_type и settlement_with_type
            address = `${item.data.city_with_type || ''} ${item.data.settlement_with_type || ''} ${house || ''}`.trim();
            region = item.data.region_with_type || '';
          }

          // Пропускаем подсказки с уровнем фиас ниже 4
          if (item.data.fias_level < 4) {
            return; // Пропускаем добавление подсказки, если уровень фиас меньше 4
          }

          // Убираем подсказки, которые содержат "тер" (например, "территория" или "проезд")
          if (/тер/i.test(rawAddress)) {
            return; // Пропускаем добавление подсказки, если она содержит "тер"
          }

          // Добавляем подсказку
          suggestionsDiv.append(
            `<div class="suggetion-container" data-suggestion='${JSON.stringify(item)}'>
              <div class="suggetion-address" data-suggestion='${JSON.stringify(item)}'>${address}</div>
              <div class="suggetion-city" data-suggestion='${JSON.stringify(item)}'>${region}</div>
            </div>`
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
        console.log(suggestion)
      } catch (e) {
        console.error('Ошибка парсинга данных подсказки', e);
        return;
      }
    }

    // Формируем отформатированную строку адреса
    const formattedAddress = getFormattedAddressString(suggestion.data);
    // Формируем полное представление адреса (с разделителями и сокращениями)
    const fullAddressFormatted = getFullAddressString(suggestion.data);
    const isComplete = suggestion.data.house && suggestion.data.house.trim() !== '';
    const fiasAddress = suggestion.data.house_fias_id.trim()
    // Обновляем инпут неотформатированным адресом
    $(inputSelector).val("");
    $('#suggestions').empty();

    if (isComplete) {
      console.log(fiasAddress)
      const techResult = checkTechnicalPossibility(formattedAddress, fiasAddress);

      // Используем resolveCityName для корректного города
      const cityName = resolveCityName(suggestion.data) || suggestion.data.settlement || suggestion.data.city || suggestion.data.city_with_type || "";

      // Формируем правильный адрес (город + улица + дом)
      const formattedAddressWithCity = `${cityName} ${suggestion.data.street_with_type || ''} ${suggestion.data.house || ''}`.trim();

      const cityWitchType = `${suggestion.data.city_type || suggestion.data.settlement_type || ''} ${cityName}`;
      

      // Сохраняем данные
      saveUserLocation({
        city: cityName,
        cityWitchType: cityWitchType,
        address: formattedAddressWithCity, // Сохраняем отформатированный адрес
        techResult: techResult,
        fullAddress: fullAddressFormatted, // Неотформатированный адрес
        cityFias: suggestion.data.city_fias_id,
      });

      updateCityInElements(cityName, cityWitchType);
      closePopup();
    }
  });
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
        
        suggestions = deduplicateSuggestions(suggestions);
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



        const $suggestionsDiv = $(popupSelector).find('#suggestions');
        $suggestionsDiv.empty();
        if (suggestions.length > 0) {
          suggestions.forEach(function(suggestion) {
            $suggestionsDiv.append(
              `<div class="suggetion-container" class="dadata-suggestion" data-suggestion='${JSON.stringify(suggestion)}'>
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
    const cityWitchType = `${data.city_type || data.settlement_type  || ""} ${cityName || ""}`
    console.log(cityWitchType)
    // Очищаем инпут после выбора подсказки
    $(popupSelector).find('.popup-address__input').val('');
    $(popupSelector).find('#suggestions').empty().hide();
    $(popupSelector).find('.dadata-suggestion').removeClass('input_active');
    $(this).addClass('input_active');
    saveUserLocation({ city: cityName, cityWitchType: cityWitchType, fullAddress: "", cityFias: data.city_fias_id || "" });
    updateCityInElements(cityName, cityWitchType);
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
    const cityWitchType = `${cityObj.type} ${cityObj.name}`
    $(popupSelector).find('#local-cities .local-city').removeClass('local-city-input_active');
    $(this).addClass('local-city-input_active');
    // Очищаем инпут после выбора
    $(popupSelector).find('.popup-address__input').val('');
    saveUserLocation({ city: cityObj.name, cityWitchType: cityWitchType, fullAddress: "", cityFias: cityObj.cityFiasId });
    updateCityInElements(cityObj.name, cityWitchType);
    closePopup();
  });
}
// ================================
// ФУНКЦИЯ ОБНОВЛЕНИЯ ЭЛЕМЕНТОВ С ГОРОДОМ
// ================================
/**
 * Обновляет все элементы на странице, где отображается город.
 * Например, элементы с классом ".location__city-name".
 */
export function updateCityInElements(city, cityWitchType) {
  const locationCityElements = document.querySelectorAll(".location__city-name");
  locationCityElements.forEach(element => {
    element.textContent = city;
  });
  if(cityWitchType){
  document.querySelector(".nav-section__title_city").textContent = `в ${cityWitchType}`
  }
  // console.log(`[LOG] Город обновлён в элементах: ${city}`);
}

// ================================
// ИНИЦИАЛИЗАЦИЯ
// ================================
$(document).ready(function() {
  loadTechnicalData('./json/address.json'); // Загружаем технические данные из JSON
  initManualAddressInput('.popup-address__input', regionFiasId); // Инициализируем автоподсказки для поля адреса
  initCityPopup('.popup-city-change', regionFiasId); // Инициализируем попап выбора города/адреса
  console.log(userLocation)
});