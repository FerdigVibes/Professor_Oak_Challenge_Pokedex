import { getLanguage } from '../state/language.js';

let translations = {};

export async function loadLanguage(lang) {
  const res = await fetch(`./data/lang/${lang}.json`);
  if (!res.ok) throw new Error(`Failed to load language: ${lang}`);
  translations = await res.json();
}

export function t(key) {
  return translations[key] || key;
}

export function getCurrentLanguage() {
  return getLanguage();
}
