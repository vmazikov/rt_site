const searchBar = document.querySelector(".location__search-bar");
const popupAddress = document.querySelector(".popup-address");
const navLink = document.querySelector(".nav-section__link");

navLink.addEventListener("click", (e) => {
  e.preventDefault(); // Отключаем стандартное поведение ссылки
  openPopup(popupAddress)
})


searchBar.addEventListener("click", (e) =>{
  e.preventDefault(); // Отключаем стандартное поведение ссылки
  openPopup(popupAddress)
});



document.addEventListener("DOMContentLoaded", () => {
  const filterButton = document.getElementById("filterButton");
  const dropdownMenu = document.getElementById("dropdownMenu");

  // Обработчик клика по кнопке сортировки
  filterButton.addEventListener("click", () => {
    dropdownMenu.classList.toggle("filter__dropdown-menu_show");
  });

  // Закрытие меню при клике вне его
  document.addEventListener("click", (e) => {
    if (!filterButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove("filter__dropdown-menu_show");
    }
  });

  // Обновление активного пункта меню
  const dropdownItems = document.querySelectorAll(".filter__dropdown-item");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", () => {
      dropdownItems.forEach((el) => el.classList.remove("filter__dropdown-item_active"));
      item.classList.add("active");

      // Обновление текста кнопки
      filterButton.innerHTML = `<span class="filter__icon">☰</span> ${item.textContent}`;
      dropdownMenu.classList.remove("filter__dropdown-menu_show");
    });
  });

  // Обработчик кликов для категорий
  const tariffButtons = document.querySelectorAll(".nav-section__button");
  tariffButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tariffButtons.forEach((btn) => btn.classList.remove("nav-section__button_active"));
      button.classList.add("active");
    });
  });
});

