document.addEventListener("DOMContentLoaded", async function () {
    const tariffsContainer = document.querySelector('.card-wrapper');
    const showMoreButton = document.createElement("button");
    showMoreButton.classList.add("show-more-button");
    showMoreButton.innerText = "Показать еще";
    tariffsContainer.after(showMoreButton);

    let allTariffs = [];
    let filteredTariffs = [];
    let displayedTariffs = [];
    let userCity = "Яшкино"; // Тестовый город, замените на реальное получение
    let userTechnology = "gpon"; // Технология, позже можно передавать динамически
    let cityClusters = {};
    let currentCategory = "Все";
    let currentSort = "Популярные";
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

        updateTariffs();
    }

    function getCluster(city) {
        return cityClusters[city] || null;
    }

    function filterTariffs() {
        let cluster = getCluster(userCity);
        let cityTariffs = allTariffs.filter(tariff => tariff.city === userCity && tariff.technology === userTechnology);
        let clusterTariffs = allTariffs.filter(tariff => tariff.cluster === cluster?.toString() && tariff.technology === userTechnology);

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
        if (currentSort === "Популярные") return tariffs.filter(t => t.card__highlight_hit);
        if (currentSort === "Сначала недорогие") return tariffs.sort((a, b) => a.price_promo - b.price_promo);
        if (currentSort === "Сначала дорогие") return tariffs.sort((a, b) => b.price_promo - a.price_promo);
        if (currentSort === "Мин. скорость") return tariffs.sort((a, b) => a.speed - b.speed);
        if (currentSort === "Макс. скорость") return tariffs.sort((a, b) => b.speed - a.speed);
        return tariffs;
    }

    function createTariffCard(tariff) {
        return `
            <div class="card">
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
                  ${tariff.additional_info ? `
                    <div class="card__additional-info">
                      ${tariff.additional_info.map(info => `<p class="card__additional-info-text"><img class="card__additional-info-img" src="./images/check_icon.png"> ${info}</p>`).join('')}
                    </div>
                  ` : ''}
                </div>
                <div class="card__pricing">
                  <div class="card__pricing_price">${tariff.price_promo} ₽/мес</div>
                  <div class="card__pricing_discount">-${tariff.discount_duration}</div>
                  <div class="card__pricing_details">${tariff.price_after_promo} ₽ с ${parseInt(tariff.discount_duration)}-го мес</div>
                </div>
                <div class="card__buttons">
                  <a href="#" class="card__connect-btn connect-btn">Подключить</a>
                  <div class="card__info-btn"></div>
                </div>
              </div>
            </div>`;
    }


    function renderTariffs() {
        tariffsContainer.innerHTML = displayedTariffs.map(createTariffCard).join("");
        if (displayedTariffs.length >= filteredTariffs.length) {
            showMoreButton.style.display = "none";
        } else {
            showMoreButton.style.display = "block";
        }
    }

    function updateTariffs() {
        filteredTariffs = sortTariffs(filterTariffs());
        currentPage = 0;
        displayedTariffs = filteredTariffs.slice(0, tariffsPerPage);
        renderTariffs();
    }

    showMoreButton.addEventListener("click", function () {
        currentPage++;
        const nextTariffs = filteredTariffs.slice(0, (currentPage + 1) * tariffsPerPage);
        displayedTariffs = nextTariffs;
        renderTariffs();
    });

    document.querySelectorAll('.tariff-button').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.tariff-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.innerText;
            updateTariffs();
        });
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.innerText;
            updateTariffs();
        });
    });

    loadData();
});

function renderTariffs() {
    const cards = document.querySelectorAll('.card');
    
    // Плавно скрываем старые карточки перед заменой
    cards.forEach(card => {
        card.classList.add("fade-out");
        setTimeout(() => card.remove(), 300); // Удаляем карточки после завершения анимации
    });

    // Задержка перед добавлением новых карточек для плавного эффекта
    setTimeout(() => {
        tariffsContainer.innerHTML = displayedTariffs.map(createTariffCard).join("");

        // Добавляем анимацию к новым карточкам
        document.querySelectorAll('.card').forEach(card => {
            card.style.opacity = "0"; // Начальное состояние
            setTimeout(() => card.style.opacity = "1", 50); // Плавное появление
        });

        // Контролируем кнопку "Показать еще"
        if (displayedTariffs.length >= filteredTariffs.length) {
            showMoreButton.style.display = "none";
        } else {
            showMoreButton.style.display = "block";
        }
    }, 300); // Задержка для завершения анимации исчезновения
}