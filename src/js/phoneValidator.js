/**
 * Инициализация «телефонного» инпута.
 * @param {Object} config
 * @param {HTMLInputElement} config.phoneInput - сам инпут
 * @param {HTMLElement} config.phoneInputWrapper - обёртка для инпута (для отображения галочки)
 * @param {HTMLElement} config.errorText - элемент с сообщением об ошибке
 * @param {HTMLButtonElement} config.submitButton - кнопка отправки
 * @param {HTMLFormElement} config.form - форма
 */

import { sendDataToTelegram} from "./sendDataToTelegram.js";
function initPhoneInput({ phoneInput, phoneInputWrapper, errorText, submitButton, form }) {
    // Маска: (___) ___-__-__
    const phoneMask = "(___) ___-__-__";
    // Массив для 10 цифр (без +7)
    let typedDigits = [];
  
    // Преобразует массив цифр в объект { value, caret },
    // где value - итоговая строка для инпута, а caret - позиция курсора
    function applyMask(digitsString) {
      let maskArr = phoneMask.split('');
      let digitIndex = 0;
      let lastDigitIndex = -1;
      for (let i = 0; i < maskArr.length; i++) {
        if (maskArr[i] === '_' && digitIndex < digitsString.length) {
          maskArr[i] = digitsString[digitIndex];
          lastDigitIndex = i;
          digitIndex++;
        }
      }
      let caretPosition = lastDigitIndex >= 0 ? lastDigitIndex + 1 : phoneMask.indexOf('_');
      return { value: maskArr.join(''), caret: caretPosition };
    }
  
    function isPhoneValid() {
      return typedDigits.length === 10;
    }
  
    // Установка значения в инпут и позиции курсора
    function updateInput() {
      const masked = applyMask(typedDigits.join(''));
      phoneInput.value = masked.value;
      setCaretPosition(phoneInput, masked.caret);
    }
  
    // Установка позиции курсора (каретки)
    function setCaretPosition(elem, pos) {
      setTimeout(() => {
        elem.setSelectionRange(pos, pos);
      }, 0);
    }
  
    // Переключение класса valid для обёртки (для галочки)
    function toggleValidState() {
      if (isPhoneValid()) {
        phoneInputWrapper.classList.add("valid");
        submitButton.classList.add("popup__submit-button_active");
      } else {
        phoneInputWrapper.classList.remove("valid");
        submitButton.classList.remove("popup__submit-button_active");
      }
    }
  
    // Изначально задаём пустую маску
    phoneInput.value = applyMask("").value;
  
    // Основная логика: keydown
    phoneInput.addEventListener("keydown", (e) => {
      const navigationKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Tab"];
  
      // Функциональные клавиши F1-F12 не трогаем (не мешаем их стандартному поведению)
      if (/^F\d+$/.test(e.key)) {
        return; // выходим, чтобы F5 и т. д. работали штатно
      }
  
      // Навигация: просто возвращаем каретку в конец после
      if (navigationKeys.includes(e.key)) {
        setTimeout(() => setCaretPosition(phoneInput, applyMask(typedDigits.join('')).caret), 0);
        return;
      }
  
      // Backspace - удаляем последнюю цифру
      if (e.key === "Backspace") {
        e.preventDefault();
        typedDigits.pop();
        updateInput();
        toggleValidState();
        return;
      }
  
      // Если нажата цифра
      if (/\d/.test(e.key)) {
        e.preventDefault();
        if (typedDigits.length < 10) {
          typedDigits.push(e.key);
          updateInput();
          toggleValidState();
        }
        return;
      }
  
      // Запрещаем всё остальное
      e.preventDefault();
    });
  
    // При клике ставим каретку в конец
    phoneInput.addEventListener("click", () => {
      setCaretPosition(phoneInput, applyMask(typedDigits.join('')).caret);
    });
  
    // При уходе с поля показываем ошибку, если номер невалиден
    phoneInput.addEventListener("blur", () => {
      if (!isPhoneValid()) {
        errorText.style.display = "block";
      } else {
        errorText.style.display = "none";
      }
    });
  
    // Сабмит формы
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!isPhoneValid()) {
        errorText.style.display = "block";
        submitButton.classList.add("error");
        setTimeout(() => submitButton.classList.remove("error"), 500);
      } else {
        // Номер валиден
        console.log("Валидный номер:", "+7 " + typedDigits.join(''));
        sendDataToTelegram();
      }
    });
  
    // Даже если кнопка выглядит «неактивной», при клике показываем ошибку
    submitButton.addEventListener("click", () => {
      if (!isPhoneValid()) {
        errorText.style.display = "block";
      }
    });
  }
  
  // --------------------------
  // Инициализация формы:
  // --------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initPhoneInput({
      phoneInput: document.getElementById("phone"),
      phoneInputWrapper: document.getElementById("phoneInputWrapper"),
      errorText: document.getElementById("errorText"),
      submitButton: document.getElementById("submitButton"),
      form: document.getElementById("phoneForm")
    });
  });