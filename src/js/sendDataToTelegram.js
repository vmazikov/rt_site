const phoneInput = document.getElementById("phone");
import {closePopup} from "./index.js"
 

// Функция отправки данных в Telegram через AJAX
export function sendDataToTelegram() {
    const form = document.getElementById("phoneForm");
    
    // Получаем данные из скрытых полей формы
    const userLocation = JSON.parse(localStorage.getItem("userLocation"));
    const tariffValue = document.getElementById('tarif').value;
    
    // Проверяем, есть ли данные о тарифе
    if (!tariffValue) {
      console.log("Ошибка: нет данных о тарифе.");
      return;
    }
  
    const tariff = JSON.parse(tariffValue); // Десериализация данных о тарифе
    const phone = phoneInput.value; // Получаем номер телефона
  
    // Отправляем данные через AJAX
    fetch('send_to_telegram.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        userLocation: JSON.stringify(userLocation),
        tariff: JSON.stringify(tariff),
        phone: phone
      })
    })
    .then(response => response.text())
    .then(data => {
      console.log(data); // Ответ от сервера
      if (data.includes("Заявка успешно отправлена")) {
        closePopup(); // Закрыть текущий попап
        openPopup(popup4); // Открыть попап подтверждения
      } else {
        console.log("Ошибка при отправке заявки.");
      }
    })
    .catch(error => {
      console.error('Error:', error);
      console.log("Ошибка при отправке заявки.");
    });
  }