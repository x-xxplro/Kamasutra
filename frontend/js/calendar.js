/**
 * calendar.js — Календарная логика
 */
const calendar = {
  normalize(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  getToday() {
    return this.normalize(new Date());
  },

  isSunday(date) {
    return date.getDay() === 0;
  },

  getDayIndex(date) {
    const start = this.normalize(CONFIG.START_DATE);
    const target = this.normalize(date);
    const diffMs = target - start;
    let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 0;

    const startDay = start.getDay();
    const fullWeeks = Math.floor(diffDays / 7);
    const remainder = diffDays % 7;
    const daysToSunday = (7 - startDay) % 7;
    const sundays = fullWeeks + (remainder >= daysToSunday && daysToSunday !== 0 ? 1 : 0);

    const trainingDayNumber = diffDays - sundays;
    return trainingDayNumber % CONFIG.TRAINING_DAYS;
  },

  getWeekNumber(date) {
    const start = this.normalize(CONFIG.START_DATE);
    const target = this.normalize(date);
    const diffMs = target - start;
    let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 1;

    const startDay = start.getDay();
    let trainingDays = 0;

    for (let i = 0; i <= diffDays; i++) {
      const checkDate = new Date(start);
      checkDate.setDate(start.getDate() + i);
      if (checkDate.getDay() !== 0) trainingDays++;
    }

    // Тренировочные дни до этой даты (не включая текущий)
    const pastTrainingDays = trainingDays - 1;
    if (pastTrainingDays < 0) return 1;

    // Неделя = прошлые тренировочные дни / 6 + 1
    const rawWeek = Math.floor(pastTrainingDays / CONFIG.TRAINING_DAYS) + 1;

    // Всё что больше 4 → 4
    return rawWeek >= CONFIG.MAX_WEEK ? CONFIG.MAX_WEEK : rawWeek;
  },

  formatDate(date) {
    const dayName = CONFIG.DAY_NAMES_FULL[date.getDay()];
    const day = date.getDate();
    const month = CONFIG.MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  },

  formatDateShort(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  },

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return this.normalize(result);
  }
};