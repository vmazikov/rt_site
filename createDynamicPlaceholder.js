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
const cityInput = document.getElementById("cityInput");
const addressInput = document.getElementById("addressInput");
const cities = ["Кемерово", "Новокузнецк", "Прокопьевск", "Междуреченск", "Белово"];
const address = ["Ленина 14", "Тореза 32", "Есенина 48", "Волкова 35", "Мичурина 61"];

// createDynamicPlaceholder(input, cities);

createDynamicPlaceholder(cityInput, cities)
createDynamicPlaceholder(addressInput, address)