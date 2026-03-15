// docs/js/data/i18n.js

import { getLanguage } from '../state/language.js';

let translations = {};

export async function loadLanguage(lang) {
  const tryLoad = async (code) => {
    const res = await fetch(`./js/data/lang/${code}.json`);
    if (!res.ok) return null;
    return await res.json();
  };

  translations = await tryLoad(lang);

  if (!translations && lang !== 'en') {
    console.warn(`Falling back to English`);
    translations = await tryLoad('en');
  }

  if (!translations) {
    console.error('Failed to load any language data.');
    translations = {};
  }
  window.__I18N__ = translations;
}

export function t(key, vars = {}) {
  let str = getNested(translations, key) ?? key;

  Object.entries(vars).forEach(([k, v]) => {
    str = str.replaceAll(`{{${k}}}`, v);
  });

  return str;
}

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function resolveLangField(field, lang = getLanguage()) {
  if (!field) return null;

  if (typeof field === 'string') return field;

  if (Array.isArray(field)) return field;

  return field[lang] ?? field.en ?? null;
}

window.t = t;
window.resolveLangField = resolveLangField;
window.__I18N__ = translations;
window.getLanguage = getLanguage;
