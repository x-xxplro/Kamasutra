/**
 * storage.js — LocalStorage для отметок выполнения
 */
const storage = {
  _getKey(type, date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${CONFIG.STORAGE_KEYS.COMPLETION_PREFIX}_${type}_${y}-${m}-${d}`;
  },

  getCompletion(type, date) {
    const key = this._getKey(type, date);
    const value = localStorage.getItem(key);
    if (value === null) return null;
    return value === 'true';
  },

  setCompletion(type, date, completed) {
    const key = this._getKey(type, date);
    localStorage.setItem(key, String(completed));
  },

  removeCompletion(type, date) {
    const key = this._getKey(type, date);
    localStorage.removeItem(key);
  },

  getLastProgramType() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_PROGRAM_TYPE);
  },

  setLastProgramType(type) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_PROGRAM_TYPE, type);
  },

  getAllCompletions(type) {
    const completions = {};
    const prefix = `${CONFIG.STORAGE_KEYS.COMPLETION_PREFIX}_${type}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        const dateStr = key.replace(prefix, '');
        completions[dateStr] = localStorage.getItem(key) === 'true';
      }
    }
    return completions;
  }
};