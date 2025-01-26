document.addEventListener("DOMContentLoaded", () => {
  const filterButton = document.getElementById("filterButton");
  const dropdownMenu = document.getElementById("dropdownMenu");

  // Обработчик клика по кнопке сортировки
  filterButton.addEventListener("click", () => {
    dropdownMenu.classList.toggle("show");
  });

  // Закрытие меню при клике вне его
  document.addEventListener("click", (e) => {
    if (!filterButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove("show");
    }
  });

  // Обновление активного пункта меню
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", () => {
      dropdownItems.forEach((el) => el.classList.remove("active"));
      item.classList.add("active");

      // Обновление текста кнопки
      filterButton.innerHTML = `<span class="filter-icon">☰</span> ${item.textContent}`;
      dropdownMenu.classList.remove("show");
    });
  });

  // Обработчик кликов для категорий
  const tariffButtons = document.querySelectorAll(".tariff-button");
  tariffButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tariffButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });
});

