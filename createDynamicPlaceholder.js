function createDynamicPlaceholder(inputElement, cities) {
    let currentCityIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;

    function typeEffect() {
        const currentCity = cities[currentCityIndex];
        
        if (!isDeleting) {
            inputElement.placeholder = currentCity.slice(0, currentCharIndex + 1);
            currentCharIndex++;
            if (currentCharIndex === currentCity.length) {
                isDeleting = true;
                setTimeout(typeEffect, 1000); // Пауза перед удалением
                return;
            }
        } else {
            inputElement.placeholder = currentCity.slice(0, currentCharIndex - 1);
            currentCharIndex--;
            if (currentCharIndex === 0) {
                isDeleting = false;
                currentCityIndex = (currentCityIndex + 1) % cities.length; // Переход к следующему городу
            }
        }

        setTimeout(typeEffect, isDeleting ? 100 : 150); // Скорость удаления и набора
    }

    typeEffect();
}

// Пример использования:
const input = document.getElementById("cityInput");
const cities = ["Кемерово", "Новокузнецк", "Прокопьевск", "Междуреченск", "Белово"];

// createDynamicPlaceholder(input, cities);