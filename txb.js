    // ================================
    // ПЕРЕМЕННЫЕ И НАСТРОЙКИ
    // ================================
    const dadataToken = '549f6e44bb6269eed79da8d09d37e0ff7042035f'; // Токен DaData
    const regionFiasId = '393aeccb-89ef-4a7e-ae42-08d5cebc2e30'; // FIAS ID области
    let technicalData = [];  // Данные из JSON

    // ================================
    // ФУНКЦИИ
    // ================================

    /**
     * Нормализует тип улицы (ул., ул, улица → улица; пр., просп. → проспект и т.д.).
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
     * Приводит адрес из DaData к нужному формату.
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
     * Получает адрес из DaData по координатам.
     * @param {number} latitude - Широта.
     * @param {number} longitude - Долгота.
     * @param {string} token - Токен DaData.
     * @returns {Promise<string>} - Промис с отформатированным адресом.
     */
    // async function getAddressFromCoords(latitude, longitude, token) {
    //     const url = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address';
    
    //     const requestData = {
    //         lat: latitude,
    //         lon: longitude,
    //         count: 1
    //     };
    
    //     try {
    //         const response = await fetch(url, {
    //             method: 'POST',
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "Authorization": `Token ${token}`
    //             },
    //             body: JSON.stringify(requestData)
    //         });
    
    //         if (!response.ok) {
    //             throw new Error(`Ошибка API DaData: ${response.statusText}`);
    //         }
    
    //         const popup = document.querySelector('.popup-confirm');
    //         const addressElement = document.getElementById('address-init');
    
    //         const data = await response.json();
    
    //         if (data && data.suggestions && data.suggestions.length > 0) {
    //             const suggestion = data.suggestions[0];
    
    //             // Показываем попап
    //             addressElement.querySelector(".popup__title").textContent = suggestion.data.house
    //                 ? 'Это ваш адрес?'
    //                 : `Ваш город: ${suggestion.data.city_with_type}`;
    //             addressElement.querySelector(".popup__text").textContent = suggestion.data.house
    //                 ? `Ваш адрес: ${suggestion.value}`
    //                 : 'Это ваш город?';
    //             openPopup(popup);
    
    //             // Возвращаем Promise, который завершится только после выбора пользователя
    //             return new Promise((resolve) => {
    //                 document.getElementById('confirm-address').onclick = () => {
    //                     closePopup(popup);
    //                     document.querySelectorAll('.location__city-name').forEach(el => el.textContent = suggestion.data.city_with_type);
    //                     document.querySelector('.tariff-section__title').textContent = `Тарифы Ростелеком в ${suggestion.data.city_with_type}`;
    //                     localStorage.setItem('city', suggestion.data.city_with_type);
    
    //                     // Возвращаем адрес, если подтвержден
    //                     resolve(formatAddressFromDaData(suggestion.data));
    //                 };
    
    //                 document.getElementById('nonconfirm-address').onclick = () => {
    //                     closePopup(popup);
    //                     openPopup(popupAddress);
    
    //                     // Возвращаем null, если пользователь отказался
    //                     resolve(null);
    //                 };
    //             });
    //         } else {
    //             console.warn('Не удалось найти адрес по координатам');
    //             return null;
    //         }
    //     } catch (error) {
    //         console.error('Ошибка получения адреса из DaData:', error);
    //         return null;
    //     }
    // }
    

    /**
     * Проверяет техническую возможность по JSON-данным.
     * @param {string} address - отформатированный адрес.
     */
    function checkTechnicalPossibility(address) {
        console.log('Проверяем техническую возможность для:', address);

        const match = technicalData.find(item => {
            const comparisonString = `${item.city} ${item.street} ${item.building}`
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .trim();
            return comparisonString === address;
        });

        if (match) {
            alert(`Техническая возможность: ${match.txb}`);
        } else {
            alert('Технической возможности нет');
        }
    }

    /**
     * Загружает данные из JSON.
     * @param {string} jsonUrl - Путь к JSON файлу.
     */
    function loadTechnicalData(jsonUrl) {
        $.getJSON(jsonUrl, function (data) {
            technicalData = data.map(item => ({
                city: item.city.toLowerCase(),
                street: item.street.toLowerCase(),
                building: item.building.toLowerCase(),
                txb: item.txb
            }));
            console.log('Technical data loaded and normalized:', technicalData);
        });
    }

    /**
     * Инициализирует автоподсказки DaData.
     * @param {string} inputSelector - Селектор поля ввода.
     * @param {string} regionFiasId - FIAS ID региона.
     */
    function initManualAddressInput(inputSelector, regionFiasId = '') {
        $(inputSelector).on('input', function () {
            const inputVal = $(this).val();
            // Разбиваем введённый текст по запятым и убираем лишние пробелы
            const parts = inputVal.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
            // По умолчанию режим «свободного ввода»
            let stage = 'free';
            // Формируем объект запроса для DaData
            let requestData = {
                query: inputVal.trim(),
                count: 5,
                locations: regionFiasId ? [{ region_fias_id: regionFiasId }] : []
            };
    
            // Если пользователь ввёл запятые, определяем этап выбора:
            // 1 часть – свободный режим;
            // 2 части – выбран город, вводится улица;
            // 3 и более частей – вводится дом.
            if (parts.length === 1) {
                stage = 'free';
                // В свободном режиме не накладываем ограничений по from_bound/to_bound
            } else if (parts.length === 2) {
                stage = 'street';
                requestData.from_bound = { value: "street" };
                requestData.to_bound = { value: "street" };
                // Для повышения точности добавляем название города к запросу
                requestData.query = (parts[0] ? parts[0] + ' ' : '') + parts[1];
            } else if (parts.length >= 3) {
                stage = 'house';
                requestData.from_bound = { value: "house" };
                requestData.to_bound = { value: "house" };
                // При поиске дома учитываем город и улицу
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
                success: function (data) {
                    const suggestions = data.suggestions || [];
                    const suggestionsDiv = $('#suggestions');
                    suggestionsDiv.empty();
    
                    suggestions.forEach(item => {
                        const formattedAddress = formatAddressFromDaData(item.data);
                        // Не добавляем пустые подсказки
                        if (!formattedAddress || formattedAddress.trim() === '') {
                            return;
                        }
                        // На этапе выбора дома оставляем только варианты с реальными домами
                        if (stage === 'house') {
                            if (item.data.fias_level !== '8' || !item.data.house) {
                                return;
                            }
                        }
                        // Сохраняем объект данных подсказки (сериализованный в JSON)
                        suggestionsDiv.append(
                            `<div data-full-address='${JSON.stringify(item.data)}'>${formattedAddress}</div>`
                        );
                    });
                },
                error: function (err) {
                    console.error('Ошибка DaData:', err);
                }
            });
        });
    
        // Обработка клика по подсказке
        $('#suggestions').on('click', 'div', function () {
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
            // Определяем, считается ли адрес полным – если указан номер дома
            const isComplete = itemData.house && itemData.house.trim() !== '';
    
            // Обновляем значение инпута и очищаем подсказки
            $(inputSelector).val(formattedAddress);
            $('#suggestions').empty();
            // Если адрес полный, вызываем функцию проверки технической возможности
            if (isComplete) {
                checkTechnicalPossibility(formattedAddress);
            }
        });
    
        // Обработка нажатия клавиши Enter – подтверждение адреса, введённого вручную
        $(inputSelector).on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentAddress = $(this).val().trim();
                $('#suggestions').empty();
                checkTechnicalPossibility(formatAddressFromDaData(currentAddress));
            }
        });
    }
    /**
     * Определяет местоположение пользователя через DaData.
     */
    // function getUserLocationWithDaData() {
    //     if (!navigator.geolocation) {
    //         console.error('Геолокация не поддерживается вашим браузером');
    //         return;
    //     }

    //     navigator.geolocation.getCurrentPosition(
    //         async position => {
    //             const { latitude, longitude } = position.coords;

    //             const address = await getAddressFromCoords(latitude, longitude, dadataToken);
    //             if (address) {
    //                 console.log('Адрес из DaData по координатам:', address);
    //                 checkTechnicalPossibility(address);
    //             } else {
    //                 console.log('Не удалось определить адрес по координатам');
    //             }
    //         },
    //         error => {
    //             console.error('Ошибка геолокации:', error);
    //         }
    //     );
    // }

    // ================================
    // ИНИЦИАЛИЗАЦИЯ
    // ================================
    $(document).ready(function () {
        loadTechnicalData('./adress.json'); // Загружаем данные из JSON
        initManualAddressInput('.popup-address__input', regionFiasId); // Подключаем автоподсказки для поля ввода
    })

    
    function initCityPopup(popupSelector, regionFiasId) {
        let localCities = [];
    
        // Функция сохранения выбранного города
        function saveCity(cityName) {
            localStorage.setItem('selectedCity', cityName);
            console.log("Город сохранён: " + cityName);
        }
    
        // Устанавливаем стили для блоков с подсказками и локальными городами (при переполнении появляется скролл)
        $(popupSelector).find('#suggestions, #local-cities').css({
            'max-height': '300px',
            'overflow-y': 'auto'
        });
    
        // Функция для отображения локальных городов из файла cities.json
        function showLocalCities() {
            let localCitiesDiv = $(popupSelector).find('#local-cities');
            localCitiesDiv.empty();
            localCities.forEach(function(city) {
                localCitiesDiv.append(
                    `<div class="local-city" data-city='${JSON.stringify(city)}'>
                        ${city.name} ${city.type}
                    </div>`
                );
            });
            localCitiesDiv.show();
        }
    
        // Загрузка городов из файла cities.json (отображаются только города с "visible": "yes")
        $.getJSON('cities.json', function(data) {
            if (data && data.cities) {
                localCities = data.cities.filter(function(city) {
                    return city.visible === "yes";
                });
                localCities.sort(function(a, b) {
                    return a.name.localeCompare(b.name);
                });
                showLocalCities();
            }
        }).fail(function(jqxhr, textStatus, error) {
            console.error("Ошибка загрузки cities.json:", textStatus, error);
        });
    
        // Функция для получения подсказок от DaData (по полному адресу) с фильтрацией по regionFiasId
        function fetchDaDataSuggestions(query) {
            $.ajax({
                url: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
                method: 'POST',
                headers: { "Authorization": `Token ${dadataToken}` },
                contentType: 'application/json',
                data: JSON.stringify({
                    query: query,
                    count: 5,
                    // Фильтруем подсказки по региону
                    locations: [ { region_fias_id: regionFiasId } ]
                }),
                success: function(data) {
                    let suggestions = data.suggestions || [];
                    let suggestionsDiv = $(popupSelector).find('#suggestions');
                    suggestionsDiv.empty();
                    if (suggestions.length > 0) {
                        suggestions.forEach(function(item) {
                            // item.value – форматированный полный адрес (который может содержать город, улицу, дом)
                            let formattedAddress = item.value;
                            suggestionsDiv.append(
                                `<div class="dadata-suggestion" data-city='${JSON.stringify(item.data)}'>
                                    ${formattedAddress}
                                </div>`
                            );
                        });
                        suggestionsDiv.show();
                        // Скрываем локальный список городов, если есть подсказки от DaData
                        $(popupSelector).find('#local-cities').hide();
                    } else {
                        suggestionsDiv.hide();
                        $(popupSelector).find('#local-cities').show();
                    }
                },
                error: function(err) {
                    console.error("Ошибка DaData:", err);
                }
            });
        }
    
        // Обработка ввода в инпуте попапа
        $(popupSelector).find('.popup-address__input').on('input', function() {
            let inputVal = $(this).val().trim();
            if (inputVal.length >= 3) {
                fetchDaDataSuggestions(inputVal);
            } else {
                $(popupSelector).find('#suggestions').hide();
                $(popupSelector).find('#local-cities').show();
            }
            // При каждом изменении ввода убираем класс input_active с элементов подсказок
            $(popupSelector).find('.dadata-suggestion, .local-city').removeClass('input_active');
        });
    
        // Обработка клика по подсказке от DaData
        $(popupSelector).on('click', '.dadata-suggestion', function() {
            let cityData = $(this).data('city');
            if (typeof cityData === "string") {
                try {
                    cityData = JSON.parse(cityData);
                } catch (e) {
                    console.error("Ошибка парсинга данных DaData", e);
                    return;
                }
            }
            // Если в данных подсказки указаны и улица, и дом – считаем, что введён полный адрес
            let isFullAddress = cityData.street && cityData.house &&
                                cityData.street.trim() !== "" && cityData.house.trim() !== "";
            let formattedAddress = $(this).text().trim();
            // Добавляем класс input_active только выбранной подсказке
            $(popupSelector).find('.dadata-suggestion').removeClass('input_active');
            $(this).addClass('input_active');
            // Обновляем инпут выбранным значением
            $(popupSelector).find('.popup-address__input').val(formattedAddress);
            // Очищаем и скрываем блок с подсказками DaData
            $(popupSelector).find('#suggestions').empty().hide();
            if (isFullAddress) {
                // Если введён полный адрес (город, улица, дом) – вызываем проверку технической возможности
                checkTechnicalPossibility(formattedAddress);
            } else {
                // Если выбрали только город – сохраняем его
                let cityName = cityData.city || formattedAddress;
                saveCity(cityName);
            }
        });
    
        // Обработка клика по локальному городу (из cities.json)
        $(popupSelector).on('click', '.local-city', function() {
            let cityData = $(this).data('city');
            if (typeof cityData === "string") {
                try {
                    cityData = JSON.parse(cityData);
                } catch (e) {
                    console.error("Ошибка парсинга данных локального города", e);
                    return;
                }
            }
            // Добавляем класс input_active выбранному элементу
            $(popupSelector).find('.local-city').removeClass('input_active');
            $(this).addClass('input_active');
            let cityName = cityData.name;
            $(popupSelector).find('.popup-address__input').val(cityName);
            saveCity(cityName);
        });
    
        // Обработка нажатия клавиши Enter в инпуте
        $(popupSelector).find('.popup-address__input').on('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Если видны подсказки DaData, ожидаем выбор кликом
                if ($(popupSelector).find('#suggestions').is(':visible')) return;
                let inputVal = $(this).val().trim();
                if (inputVal !== "") {
                    // Если введён полный адрес (определяем по наличию запятых), вызываем проверку технической возможности
                    if (inputVal.indexOf(',') !== -1) {
                        checkTechnicalPossibility(inputVal);
                    } else {
                        // Иначе считаем, что введён только город, и сохраняем его
                        saveCity(inputVal);
                    }
                }
            }
        });
    
    }


    initCityPopup('.popup-city-change', '393aeccb-89ef-4a7e-ae42-08d5cebc2e30');




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
                    const suggestions = data.suggestions || [];
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
    
        // При клике по подсказке обновляем инпут и, если адрес полный, проверяем техническую возможность
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
                // Если получен полный адрес – обновляем элементы с городом (берем city из данных подсказки, если есть)
                const cityName = itemData.city || formattedAddress.split(' ')[0];
                updateCityInElements(cityName);
                console.log(formattedAddress)
                // Здесь можно сохранить адрес и результат проверки в localStorage, если требуется
                // Например: saveAddress({ city: cityName, address: formattedAddress, techResult });
                // Для примера просто выводим результат:
                if (techResult.isPossible) {
                    alert(`Техническая возможность: ${techResult.txb}`);
                } else {
                    alert('Технической возможности нет');
                }
            }
        });
    
        // Обработка нажатия клавиши Enter – для подтверждения адреса, введённого вручную
        $(inputSelector).on('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentAddress = $(this).val().trim();
                $('#suggestions').empty();
                const techResult = checkTechnicalPossibility(formatAddressFromDaData({ 
                    city: currentAddress.split(',')[0] || '', 
                    street: currentAddress.split(',')[1] || '', 
                    house: currentAddress.split(',')[2] || '' 
                }));
                if (techResult.isPossible) {
                    alert(`Техническая возможность: ${techResult.txb}`);
                } else {
                    alert('Технической возможности нет');
                }
                // При подтверждении можно обновить элементы с городом (если адрес содержит город)
                const cityName = currentAddress.split(',')[0].trim();
                updateCityInElements(cityName);
            }
        });
    }