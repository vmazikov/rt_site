<?php
// Получаем данные из POST
$phone = $_POST['phone']; // Телефон из формы

// Ваш Telegram bot token
$token = "8188979928:AAGalzT5UfkcM9CQfD986b73Z5W_GII7SaI";

// ID чата, куда отправлять сообщение
$chat_id = "612840423";

// Формируем сообщение для отправки в Telegram
$message = "
Заявка на обратный звонок 
Телефон: $phone
";

// URL для отправки сообщения в Telegram
$api_url = "https://api.telegram.org/bot$token/sendMessage?chat_id=$chat_id&text=" . urlencode($message);

// Отправляем запрос
file_get_contents($api_url);
?>