// docs/js/app.js

import { loadGame } from './data/loader.js';
import { GAME_REGISTRY } from './data/registry.js';
import { renderSections } from './ui/sections.js';
import { getGlobalProgress } from './state/progress.js';
import { isCaught } from './state/caught.js';
import { getCaught } from './state/caught.js';
import { isMuted, toggleMute } from './state/audio.js';
import { setLanguage, getLanguage } from './state/language.js';
import { loadLanguage, t } from './data/i18n.js';
import { closePokemonDetail, renderPokemonDetail, getCurrentDetailSelection } from './ui/detail.js';
import { getGameTime, setGameTime, startGameClock } from './state/gameTime.js';
import { openGameTimeModal } from './ui/gameTimeModal.js';
import { getGameData } from './data/loader.js';

const STORAGE_KEY = 'oakChallenge.gameTime';
const btn = document.getElementById('game-time-btn');
const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;

let __CURRENT_OBJECTIVE_SECTION_ID__ = null;

window.__CURRENT_GAME__ = null;
window.__POKEMON_CACHE__ = null;

window.addEventListener("game-time-changed", () => {
  if (!window.__CURRENT_GAME__ || !window.__POKEMON_CACHE__) return;

  renderSections({
    game: window.__CURRENT_GAME__.data,
    pokemon: window.__POKEMON_CACHE__
  });

  const selection = getCurrentDetailSelection();
  if (selection) {
    renderPokemonDetail(selection.pokemon, window.__CURRENT_GAME__.data);
  }

});

function formatGameTime() {
  const { day, hour, minute, meridiem } = getGameTime();

  let dayLabel;
  try {
    dayLabel = t(`days.${day}`);
  } catch {
    dayLabel = day;
  }

  // Fallback if translations aren't loaded yet
  if (!dayLabel || dayLabel.startsWith('days.')) {
    dayLabel = day.charAt(0).toUpperCase() + day.slice(1, 3);
  }

  return `${dayLabel} ${hour}:${String(minute).padStart(2,'0')} ${meridiem}`;
}

function syncTopBarHeight(){
  const topBar = document.getElementById('top-bar');
  if (!topBar) return;

  const h = topBar.offsetHeight;
  document.documentElement.style.setProperty('--section2-top', `${h}px`);
  document.documentElement.style.setProperty('--topbar-height', `${h}px`);
}

window.addEventListener('resize', syncTopBarHeight);

/* =========================================================
   INIT
   ========================================================= */

async function init() {
  try {
    wireSearch();
    wireMuteToggle();
    wireResetDropdown();
    wireLanguageSelector();

    await loadLanguage(getLanguage()); // ✅ translations first

    resetAppToBlankState();
    buildGameSelector();
    applyTranslations();
    
    await loadLanguage(getLanguage());
    syncTopBarHeight();

    // 🔹 Section 2 background scroll sync
    const sectionList = document.getElementById('section-list');
    if (sectionList) {
      sectionList.addEventListener('scroll', () => {
        sectionList.style.setProperty(
          '--bg-scroll',
          `${sectionList.scrollTop * 0.6}px`
        );
      });
    }

  } catch (err) {
    console.error('Init failed:', err);
  }
}


function wireSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    applySearchFilter(input.value);
  });
}

function wireLanguageSelector() {
  const select = document.getElementById('language-selector');
  if (!select) return;

  select.value = getLanguage();

  select.addEventListener('change', async () => {
    const lang = select.value;
  
    setLanguage(lang);
    await loadLanguage(lang);
  
    applyTranslations();
    rebuildGameSelector();
  
    // 🔁 Rebuild derived UI that uses t()
    if (window.__CURRENT_GAME__) {
      const game = window.__CURRENT_GAME__.data;
      const pokemon = window.__POKEMON_CACHE__;
  
      buildResetSectionMenu();
      updateCurrentObjective(game, pokemon, true);
    }
  
    // Notify UI modules (detail panel, time button, etc.)
    window.dispatchEvent(
      new CustomEvent('language-changed', {
        detail: { lang }
      })
    );
  });
}

export function wireGameTimeButton(isGen2) {
  if (!isGen2) {
    btn.classList.add('hidden');
    return;
  }

  btn.classList.remove('hidden');

  const label = btn.querySelector('.game-time-label');
  if (!label) return;

  const update = () => {
    label.textContent = formatGameTime();
  };

  update();
  btn.onclick = openGameTimeModal;

  window.addEventListener('game-time-changed', update);
  window.addEventListener('language-changed', update);
}

function resetAppToBlankState() {
  window.__CURRENT_GAME__ = null;
  window.__POKEMON_CACHE__ = null;

  document.getElementById('app-title').textContent = t('appTitleNoVersion');

  const selectorBtn = document.getElementById('game-selector-btn');
  if (selectorBtn) {
    selectorBtn.textContent = t('pickVersion');
  }

  document.getElementById('section-list').innerHTML = '';
  document.getElementById('app')?.classList.remove('has-detail');

  const progressText = document.getElementById('progress-text');
  const progressFill = document.querySelector('.progress-fill');
  if (progressText) {
    progressText.textContent = t('globalCaughtCount', {
      caught: 0,
      total: 0
    });
  }
  if (progressFill) progressFill.style.width = '0%';

  const obj = document.getElementById('current-objective');
  if (obj) obj.textContent = t('pickVersionPrompt'); // ← fallback message
}

function applyTranslations() {
  const selectorBtn = document.getElementById('game-selector-btn');
  const titleEl = document.getElementById('app-title');

  document
    .querySelectorAll('[data-i18n]')
    .forEach(el => {
      const key = el.dataset.i18n;
      const translated = t(key);
  
      // Fallback: keep existing text if translation is missing
      el.textContent = translated && translated !== key
        ? translated
        : el.textContent;
    });

  if (window.__CURRENT_GAME__) {
    const { meta, data } = window.__CURRENT_GAME__;

    selectorBtn.textContent = t(meta.labelKey);
    titleEl.textContent = t('appTitle', {
      version: t(meta.labelKey)
    });

    renderSections({
      game: data,
      pokemon: data.pokemon
    });

    updateGlobalProgress(data, data.pokemon);
    updateCurrentObjective(data, data.pokemon);
  } else {
    selectorBtn.textContent = t('pickVersion');
    titleEl.textContent = t('appTitleNoVersion');
  }

  const resetBtn = document.getElementById('reset-section-btn');
  if (resetBtn) {
    resetBtn.textContent = t('resetSection');
  }

  const obj = document.getElementById('current-objective');
  if (obj && !window.__CURRENT_GAME__) {
    obj.textContent = t('pickVersionPrompt');
  }

  const search = document.getElementById('search-input');
  if (search) search.placeholder = t('searchPlaceholder');

  const objLabel = document.querySelector('.objective strong');
  if (objLabel) objLabel.textContent = t('currentObjective') + ':';
}

function resetGameMenuPosition(menu) {
  menu.style.position = '';
  menu.style.top = '';
  menu.style.bottom = '';
  menu.style.left = '';
  menu.style.right = '';
  menu.style.transform = '';
  menu.style.width = '';
}


/* =========================================================
   GAME SELECTOR
   ========================================================= */

function buildGameSelector() {
  const btn = document.getElementById('game-selector-btn');
  if (!btn) return;

  // Remove old menu if it exists
  document.querySelectorAll('.game-menu').forEach(m => m.remove());

  const container = document.createElement('div');
  container.className = 'game-menu';

  GAME_REGISTRY.forEach(gen => {
    const genItem = document.createElement('div');
    genItem.className = 'game-menu-gen';
    genItem.textContent = t(gen.genKey);

    const submenu = document.createElement('div');
    submenu.className = 'game-menu-sub';

    gen.games.forEach(game => {
      const item = document.createElement('div');
      item.className = 'game-menu-item';
      item.textContent = t(game.labelKey);
    
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
    
        await selectGame({
          ...game,
          label: t(game.labelKey)
        });
    
        // ✅ CLOSE EVERYTHING
        container.classList.remove('open');
        submenu.classList.remove('open');
        container
          .querySelectorAll('.game-menu-gen.open')
          .forEach(el => el.classList.remove('open'));
    
        // ✅ RESET POSITION so next open is correct
        resetGameMenuPosition(container);
      });
    
      submenu.appendChild(item);
    });

    genItem.appendChild(submenu);

    // ✅ MOBILE-SAFE submenu toggle
    genItem.addEventListener('click', (e) => {
      e.stopPropagation();

      container.querySelectorAll('.game-menu-gen.open')
        .forEach(el => {
          if (el !== genItem) el.classList.remove('open');
        });

      genItem.classList.toggle('open');
    });

    container.appendChild(genItem);
  });

  // ✅ MOBILE: move menu OUT of top bar
  if (IS_MOBILE) {
    document.body.appendChild(container);
  } else {
    btn.closest('.game-selector')?.appendChild(container);
  }

  // Toggle main dropdown
  /* =========================================================
   MAIN DROPDOWN TOGGLE (FIXED)
   ========================================================= */

   btn.addEventListener('click', (e) => {
    e.stopPropagation();

    const isOpen = container.classList.contains('open');

    // ⭐ POSITION BEFORE OPENING (mobile only)
    if (!isOpen && IS_MOBILE) {
      positionGameMenuUnderButton(btn, container);
    }

    if (isOpen) {
      closeGameMenu(container);
    } else {
      openGameMenu(container);
    }
});

function openGameMenu(container) {
  container.classList.add('open');
}

function closeGameMenu(container) {
  container.classList.remove('open');
  container
    .querySelectorAll('.game-menu-gen.open')
    .forEach(el => el.classList.remove('open'));
}

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && e.target !== btn) {
      closeGameMenu(container);
    }
  });
}



function wireMuteToggle() {
  const btn = document.getElementById('mute-toggle');
  if (!btn) return;

  const updateIcon = () => {
    btn.textContent = isMuted() ? '🔇' : '🔊';
  };

  updateIcon();

  btn.addEventListener('click', () => {
    toggleMute();
    updateIcon();
  });
}

function positionGameMenuUnderButton(btn, menu) {
  const rect = btn.getBoundingClientRect();

  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 6}px`;
  menu.style.left = `${rect.left}px`;
  menu.style.width = `${rect.width}px`;
  menu.style.transform = 'none';
  menu.style.bottom = 'auto';
  menu.style.zIndex = '9999';
}

/* =========================================================
   GAME SWITCH CORE
   ========================================================= */

async function selectGame(gameMeta) {
  try {
    console.log('selectGame → gameMeta.id:', gameMeta.id);

    // 1️⃣ Load game data FIRST
    const gameData = await loadGame(gameMeta.id);

    // 2️⃣ Determine Gen 2
    const isGen2 = ['gold', 'silver', 'crystal_gbc', 'crystal_vc']
      .includes(gameMeta.id);

    // 3️⃣ Store global game state
    window.__CURRENT_GAME__ = {
      id: gameMeta.id,
      meta: gameMeta,
      data: gameData
    };

    buildResetSectionMenu();

    // 4️⃣ Wire game-time UI
    wireGameTimeButton(isGen2);
    if (isGen2) startGameClock();

    document
      .getElementById('game-time-btn')
      ?.classList.toggle('hidden', !isGen2);

    // 5️⃣ Update top bar text
    document.getElementById('game-selector-btn').textContent =
      t(gameMeta.labelKey);

    document.getElementById('app-title').textContent = t('appTitle', {
      version: t(gameMeta.labelKey)
    });

    // 6️⃣ Render Section 2
    renderSections({
      game: gameData,
      pokemon: gameData.pokemon
    });

    // 7️⃣ Reconcile Section 3 (FIXED)
    const selection = getCurrentDetailSelection();
    if (selection) {
      const { pokemon } = selection;

      const gameId = gameMeta.id;
      const baseId = gameMeta.base || normalizeGameId(gameId);

      // Prefer exact game match, fall back to base game
      const entries =
        pokemon.games?.[gameId] ??
        pokemon.games?.[baseId];

      // VC-only guard (prevents Celebi leaking into crystal_gbc)
      const blockedByVcOnly =
        entries?.availability?.vcOnly === true &&
        gameId !== 'crystal_vc';

      if (!entries || blockedByVcOnly) {
        closePokemonDetail();
      } else {
        renderPokemonDetail(pokemon, gameData);
      }
    }

    // 8️⃣ Update progress + objective
    updateGlobalProgress(gameData, gameData.pokemon);
    updateCurrentObjective(gameData, gameData.pokemon);

  } catch (err) {
    console.error('Failed to select game:', err);
    alert(err.message); // TEMPORARY — remove later
  }
}

function wireResetDropdown() {
  const trigger = document.getElementById('reset-section-btn');
  const menu = document.getElementById('reset-section-menu');

  if (!trigger || !menu) return;

  // Toggle menu
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const open = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', open);
    trigger.setAttribute('aria-expanded', String(!open));
  });

  // Close on outside click
  document.addEventListener('click', () => {
    menu.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
  });
}

function buildResetSectionMenu() {
  const menu = document.getElementById('reset-section-menu');
  if (!menu) return;

  menu.innerHTML = '';

  const current = window.__CURRENT_GAME__;
  if (!current?.data) return;

  const game = current.data;

  // Leaf sections only (same rule as Section 2)
  const leafSections = game.sections.filter(
    s => typeof s.requiredCount === 'number'
  );

  leafSections.forEach(section => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reset-menu-item';
    btn.dataset.sectionId = section.id;

    // ✅ Translated section name
    btn.textContent = t(`objective.${section.titleKey}`);

    btn.addEventListener('click', () => {
      resetSection(section.id);
      menu.classList.add('hidden');
    });

    menu.appendChild(btn);
  });

  // Divider
  const divider = document.createElement('div');
  divider.className = 'reset-divider';
  menu.appendChild(divider);

  // Reset All
  const resetAllBtn = document.createElement('button');
  resetAllBtn.type = 'button';
  resetAllBtn.className = 'reset-menu-item reset-all';
  resetAllBtn.textContent = t('resetAll');

  resetAllBtn.addEventListener('click', () => {
    if (!confirm(t('resetAllConfirm'))) return;

    resetAllSections();
    menu.classList.add('hidden');
  });

  menu.appendChild(resetAllBtn);
}

function resetSection(sectionId) {
  const current = window.__CURRENT_GAME__;
  if (!current?.data) return;

  const gameId = current.id;
  const game = current.data;
  const pokemon = window.__POKEMON_CACHE__;

  const caughtKey = `oak:${gameId}:caught`;
  const caughtData = JSON.parse(localStorage.getItem(caughtKey) || '{}');

  // ⭐ ONLY scan rows belonging to this section
  const rows = document.querySelectorAll(
    `.section-block[data-section-id="${sectionId}"] .pokemon-row`
  );

  rows.forEach(row => {
    const dex = row.dataset.dex;

    const primaryKey = `oak:${gameId}:primary:${dex}`;
    const primary = localStorage.getItem(primaryKey);

    // ✅ Only reset if THIS section owns the primary
    if (primary === sectionId) {
      localStorage.removeItem(primaryKey);
      delete caughtData[dex];
    }
  });

  // Save caught state once
  localStorage.setItem(caughtKey, JSON.stringify(caughtData));

  // 🔥 Rebuild UI + counters
  renderSections({ game, pokemon });
  updateGlobalProgress(game, pokemon);
  updateCurrentObjective(game, pokemon);
}

window.resetSection = resetSection;

function resetAllSections() {
  const game = window.__CURRENT_GAME__?.data;
  if (!game) return;

  const gameId = window.__CURRENT_GAME__.id;

  localStorage.removeItem(`oak:${gameId}:caught`);

  renderSections({ game, pokemon: window.__POKEMON_CACHE__ });
  updateGlobalProgress(game, window.__POKEMON_CACHE__);
  updateCurrentObjective(game, window.__POKEMON_CACHE__);
}
/* =========================================================
   GLOBAL PROGRESS
   ========================================================= */

function updateGlobalProgress(game, pokemon) {
  const { caught, total, percent } =
    getGlobalProgress(game, pokemon);

  const text = document.getElementById('progress-text');
  const fill = document.querySelector('.progress-fill');

  if (text) {
    text.textContent = t('globalCaughtCount', {
      caught,
      total
    });
  }

  if (caught > total) {
    console.warn(
      `Caught count (${caught}) exceeds game total (${total}). Check duplicates.`
    );
  }

  if (fill) {
    fill.style.width = `${percent}%`;
  }
}

/* =========================================================
   CURRENT OBJECTIVE
   ========================================================= */

import { normalizeGameId } from './utils/normalizeGameId.js';

function getCurrentObjective(game, pokemon) {
  const gameKey = normalizeGameId(game.id);

  // 1️⃣ Parent sections (milestones)
  const parentSections = game.sections
    .filter(s => Array.isArray(s.children))
    .sort((a, b) => a.order - b.order);

  // 2️⃣ Walk each milestone
  for (const parent of parentSections) {
    let allChildrenComplete = true;

    for (const childId of parent.children) {
      const child = game.sections.find(s => s.id === childId);
      if (!child || typeof child.requiredCount !== 'number') continue;

      const matches = pokemon.filter(p => {
        const entry = getGameData(p, gameKey);
        return entry?.sections?.includes(child.id);
      });

      const caughtCount = matches.filter(p =>
        isCaught(game.id, p.dex)
      ).length;

      if (caughtCount < child.requiredCount) {
        allChildrenComplete = false;
        break;
      }
    }

    // 4️⃣ First incomplete milestone = objective
    if (!allChildrenComplete) {
      return t(parent.titleKey);
    }
  }

  // 5️⃣ Everything complete
  return t('challengeComplete');
}



function rebuildGameSelector() {
  const btn = document.getElementById('game-selector-btn');
  const existing = btn.parentElement.querySelector('.game-menu');
  if (existing) existing.remove();

  buildGameSelector();
}

function updateCurrentObjective(game, pokemon, force = false) {
  const label = document.getElementById('current-objective');
  if (!label) return;

  const newObjective = getCurrentObjectiveSectionId(game, pokemon);

  if (force || newObjective !== __CURRENT_OBJECTIVE_SECTION_ID__) {
    __CURRENT_OBJECTIVE_SECTION_ID__ = newObjective;

    const section = game.sections.find(s => s.id === newObjective);
    const titleKey = section?.titleKey;

    label.textContent = titleKey
      ? t(`objective.${titleKey}`)
      : t('challengeComplete');
  }
}

function getCurrentObjectiveSectionId(game, pokemon) {
  const gameKey = normalizeGameId(game.id);

  const parentSections = game.sections
    .filter(s => Array.isArray(s.children))
    .sort((a, b) => a.order - b.order);

  for (const parent of parentSections) {
    let allComplete = true;

    for (const childId of parent.children) {
      const child = game.sections.find(s => s.id === childId);
      if (!child || typeof child.requiredCount !== 'number') continue;

      const matches = pokemon.filter(p => {
        const entry = getGameData(p, gameKey);
        return entry?.sections?.includes(childId);
      });

      const caughtCount = matches.filter(p =>
        isCaught(game.id, p.dex)
      ).length;

      if (caughtCount < child.requiredCount) {
        allComplete = false;
        break;
      }
    }

    if (!allComplete) return parent.id;
  }

  return null; // All complete
}

function applySearchFilter(query) {
  const q = query.trim().toLowerCase();

  document.querySelectorAll('.section-block').forEach(section => {
    let anyVisible = false;

    section.querySelectorAll('.pokemon-row').forEach(row => {
      const name = (row.dataset.name || '').toLowerCase();
      const dex  = (row.dataset.dex  || '');

      const match =
        !q ||
        name.includes(q) ||
        dex.startsWith(q.replace('#', ''));

      row.style.display = match ? '' : 'none';
      if (match) anyVisible = true;
    });

    // ✅ hide the WHOLE section if nothing matches
    section.style.display = anyVisible ? '' : 'none';
  });
}

window.addEventListener('caught-changed', () => {
  if (!window.__CURRENT_GAME__ || !window.__POKEMON_CACHE__) return;
  updateGlobalProgress(
   window.__CURRENT_GAME__.data,
   window.__POKEMON_CACHE__
  );

  updateCurrentObjective(
   window.__CURRENT_GAME__.data,
   window.__POKEMON_CACHE__
  );
});

init();

