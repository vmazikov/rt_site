<?php
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Получаем данные из формы
    $phone = $_POST['phone'] ?? '';

    // Проверка на пустые данные
    if (empty($phone) ) {
        echo json_encode(['success' => false, 'message' => 'Не все поля заполнены']);
        exit;
    }

    // Адрес куда отправить письмо
    $to = 'rtktelekom.ru@gmail.com';
    $subject = 'Новая заявка на подключение';
    $message = "Новая заявка:\nТелефон: $phone\nИмя: ";
    $headers = 'From: no-reply@yourdomain.com' . "\r\n" .
               'Reply-To: no-reply@yourdomain.com' . "\r\n" .
               'X-Mailer: PHP/' . phpversion();

    // Отправка письма
    if (mail($to, $subject, $message, $headers)) {
        echo json_encode(['success' => true, 'message' => 'Заявка отправлена']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Ошибка отправки']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Неверный запрос']);
}
?>