
<?php

// Получаем данные из формы
$phone = isset($_POST['phone']) ? $_POST['phone'] : '';
$tarif = isset($_POST['tarif']) ? $_POST['tarif'] : '';
$city = isset($_POST['location']) ? $_POST['location'] : '';  // Изменили местоположение на город
$address = isset($_POST['address']) ? $_POST['address'] : '';

// Ваш Telegram Bot API Token
$bot_token = "8188979928:AAGalzT5UfkcM9CQfD986b73Z5W_GII7SaI";
$chat_id = "612840423";  // Ваш chat_id (его можно получить через бот @userinfobot в Telegram)

// Формирование сообщения для отправки
$message = "Новая заявка на подключение:\n";
$message .= "Номер телефона: $phone\n";
$message .= "Выбранный тариф: $tarif\n";
$message .= "Город: $city\n";
$message .= "Адрес: $address\n";  // Координаты теперь выделены тегом <code> для Telegram

// Отправляем сообщение через Telegram Bot API
$url = "https://api.telegram.org/bot$bot_token/sendMessage?chat_id=$chat_id&text=" . urlencode($message);

// Инициализируем cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Выполняем запрос
$response = curl_exec($ch);

// Проверяем на ошибки
if(curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
}

// Закрываем cURL сессию
curl_close($ch);

// Возвращаем успешный ответ
echo 'Заявка успешно отправлена!';
?>