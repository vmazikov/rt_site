import {attachEventListeners} from "./index.js"
import internetIcon from "../assets/images/internet_icon.png";
import routerIcon from "../assets/images/router_icon.png";
import tvCardIcon from "../assets/images/tv-card_icon.png";
import winkIcon from "../assets/images/wink_icon.png";
import videoIcon from "../assets/images/video-camera-icon.png";
import smartphoneIcon from "../assets/images/smartphone_icon.png";
import checkIcon from "../assets/images/check_icon.png";

document.addEventListener("DOMContentLoaded", async function () {
    const tariffsContainer = document.querySelector('.card-wrapper');
    const showMoreButton = document.querySelector(".card-wrapper__show-more-button");

    let allTariffs = [];
    let filteredTariffs = [];
    let displayedTariffs = [];
    let userTechnology = "gpon"; // Фильтр по технологии
    let cityClusters = {};
    let currentCategory = localStorage.getItem("selectedCategory") || "Все";
    let currentSort = localStorage.getItem("selectedSort") || "Популярные";
    let tariffsPerPage = 5;
    let currentPage = 0;

    async function loadData() {
        // Сначала показываем скелетоны, пока идёт загрузка
        showLoadingSkeletons(3);
      
        try {
          const [tariffsResponse, citiesResponse] = await Promise.all([
            fetch("./json/tariffs.json"),
            fetch("./json/cities.json")
          ]);
      
          if (!tariffsResponse.ok || !citiesResponse.ok) {
            // Если статус ответа не 2xx, выбрасываем ошибку
            throw new Error(`HTTP error! tariffs: ${tariffsResponse.status}, cities: ${citiesResponse.status}`);
          }
      
          // Парсим JSON
          allTariffs = await tariffsResponse.json();
          const citiesData = await citiesResponse.json();
      
          // Создаем маппинг {город: кластер}
          cityClusters = citiesData.cities.reduce((acc, city) => {
            acc[city.name] = city.cluster;
            return acc;
          }, {});
      
          // Данные успешно пришли, можно убрать скелетоны
          hideLoadingSkeletons();
          hideErrorCard();
      
          // Теперь обновляем UI настоящими картами
          updateUI();
          updateTariffs();
      
        } catch (error) {
          // Ловим любые ошибки (сеть, парсинг и т.д.) и показываем карточку-ошибку
          console.error("[ERROR] При загрузке тарифов:", error);
          hideLoadingSkeletons();
          showErrorCard(error.message || 'Ошибка сети');
        }
      }

    function updateUI() {
        // Устанавливаем активный стиль для кнопок фильтрации тарифов
        document.querySelectorAll('.nav-section__button').forEach(button => {
            button.classList.toggle('nav-section__button_active', button.innerText === currentCategory);
        });

        // Устанавливаем активный стиль для сортировки
        document.querySelectorAll('.filter__dropdown-item').forEach(item => {
            item.classList.toggle('filter__dropdown-item_active', item.innerText === currentSort);
        });

        // Меняем текст кнопки сортировки
        document.getElementById("filterButton").innerHTML = `<span class="filter__icon">☰</span> ${currentSort}`;
    }

    function getCluster(city) {
        return cityClusters[city] || null;
    }

    function filterTariffs(userCity, technologyFilter, currentCategory) {
        let cluster = getCluster(userCity);
        let cityTariffs = allTariffs.filter(tariff => tariff.city === userCity && tariff.technology === technologyFilter);
        let clusterTariffs = allTariffs.filter(tariff => tariff.cluster === (cluster ? cluster.toString() : "") && tariff.technology === technologyFilter);

        let selectedTariffs = cityTariffs.length > 0 ? cityTariffs : clusterTariffs;

        if (currentCategory !== "Все") {
            selectedTariffs = selectedTariffs.filter(tariff => {
                if (currentCategory === "Интернет") return tariff.services === "ШПД";
                if (currentCategory === "Интернет + ТВ") return tariff.services === "ШПД + ТВ";
                if (currentCategory === "Интернет + Моб. связь") return tariff.services === "ШПД + МВНО";
                if (currentCategory === "Интернет + ТВ + Моб. связь") return tariff.services === "ШПД + ТВ + МВНО";
                return true;
            });
        }
        return selectedTariffs;
    }

    function sortTariffs(tariffs) {
        if (currentSort === "Популярные") {
            return [...tariffs.filter(t => t.card__highlight_hit), ...tariffs.filter(t => !t.card__highlight_hit)];
        }
        if (currentSort === "Сначала недорогие") return tariffs.sort((a, b) => a.price_promo - b.price_promo);
        if (currentSort === "Сначала дорогие") return tariffs.sort((a, b) => b.price_promo - a.price_promo);
        if (currentSort === "Мин. скорость") return tariffs.sort((a, b) => a.speed - b.speed);
        if (currentSort === "Макс. скорость") return tariffs.sort((a, b) => b.speed - a.speed);
        return tariffs;
    }


    function createTariffCard(tariff) {
        return `
        <div class="card" data-tariff='${JSON.stringify(tariff)}'>
        <div class="card__highlights">
            ${tariff.card__highlight_hit ? `<span class="card__highlight card__highlight_hit">${tariff.card__highlight_hit}</span>` : ''}
            ${tariff.card__highlight_promo ? `<span class="card__highlight card__highlight_promo">${tariff.card__highlight_promo}</span>` : ''}
        </div>
        <div class="card__content">
            <div class="card__subtitle__items">
            <span class="card__subtitle__span card__subtitle__span_tarif-name">Тариф</span>
            <h4 class="card__subtitle__item card__subtitle__item_tarif-name">${tariff.name}</h4>
            </div>
            <div class="card__subtitle-list">
            ${tariff.speed ? `
            <div class="card__subtitle">
                <img class="card__subtitle-img" src="${internetIcon}" alt="Интернет">
                    <div class="card__subtitle__items">
                    <span class="card__subtitle__span">Интернет</span>
                    <h4 class="card__subtitle__item">${tariff.speed} Мбит/с</h4>
                    </div>
                </div>` : ''}
                ${tariff.channels ? `
                <div class="card__subtitle">
                    <img class="card__subtitle-img" src="${tvCardIcon}" alt="Тв-Каналы">
                    <div class="card__subtitle__items">
                    <span class="card__subtitle__span">Телевидение</span>
                    <h4 class="card__subtitle__item">${tariff.channels} Каналов</h4>
                    </div>
                </div>` : `
                <div class="card__subtitle">
                    <img class="card__subtitle-img" src="${tvCardIcon}" alt="Тв-Каналы">
                    <div class="card__subtitle__items">
                    <span class="card__subtitle__span">Телевидение</span>
                <h4 class="card__subtitle__item card__subtitle__item_none">Не включено</h4>
                </div>
            </div>`}
            ${tariff.sim_details ? `
            <div class="card__subtitle">
                <img class="card__subtitle-img" src="${smartphoneIcon}" alt="Моб. Связь">
                <div class="card__subtitle__items">
                <span class="card__subtitle__span">Моб. Связь</span>
                <h4 class="card__subtitle__item">${tariff.sim_details}</h4>
                </div>
            </div>` : `
            <div class="card__subtitle">
                <img class="card__subtitle-img" src="${smartphoneIcon}" alt="Моб. Связь">
                <div class="card__subtitle__items">
                <span class="card__subtitle__span">Моб. Связь</span>
                <h4 class="card__subtitle__item card__subtitle__item_none">Не включено</h4>
                </div>
            </div>`}
            ${tariff.wink_description ? `
            <div class="card__subtitle">
                <img class="card__subtitle-img" src="${winkIcon}" alt="Wink">
                <div class="card__subtitle__items">
                <span class="card__subtitle__span">Wink</span>
                <h4 class="card__subtitle__item">${tariff.wink_description}</h4>
                </div>
            </div>` : `
            <div class="card__subtitle">
                <img class="card__subtitle-img" src="${winkIcon}" alt="Wink">
                <div class="card__subtitle__items">
                <span class="card__subtitle__span">Wink</span>
                <h4 class="card__subtitle__item card__subtitle__item_none">Не включено</h4>
                </div>
            </div>`}
            ${tariff.video ? `
                <div class="card__subtitle">
                    <img class="card__subtitle-img" src="${videoIcon}" alt="Wink">
                    <div class="card__subtitle__items">
                    <span class="card__subtitle__span">Видеонаблюдение</span>
                    <h4 class="card__subtitle__item">${tariff.video} камера</h4>
                    </div>
                </div>` : ''}
            ${tariff.router_price ? `
            <div class="card__subtitle">
                <img class="card__subtitle-img" src="${routerIcon}" alt="Роутер">
                <div class="card__subtitle__items">
                <span class="card__subtitle__span">Wi-Fi роутер</span>
                <h4 class="card__subtitle__item card__subtitle__item_router">${tariff.router_price}</h4>
                </div>
            </div>` : ''}
            </div>
            ${tariff.additional_info ? `
            <div class="card__additional-info">
            ${tariff.additional_info.map(info => `
            <p class="card__additional-info-text">
                <img class="card__additional-info-img" src="${checkIcon}"> ${info}
            </p>`).join('')}
            </div>` : ''}
        </div>
        <div class="card__pricing">
            <div class="card__pricing_price">${tariff.price_promo} ₽/мес</div>
            ${tariff.discount_duration ? `<div class="card__pricing_discount">${tariff.discount} ${tariff.discount_duration}</div>` : ''}
            ${tariff.price_after_promo ? `<div class="card__pricing_details">${tariff.price_after_promo} ₽ с ${tariff.discount_duration ? parseInt(tariff.discount_duration) +1 : ''}-го мес</div>` : ''}
        </div>
        <div class="card__buttons">
            <a href="#" class="card__connect-btn card__connect-btn${tariff.button} connect-btn">Подключить</a>
            <div class="card__info-btn"></div>
        </div>
        </div>`;
    }
    function renderTariffs() {
        tariffsContainer.innerHTML = displayedTariffs.map(createTariffCard).join("");
        attachEventListeners();
      
        // Показываем контейнер "Показать ещё", только если есть ещё тарифы для показа
        if (displayedTariffs.length >= filteredTariffs.length) {
            showMoreButton?.classList.add("hidden");
        } else {
            showMoreButton?.classList.remove("hidden");
        }
      }

    // Исправленный updateTariffs: теперь данные читаются напрямую из localStorage.
    function updateTariffs() {
        const storedLocationStr = localStorage.getItem("userLocation");
        let userCity = "Юрга";
        let techResult = null;
        let technologyFilter = "gpon"; // По умолчанию GPON
        if (storedLocationStr) {
            try {
                const locationData = JSON.parse(storedLocationStr);
                userCity = locationData.city || "";
                techResult = locationData.techResult || null;
            } catch (e) {
                console.error("[ERROR] Не удалось распарсить userLocation:", e);
            }
        }
        if (techResult) {
            if (techResult.isPossible) {
                technologyFilter = techResult.txb.toLowerCase();
            } else {
                return;
            }
        }
        filteredTariffs = sortTariffs(filterTariffs(userCity, technologyFilter, currentCategory));
        currentPage = 0;
        displayedTariffs = filteredTariffs.slice(0, tariffsPerPage);
        renderTariffs();
    }

    showMoreButton.addEventListener("click", function () {
        currentPage++;
        displayedTariffs = filteredTariffs.slice(0, (currentPage + 1) * tariffsPerPage);
        renderTariffs();
    });

    document.querySelectorAll('.nav-section__button').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.nav-section__button').forEach(btn => btn.classList.remove('nav-section__button_active'));
            this.classList.add('active');
            currentCategory = this.innerText;
            localStorage.setItem("selectedCategory", currentCategory);
            // console.log(localStorage.userLocation)
            updateUI();
            updateTariffs();
        });
    });

    document.querySelectorAll('.filter__dropdown-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.filter__dropdown-item').forEach(i => i.classList.remove('filter__dropdown-item_active'));
            this.classList.add('active');
            currentSort = this.innerText;
            localStorage.setItem("selectedSort", currentSort);
            updateUI();
            updateTariffs();
        });
    });
    window.addEventListener("userLocationChanged", updateTariffs);
    // Слушатель события storage – при изменении userLocation в другом окне обновляем карточки
    window.addEventListener("storage", function (e) {
        if (e.key === "userLocation") {
            updateTariffs();
        }
    });

    function showLoadingSkeletons(count = 3) {
        const skeletonsHTML = Array(count).fill('').map(() => {
          return `
            <div class="skeleton-card">
              <div class="skeleton-line lg"></div>
              <div class="skeleton-line md"></div>
              <div class="skeleton-line sm"></div>
              <div class="skeleton-line lg"></div>
              <div class="skeleton-line md"></div>
            </div>
          `;
        }).join('');
      
        // Прячем "Показать ещё"
        if (showMoreButton) {
            showMoreButton.classList.add("hidden");
        }
      
        // Вставляем скелетоны в .card-wrapper
        const tariffsContainer = document.querySelector('.card-wrapper');
        tariffsContainer.innerHTML = skeletonsHTML;
      }
      
      function hideLoadingSkeletons() {
        // Удаляем всё, что относится к скелетону
        const tariffsContainer = document.querySelector('.card-wrapper');
        tariffsContainer.innerHTML = '';
      }
      
      function showErrorCard(errorCode = '000') {
        const tariffsContainer = document.querySelector('.card-wrapper');
        tariffsContainer.innerHTML = `
          <div class="error-card">
            <div class="error-card__title">Не удалось загрузить тарифы</div>
            <div class="error-card__text">Попробуйте обновить страницу.</div>
            <a class="error-card__refresh-btn" onclick="window.location.reload()">Обновить</a>
          </div>
        `;
        // Прячем "Показать ещё"
        if (showMoreButton) {
          showMoreButton.classList.add("hidden");
        }
      }
      
      function hideErrorCard() {
        const tariffsContainer = document.querySelector('.card-wrapper');
        tariffsContainer.innerHTML = '';
      }

    loadData();
});