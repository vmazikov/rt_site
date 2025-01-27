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
    async function getAddressFromCoords(latitude, longitude, token) {
        const url = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address';
    
        const requestData = {
            lat: latitude,
            lon: longitude,
            count: 1
        };
    
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify(requestData)
            });
    
            if (!response.ok) {
                throw new Error(`Ошибка API DaData: ${response.statusText}`);
            }
    
            const popup = document.querySelector('.popup-confirm');
            const addressElement = document.getElementById('address-init');
    
            const data = await response.json();
    
            if (data && data.suggestions && data.suggestions.length > 0) {
                const suggestion = data.suggestions[0];
    
                // Показываем попап
                addressElement.querySelector(".popup__title").textContent = suggestion.data.house
                    ? 'Это ваш адрес?'
                    : `Ваш город: ${suggestion.data.city_with_type}`;
                addressElement.querySelector(".popup__text").textContent = suggestion.data.house
                    ? `Ваш адрес: ${suggestion.value}`
                    : 'Это ваш город?';
                openPopup(popup);
    
                // Возвращаем Promise, который завершится только после выбора пользователя
                return new Promise((resolve) => {
                    document.getElementById('confirm-address').onclick = () => {
                        closePopup(popup);
                        document.querySelectorAll('.city-name').forEach(el => el.textContent = suggestion.data.city_with_type);
                        document.querySelector('.tariff-section__title').textContent = `Тарифы Ростелеком в ${suggestion.data.city_with_type}`;
                        localStorage.setItem('city', suggestion.data.city_with_type);
    
                        // Возвращаем адрес, если подтвержден
                        resolve(formatAddressFromDaData(suggestion.data));
                    };
    
                    document.getElementById('nonconfirm-address').onclick = () => {
                        closePopup(popup);
                        openPopup(popupAddress);
    
                        // Возвращаем null, если пользователь отказался
                        resolve(null);
                    };
                });
            } else {
                console.warn('Не удалось найти адрес по координатам');
                return null;
            }
        } catch (error) {
            console.error('Ошибка получения адреса из DaData:', error);
            return null;
        }
    }
    

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
            const query = $(this).val().trim();

            if (query.length < 3) {
                $('#suggestions').empty();
                return;
            }

            const requestData = {
                query: query,
                count: 5,
                locations: regionFiasId ? [{ region_fias_id: regionFiasId }] : []
            };

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
                        suggestionsDiv.append(`<div data-full-address="${formattedAddress}">${formattedAddress}</div>`);
                    });
                },
                error: function (err) {
                    console.error('Ошибка DaData:', err);
                }
            });
        });

        $('#suggestions').on('click', 'div', function () {
            const selectedAddress = $(this).data('full-address');
            $(inputSelector).val(selectedAddress);
            $('#suggestions').empty();
            checkTechnicalPossibility(selectedAddress);
        });
    }

    /**
     * Определяет местоположение пользователя через DaData.
     */
    function getUserLocationWithDaData() {
        if (!navigator.geolocation) {
            console.error('Геолокация не поддерживается вашим браузером');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;

                const address = await getAddressFromCoords(latitude, longitude, dadataToken);
                if (address) {
                    console.log('Адрес из DaData по координатам:', address);
                    checkTechnicalPossibility(address);
                } else {
                    console.log('Не удалось определить адрес по координатам');
                }
            },
            error => {
                console.error('Ошибка геолокации:', error);
            }
        );
    }

    // ================================
    // ИНИЦИАЛИЗАЦИЯ
    // ================================
    $(document).ready(function () {
        loadTechnicalData('./adress.json'); // Загружаем данные из JSON
        initManualAddressInput('.popup-address__input', regionFiasId); // Подключаем автоподсказки для поля ввода
        getUserLocationWithDaData()
    })
