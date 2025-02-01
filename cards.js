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
        const [tariffsResponse, citiesResponse] = await Promise.all([
            fetch("./tariffs.json"),
            fetch("./cities.json")
        ]);
        allTariffs = await tariffsResponse.json();
        const citiesData = await citiesResponse.json();

        // Создаем маппинг {город: кластер}
        cityClusters = citiesData.cities.reduce((acc, city) => {
            acc[city.name] = city.cluster;
            return acc;
        }, {});

        updateUI(); // Устанавливаем активные кнопки фильтрации и сортировки
        updateTariffs();
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
            <div class="card">
            <div class="card__highlights">
                ${tariff.card__highlight_hit ? `<span class="card__highlight card__highlight_hit">${tariff.card__highlight_hit}</span>` : ''}
                ${tariff.card__highlight_promo ? `<span class="card__highlight card__highlight_promo">${tariff.card__highlight_promo}</span>` : ''}
            </div>
            <div class="card__content">
                <h3 class="card__title">Тариф<br>${tariff.name}</h3>
                <ul class="card__subtitle-list">
                ${tariff.speed ? `<li class="card__subtitle"><img class="card__subtitle-img" src="./images/internet_icon.png" alt="">${tariff.speed} Мбит/с GPON Интернет</li>` : ''}
                ${tariff.channels ? `<li class="card__subtitle"><img class="card__subtitle-img" src="./images/tv-card_icon.png" alt="">${tariff.channels} Каналов Телевидение</li>` : ''}
                ${tariff.sim_details ? `<li class="card__subtitle"><img class="card__subtitle-img" src="./images/smartphone_icon.png" alt="">${tariff.sim_details}</li>` : ''}
                ${tariff.subscription ? `<li class="card__subtitle"><img class="card__subtitle-img" src="./images/wink_icon.png" alt="">${tariff.subscription}</li>` : ''}
                ${tariff.router_price ? `<li class="card__subtitle"><img class="card__subtitle-img" src="./images/router_icon.png" alt="">Wi-Fi роутер ${tariff.router_price}</li>` : ''}
                </ul>
            </div>
            <div class="card__pricing">
                <div class="card__pricing_price">${tariff.price_promo} ₽/мес</div>
                ${tariff.discount_duration ? `<div class="card__pricing_discount">-${tariff.discount_duration}</div>` : ''}
                ${tariff.price_after_promo ? `<div class="card__pricing_details">${tariff.price_after_promo} ₽ с ${tariff.discount_duration ? parseInt(tariff.discount_duration) : ''}-го мес</div>` : ''}
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
        showMoreButton.style.display = displayedTariffs.length >= filteredTariffs.length ? "none" : "block";
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

    loadData();
});