function updateUIBasedOnTechResult() {
    // Извлекаем userLocation из localStorage
    const userLocation = JSON.parse(localStorage.getItem('userLocation'));

    // Ссылка на контейнер баннера
    const bannerContainer = document.querySelector('.banner');

    // Удаляем старый баннер, если он есть
    const existingBanner = document.getElementById('techResultBanner');
    if (existingBanner) {
        existingBanner.remove();
    }

    // Скрытие/показ элементов в зависимости от состояния
    const hideElements = (selectors) => {
        document.querySelectorAll(selectors).forEach((el) => {
            el.style.display = 'none';
        });
    };

    const showElements = (selectors) => {
        document.querySelectorAll(selectors).forEach((el) => {
            el.style.display = '';
        });
    };

    // Проверяем наличие userLocation и techResult
    if (!userLocation || !userLocation.techResult) {
        // Если techResult равен null, возвращаем скрытые элементы и выходим
        showElements('.banner-wrap, .nav-section__subtitile, .nav-section, .card-wrapper, .card-wrapper__show-more-button, .equipment-section, .equipment-section__carousel, .connect-section');
        return;
    }

    const { isPossible } = userLocation.techResult;

    // Создаем HTML для баннера в зависимости от состояния
    const bannerHTML = isPossible
        ? `
            <div id="techResultBanner" class="tech-result-banner">
                <div class="tech-result-banner__content">
                    <span class="tech-result-banner__icon tech-result-banner__icon_check"></span>
                    <div>
                        <p class="tech-result-banner__status-text">Есть возможность подключения по адресу: </p>
                        <div class="flex">
                            <p class="tech-result-banner__address-text">${userLocation.fullAddress}</p>
                            <span class="tech-result-banner__edit-icon" onclick="openPopup(popupAddress)"></span>
                        </div>
                    </div>
                </div>
            </div>
          `
        : `
            <div id="techResultBanner" class="tech-result-banner">
                <div class="tech-result-banner__content">
                    <span class="tech-result-banner__icon tech-result-banner__icon_stop"></span>
                    <div>
                        <p class="tech-result-banner__status-text">Не удалось определить возможность подключения по адресу: </p>
                        <div class="flex">
                            <p class="tech-result-banner__address-text">${userLocation.fullAddress}</p>
                            <span class="tech-result-banner__edit-icon" onclick="openPopup(popupAddress)"></span>
                        </div>
                        <p class="tech-result-banner__edit-text">Попробуйте изменить <a class="tech-result-banner__edit-link" href="#" onclick="openPopup(popupAddress)">адрес</a></p>
                    </div>
                </div>
            </div>
          `;

    // Вставляем баннер в контейнер
    bannerContainer.insertAdjacentHTML('beforeend', bannerHTML);

    // Скрытие элементов в зависимости от состояния
    if (isPossible) {
        // Скрываем location__wrapper и nav-section__subtitile
        hideElements('.banner-wrap, .nav-section__subtitile');
        // Показываем ранее скрытые элементы, если они были скрыты при false
        showElements('.nav-section, .card-wrapper, .card-wrapper__show-more-button, .equipment-section, .equipment-section__carousel, .connect-section');
    } else {
        // Скрываем location__wrapper, nav-section и card-wrapper
        hideElements('.banner-wrap, .nav-section, .card-wrapper, .card-wrapper__show-more-button, .equipment-section, .equipment-section__carousel, .connect-section');
        // Показываем ранее скрытые элементы, если они были скрыты при true
        showElements('.nav-section__subtitile, ');
    }
}

// Слушаем событие "userLocationChanged" для обработки изменений
window.addEventListener("userLocationChanged", updateUIBasedOnTechResult);

// Проверяем данные при загрузке страницы
document.addEventListener('DOMContentLoaded', updateUIBasedOnTechResult);