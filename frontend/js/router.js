/**
 * router.js — Навигация и query-параметры
 */
const router = {
  navigateTo(url) {
    window.location.href = url;
  },

  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  hasQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.has(name);
  },

  updateQueryParams(params) {
    const url = new URL(window.location);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    window.history.replaceState({}, '', url);
  }
};