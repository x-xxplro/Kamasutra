/**
 * train.js — Основная логика экрана тренировки
 * Показывает один день, навигация стрелками, отметка каждого дня
 */
(function () {
  'use strict';

  // Состояние
  let programType = null;
  let currentDate = null;
  let currentWeek = null;
  let programData = null;
  let currentDayData = null;

  // DOM
  const trainTitle = document.getElementById('train-title');
  const trainSubtitle = document.getElementById('train-subtitle');
  const currentDateEl = document.getElementById('current-date');
  const trainContent = document.getElementById('train-content');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnCheck = document.getElementById('btn-check');
  const checkHint = document.getElementById('check-hint');

  function init() {
    programType = router.getQueryParam('type');

    if (programType !== CONFIG.PROGRAM_TYPES.MALE && programType !== CONFIG.PROGRAM_TYPES.FEMALE) {
      trainContent.innerHTML = '<div class="error-msg"><strong>ОШИБКА</strong><br>Неверный тип программы.<br><a href="index.html" style="color:#cc0000;">Вернуться на главную</a></div>';
      return;
    }

    // Всегда стартуем с 1 июля 2026
    currentDate = calendar.normalize(CONFIG.START_DATE);
    currentWeek = 1;

    btnPrev.addEventListener('click', () => navigateDay(-1));
    btnNext.addEventListener('click', () => navigateDay(1));
    btnCheck.addEventListener('click', toggleCompletion);

    loadAndRender();
  }

  function navigateDay(delta) {
    currentDate = calendar.addDays(currentDate, delta);
    currentWeek = calendar.getWeekNumber(currentDate);
    loadAndRender();
  }

  async function loadAndRender() {
    if (calendar.isSunday(currentDate)) {
      renderRestDay();
      return;
    }

    if (!api.isCached(programType, currentWeek)) {
      trainContent.innerHTML = '<div class="loading"><div class="spinner"></div><div>Загрузка программы...</div></div>';
    }

    btnCheck.style.display = 'none';

    try {
      programData = await api.fetchProgram(programType, currentWeek);
      const dayIndex = calendar.getDayIndex(currentDate);
      currentDayData = programData.days[dayIndex];
      renderTrainingDay();
      updateCheckButton();
    } catch (error) {
      trainContent.innerHTML = `<div class="error-msg">
        <strong>ОШИБКА ЗАГРУЗКИ</strong><br>
        ${escapeHtml(error.message)}<br><br>
        <button class="btn" onclick="location.reload()" style="margin-top:1rem; background:var(--surface); border:1px solid var(--accent);">
          ПОПРОБОВАТЬ СНОВА
        </button>
      </div>`;
    }
  }

  function renderTrainingDay() {
    const data = currentDayData;
    const dayName = CONFIG.DAY_NAMES[currentDate.getDay()];
    const typeLabel = programType === 'male' ? 'МУЖСКАЯ' : 'ЖЕНСКАЯ';

    trainTitle.textContent = `День ${data.dayIndex}`;
    trainSubtitle.textContent = `Неделя ${currentWeek}  |  ${dayName}  |  ${typeLabel}`;
    currentDateEl.textContent = calendar.formatDateShort(currentDate);

    let html = '';

    if (data.warmup && data.warmup.length) {
      html += '<div class="section fade-in">';
      html += '<div class="section-title">РАЗМИНКА</div>';
      html += '<ul class="warmup-list">';
      data.warmup.forEach(item => {
        html += `<li>${escapeHtml(item)}</li>`;
      });
      html += '</ul></div>';
    }

    if (data.isCardio && data.cardioIntervals && data.cardioIntervals.length) {
      html += '<div class="section fade-in">';
      html += '<div class="section-title">КАРДИО / ИНТЕРВАЛЫ</div>';
      html += '<div class="cardio-intervals">';
      data.cardioIntervals.forEach(interval => {
        html += `<div class="interval-line">${escapeHtml(interval)}</div>`;
      });
      html += '</div></div>';
    } else if (!data.isCardio && data.exercises && data.exercises.length) {
      html += '<div class="section fade-in">';
      html += '<div class="section-title">ОСНОВНЫЕ УПРАЖНЕНИЯ</div>';
      html += '<div class="exercises-list">';
      data.exercises.forEach(ex => {
        html += `<div class="exercise-item">`;
        html += `<span class="exercise-name">${escapeHtml(ex.name)}</span>`;
        html += '</div>';
      });
      html += '</div></div>';
    }

    trainContent.innerHTML = html;
  }

  function renderRestDay() {
    trainTitle.textContent = 'ВЫХОДНОЙ';
    trainSubtitle.textContent = calendar.formatDate(currentDate);
    currentDateEl.textContent = calendar.formatDateShort(currentDate);

    trainContent.innerHTML = `
      <div class="rest-day fade-in">
        <h3>Воскресенье — выходной день</h3>
        <p>Восстановление и отдых</p>
      </div>
    `;

    btnCheck.style.display = 'none';
    checkHint.textContent = '';
  }

  function updateCheckButton() {
    const today = calendar.getToday();
    const start = calendar.normalize(CONFIG.START_DATE);

    if (calendar.isSunday(currentDate)) {
      btnCheck.style.display = 'none';
      checkHint.textContent = '';
      return;
    }

    btnCheck.style.display = 'inline-block';

    // Дата до старта
    if (currentDate < start) {
      btnCheck.disabled = true;
      btnCheck.textContent = 'ОТМЕТИТЬ ВЫПОЛНЕНИЕ';
      btnCheck.className = 'btn-check';
      checkHint.textContent = 'Программа начнётся 1 июля 2026';
      return;
    }

    // Будущая дата — нельзя отметить
    if (currentDate > today) {
      btnCheck.disabled = true;
      btnCheck.textContent = 'ОТМЕТИТЬ ВЫПОЛНЕНИЕ';
      btnCheck.className = 'btn-check';
      checkHint.textContent = 'Нельзя отметить будущую дату';
      return;
    }

    // Можно отмечать (сегодня или прошлое)
    btnCheck.disabled = false;
    checkHint.textContent = '';

    const completed = storage.getCompletion(programType, currentDate);

    if (completed === true) {
      btnCheck.textContent = 'ВЫПОЛНЕНО';
      btnCheck.className = 'btn-check btn-check--done';
    } else {
      btnCheck.textContent = 'ОТМЕТИТЬ ВЫПОЛНЕНИЕ';
      btnCheck.className = 'btn-check';
    }
  }

  function toggleCompletion() {
    const today = calendar.getToday();
    const start = calendar.normalize(CONFIG.START_DATE);

    if (currentDate < start || currentDate > today) return;

    const completed = storage.getCompletion(programType, currentDate);

    if (completed === true) {
      storage.removeCompletion(programType, currentDate);
    } else {
      storage.setCompletion(programType, currentDate, true);
    }

    updateCheckButton();
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Свайпы
  let touchStartX = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 80) {
      navigateDay(diff > 0 ? 1 : -1);
    }
  });

  // Клавиши
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') navigateDay(-1);
    if (e.key === 'ArrowRight') navigateDay(1);
  });

  init();
})();