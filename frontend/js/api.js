/**
 * api.js — Запросы к бэкенду с кэшированием
 */
const api = {
  _cache: {},

  async _fetch(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка сервера: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа от сервера');
      }

      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Сервер недоступен. Проверьте подключение к интернету.');
      }

      throw error;
    }
  },

  async fetchProgram(type, week) {
    const cacheKey = `${type}_${week}`;

    // Если есть в кэше — возвращаем мгновенно
    if (this._cache[cacheKey]) {
      return this._cache[cacheKey];
    }

    // Иначе загружаем с сервера
    const url = `${CONFIG.API_BASE_URL}/api/program/${type}/${week}`;
    const data = await this._fetch(url);

    // Сохраняем в кэш
    this._cache[cacheKey] = data;

    return data;
  },

  isCached(type, week) {
    const cacheKey = `${type}_${week}`;
    return !!this._cache[cacheKey];
  },

  getFromCache(type, week) {
    const cacheKey = `${type}_${week}`;
    return this._cache[cacheKey] || null;
  },

  clearCache() {
    this._cache = {};
  }
};