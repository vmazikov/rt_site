<?php

// Токен вашего бота и ID чата
$token = '8188979928:AAGalzT5UfkcM9CQfD986b73Z5W_GII7SaI'; // Замените на ваш токен
$chat_id = '612840423'; // Замените на ваш ID чата

// Получаем данные из POST-запроса
$userLocation = json_decode($_POST['userLocation'], true);
$tariff = json_decode($_POST['tariff'], true);
$phone = $_POST['phone'];

// Формируем текст сообщения
$message = "Новая заявка на подключение:\n\n";
$message .= "Город: " . $userLocation['city'] . "\n";
$message .= "Адрес: " . $userLocation['fullAddress'] . "\n";
$message .= "Техвозможность: " . $userLocation['techResult']['txb'] . "\n";
$message .= "Тариф: " . $tariff['name'] . "\n";
$message .= "Услуги: " . $tariff['services'] . "\n";
$message .= "Скорость: " . $tariff['speed'] . " Мбит/с\n";
$message .= "Стоимость: " . $tariff['price_promo'] . " ₽\n";
$message .= "После акции: " . $tariff['price_after_promo'] . " ₽\n";
$message .= "Телефон: " . $phone . "\n";

// URL для отправки сообщения через Telegram Bot API
$url = "https://api.telegram.org/bot$token/sendMessage";

// Параметры для запроса
$data = [
    'chat_id' => $chat_id,
    'text' => $message
];

// Используем cURL для отправки запроса
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);

// Получаем ответ от API
$response = curl_exec($ch);

// Проверяем на ошибки
if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
} else {
    echo "Заявка успешно отправлена в Telegram!";
}

curl_close($ch);
?>
