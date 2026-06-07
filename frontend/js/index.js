/**
 * index.js — Логика главного экрана
 * Две кнопки выбора программы, переход на train.html
 */
(function () {
  'use strict';

  const btnMale = document.getElementById('btn-male');
  const btnFemale = document.getElementById('btn-female');
  const lastHint = document.getElementById('last-hint');

  /**
   * Показать подсказку о последнем выборе
   */
  function showLastHint() {
    const lastType = storage.getLastProgramType();

    if (lastType === CONFIG.PROGRAM_TYPES.MALE) {
      lastHint.textContent = 'Вы недавно смотрели тренировку для парня';
      lastHint.classList.add('hint--active');
    } else if (lastType === CONFIG.PROGRAM_TYPES.FEMALE) {
      lastHint.textContent = 'Вы недавно смотрели тренировку для девушки';
      lastHint.classList.add('hint--active');
    }
  }

  /**
   * Обработчик выбора программы
   * @param {string} type - 'male' или 'female'
   */
  function handleProgramSelect(type) {
    // Сохраняем выбор
    storage.setLastProgramType(type);

    // Переходим на экран тренировки (неделя определится автоматически)
    router.navigateTo(`train.html?type=${type}`);
  }

  // Обработчики
  btnMale.addEventListener('click', () => {
    handleProgramSelect(CONFIG.PROGRAM_TYPES.MALE);
  });

  btnFemale.addEventListener('click', () => {
    handleProgramSelect(CONFIG.PROGRAM_TYPES.FEMALE);
  });

  // Показать подсказку при загрузке
  showLastHint();
})();