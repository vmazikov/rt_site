<?php

// Токен бота
$token = '8188979928:AAGalzT5UfkcM9CQfD986b73Z5W_GII7SaI'; // Замените на ваш токен
$default_chat_id = '612840423'; // Твой чат по умолчанию

// Массив партнёров (ID партнёра, ID чата, Название партнёра)
$partners = [
    ['partner_id' => '12345', 'chat_id' => '100001', 'partner_name' => 'Партнёр 1'],
    ['partner_id' => '67890', 'chat_id' => '100002', 'partner_name' => 'Партнёр 2'],
    ['partner_id' => '54321', 'chat_id' => '100003', 'partner_name' => 'Партнёр 3']
];

// Получаем данные из POST-запроса
$name = $_POST['name'] ?? 'Не указано';
$address = $_POST['address'] ?? 'Не указано';
$phone = $_POST['phone'] ?? 'Не указано';
$userLocation = json_decode($_POST['userLocation'] ?? '{}', true);
$tariff = json_decode($_POST['tariff'] ?? '{}', true);
$partner_id = $_POST['partner_id'] ?? ''; // ID партнёра из формы

// Определяем чат, куда отправлять заявку
$chat_id = $default_chat_id; // По умолчанию твой чат
$partner_name = "Твой клиент"; // По умолчанию твой клиент

if (!empty($partner_id)) {
    foreach ($partners as $partner) {
        if ($partner['partner_id'] === $partner_id) {
            $chat_id = $partner['chat_id']; // Используем чат партнёра
            $partner_name = $partner['partner_name'];
            break;
        }
    }
}

// Формируем текст сообщения
$message = "📝 *Новая заявка на подключение*\n\n";
$message .= "👤 *Имя:* " . $name . "\n";
$message .= "📞 *Телефон:* " . $phone . "\n";
$message .= "🏠 *Адрес:* " . ($address !== 'Не указано' ? $address : ($userLocation['fullAddress'] ?? 'Не указано')) . "\n";

if (!empty($userLocation['city'])) {
    $message .= "🌆 *Город:* " . $userLocation['city'] . "\n";
}

if (!empty($userLocation['techResult']['txb'])) {
    $message .= "🛠 *Техвозможность:* " . $userLocation['techResult']['txb'] . "\n";
}

$message .= "📦 *Тариф:* " . ($tariff['name'] ?? 'Не указано') . "\n";
$message .= "📋 *Услуги:* " . ($tariff['services'] ?? 'Не указано') . "\n";
$message .= "⚡ *Скорость:* " . ($tariff['speed'] ?? 'Не указано') . " Мбит/с\n";
$message .= "💰 *Стоимость:* " . ($tariff['price_promo'] ?? 'Не указано') . " ₽\n";
$message .= "📈 *После акции:* " . ($tariff['price_after_promo'] ?? 'Не указано') . " ₽\n";
$message .= "🛒 *Партнёр:* " . $partner_name . "\n";

// URL для отправки сообщения через Telegram Bot API
$url = "https://api.telegram.org/bot$token/sendMessage";

// Параметры для запроса
$data = [
    'chat_id' => $chat_id,
    'text' => $message,
    'parse_mode' => 'Markdown'
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
