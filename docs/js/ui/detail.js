// docs/js/ui/detail.js

import { playPokemonCry } from './cry.js';
import { getLanguage } from '../state/language.js';
import { resolveLangField, t } from '../data/i18n.js';
import { normalizeGameId } from '../utils/normalizeGameId.js';
import { openMap } from './mapModal.js';
import { resolveLocationName } from '../../data/maps/locations.js';
import { isShinyEnabled, toggleShiny } from '../state/shiny.js';
import { GAME_ALIASES, getGameData } from '../data/loader.js';

let currentSelection = null; // { pokemon, game }

const GEN1_IDS = new Set(['red', 'blue', 'yellow']);
/* =========================================================
   React to language changes
   ========================================================= */

window.addEventListener('language-changed', () => {
  if (!currentSelection) return;
  renderPokemonDetail(
    currentSelection.pokemon,
    currentSelection.game,
    currentSelection.sectionId
  );
});

function buildObtainHTML(entry, generation) {
  const {
    method = '—',
    locations = [],
    time = [],
    days = [],
  } = entry;

  const lang = getLanguage();

  // 🧠 If notes is an object with translations, grab the right one
  let notes = '';
  if (typeof entry.notes === 'string') {
    notes = entry.notes;
  } else if (typeof entry.notes === 'object' && entry.notes !== null) {
    notes = entry.notes[lang] || entry.notes.en || '';
  }

  const timeStr = generation === 2 && time.length
   ? `${t('detail.time')}: ${time.join(', ')}`
   : '';

  const fullDayMap = {
   mon: 'monday',
   tue: 'tuesday',
   wed: 'wednesday',
   thu: 'thursday',
   fri: 'friday',
   sat: 'saturday',
   sun: 'sunday'
  };

  const dayStr = generation === 2 && days.length
   ? `${t('detail.days')}: ${days.map(d => t(`days.${fullDayMap[d] || d}`)).join(', ')}`
   : '';
   
  const locationStr = locations.length
   ? `${t('detail.locations')}: ${locations.join(', ')}`
   : '';
   
  return `
   <div class="obtain-method">
    <strong>${t('detail.method')}:</strong> ${t(`methods.${method}`) || method}<br />
    ${locationStr ? `<strong>${locationStr}</strong><br />` : ''}
    ${timeStr ? `<span class="time-label">${timeStr}</span><br />` : ''}
    ${dayStr ? `<span class="day-label">${dayStr}</span><br />` : ''}
    ${notes ? `<p class="notes">${notes}</p>` : ''}
   </div>
  `;
}

export function getDetailEntry(pokemon, gameData, sectionId) {
  const gameKey = normalizeGameId(gameData.id);

  // ✅ Prefer explicit override if present; otherwise use inherited base
  const merged = getGameData(pokemon, gameKey);

  // If your schema supports arrays per game entry, handle both
  const raw = pokemon.games?.[gameKey];
  const isArrayMode = Array.isArray(raw);

  if (!isArrayMode) {
    // Single entry mode: merged already contains sections/obtain/notes/etc
    return merged;
  }

  // Array mode: use alias fallback for base entries
  const baseKey = GAME_ALIASES?.[gameKey];
  const overrideEntries = Array.isArray(pokemon.games?.[gameKey]) ? pokemon.games[gameKey] : [];
  const baseEntries = baseKey && Array.isArray(pokemon.games?.[baseKey]) ? pokemon.games[baseKey] : [];

  const entries = overrideEntries.length ? overrideEntries : baseEntries;

  // Prefer an entry matching the current section
  return entries.find(e => e.sections?.includes(sectionId)) ?? entries[0] ?? null;
}

/* =========================================================
   SECTION 3 — Pokémon Detail Panel
   ========================================================= */

export function renderPokemonDetail(pokemon, gameData, sectionId) {
  const panel = document.getElementById('detail-panel');
  if (!panel || !pokemon || !gameData) return;

  const gameKey = normalizeGameId(gameData.id);

  const region =
     gameKey.startsWith('gold') ||
     gameKey.startsWith('silver') ||
     gameKey.startsWith('crystal')
       ? 'johto'
       : 'kanto';
   
  const gameEntry = getGameData(pokemon, gameKey);

  if (!gameEntry || !Object.keys(gameEntry).length) {
   panel.innerHTML = `<p>${pokemon.slug} is not available in this version.</p>`;
   return;
  }

  const lang = getLanguage();
  const name = pokemon.names?.[lang] || pokemon.names?.en || pokemon.slug;
  const dex = pokemon.dex;
  const regDex = gameData.regionalDex?.[String(dex)];

  // Sprites
  const spriteFile = `${String(dex).padStart(3, '0')}-${pokemon.slug}.gif`;
  const spriteNormal = `./assets/sprites/normal/${spriteFile}`;
  const spriteShiny = `./assets/sprites/shiny/${spriteFile}`;

  // Types
  const types = pokemon.types || [];
  // Obtain info
  const detailEntry = getDetailEntry(pokemon, gameData, sectionId);
  const obtain = Array.isArray(detailEntry?.obtain) ? detailEntry.obtain : [];

  panel.innerHTML = `
    <div class="detail-header">
      <h2 class="detail-name">
        ${name}
        <span id="shiny-toggle" class="shiny-icon" title="Toggle shiny sprite">✨</span>
      </h2>
      <div class="detail-dex">
        ${t('detail.nationalDex')}: #${String(dex).padStart(3, '0')}
        ${regDex ? ` | ${t('detail.regionalDex')}: #${regDex}` : ''}
      </div>
    </div>

    <div class="detail-sprite-window" id="sprite-window">
      <img 
        class="detail-sprite-img" 
        id="detail-sprite" 
        src="${spriteNormal}" 
        alt="${name}" 
        onerror="this.src='./assets/icons/pokeball-empty.png'"
      />
    </div>

    <div class="type-list">
      ${types.map(type => {
        const label = t(`types.${type}`) || type.toUpperCase();
        return `<span class="type-badge type-${type}">${label}</span>`;
      }).join('')}
    </div>

    <div class="obtain-section">
     <h3>${t('detail.obtainTitle')}</h3>
     ${obtain.length
       ? `<ul>${obtain.map(o => renderObtainEntry(o, lang, region)).join('')}</ul>`
       : '<p>—</p>'}
    </div>
  `;
  // ================= MAP BUTTON WIRING =================
  const allLocations = obtain.flatMap(o => o.locations ?? []);
   
  if (allLocations.length) {
   const mapBtn = document.createElement('button');
   mapBtn.className = 'map-button';
   mapBtn.textContent = t('detail.viewMap') || 'View Map';
   
   mapBtn.addEventListener('click', () => {
    openMap({
     gameId: normalizeGameId(gameData.id),
     locations: allLocations
    });
   });
   
   panel.querySelector('.obtain-section')?.appendChild(mapBtn);
  }
   
  const shinyToggle = document.getElementById('shiny-toggle');
  const sprite = document.getElementById('detail-sprite');
  const spriteWindow = document.getElementById('sprite-window');
  if (shinyToggle && sprite && spriteWindow) {
     const gen = gameData.generation || 1;
   
     if (gen >= 2) {
       const dexKey = String(dex);
   
       // ✅ Apply cached shiny state PER Pokémon
       const shinyOn = isShinyEnabled(dexKey);
   
       sprite.src = shinyOn ? spriteShiny : spriteNormal;
       shinyToggle.classList.toggle('active', shinyOn);
       spriteWindow.classList.toggle('shiny-active', shinyOn);
   
       // ✅ Toggle + persist per Pokémon
       shinyToggle.onclick = () => {
         const enabled = toggleShiny(dexKey);
   
         sprite.src = enabled ? spriteShiny : spriteNormal;
         shinyToggle.classList.toggle('active', enabled);
         spriteWindow.classList.toggle('shiny-active', enabled);
       };
     } else {
       shinyToggle.style.display = 'none';
     }
   }
}

/* =========================================================
   Game-specific info (translated fields)
   ========================================================= */

function renderObtainEntry(o, lang, region) {
  const method = o.method ? t(`methods.${o.method}`) : '';

  const locations = Array.isArray(o.locations)
    ? o.locations
        .map(loc => resolveLocationName(`${region}:${loc}`, lang))
        .join(', ')
    : '';

  const time = Array.isArray(o.time)
    ? o.time.map(ti => t(`time.${ti}`)).join(', ')
    : '';

  const notes = resolveLangField(o.notes, lang);

  return `
    <li style="margin-bottom:8px;">
      ${method ? `<strong>${t('detail.method')}:</strong> ${method}<br/>` : ''}
      ${locations ? `<strong>${t('detail.locations')}:</strong> ${locations}<br/>` : ''}
      ${time ? `<strong>${t('detail.time')}:</strong> ${time}<br/>` : ''}
      ${notes ? `<p class="notes">${notes}</p>` : ''}
    </li>
  `;
}

export function closePokemonDetail() {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  panel.innerHTML = '';
  currentSelection = null;

  document.getElementById('app')?.classList.remove('has-detail');

  document
    .querySelectorAll('.pokemon-row.is-active')
    .forEach(r => r.classList.remove('is-active'));
}

export function getCurrentDetailSelection() {
  return currentSelection;
}

export function setCurrentDetailSelection(value) {
  currentSelection = value;
}

window.getCurrentDetailSelection = getCurrentDetailSelection









