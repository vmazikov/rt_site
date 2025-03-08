// Функция для получения параметров из URL
function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Проверяем, есть ли UTM-метка и сохраняем её
const utmSource = getUrlParam('utm_campaign');
if (utmSource) {
  localStorage.setItem('agent', utmSource);
}