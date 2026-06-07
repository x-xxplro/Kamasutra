/**
 * config.js — Глобальные константы
 */
const CONFIG = {
  // API — порт бэкенда 3000
  API_BASE_URL: 'http://localhost:3000',

  // Дата старта программы
  START_DATE: new Date('2026-07-01'),

  // Параметры цикла
  TRAINING_DAYS: 6,
  MAX_WEEK: 4,

  // Кардио-дни: индексы 2, 4, 6 (вторник, четверг, суббота)
  CARDIO_DAYS: [2, 4, 6],

  // Названия дней
  DAY_NAMES: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
  DAY_NAMES_FULL: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  MONTH_NAMES: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],

  // LocalStorage ключи
  STORAGE_KEYS: {
    COMPLETION_PREFIX: 'training_completed',
    LAST_PROGRAM_TYPE: 'lastProgramType'
  },

  // Типы
  PROGRAM_TYPES: {
    MALE: 'male',
    FEMALE: 'female'
  }
};

Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.PROGRAM_TYPES);
Object.freeze(CONFIG.CARDIO_DAYS);
Object.freeze(CONFIG.DAY_NAMES);
Object.freeze(CONFIG.DAY_NAMES_FULL);
Object.freeze(CONFIG.MONTH_NAMES);