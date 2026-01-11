// docs/js/app.js

import { loadGame } from './data/loader.js';
import { GAME_REGISTRY } from './data/registry.js';
import { renderSections } from './ui/sections.js';
import { getGlobalProgress } from './state/progress.js';
import { isCaught } from './state/caught.js';
import { isMuted, toggleMute } from './state/audio.js';
import { setLanguage, getLanguage } from './state/language.js';
import { loadLanguage, t } from './data/i18n.js';

/* =========================================================
   GLOBAL CAUGHT REACTIVITY
   ========================================================= */

window.addEventListener('caught-changed', () => {
  if (!window.__CURRENT_GAME__ || !window.__POKEMON_CACHE__) return;

  updateGlobalProgress(
    window.__CURRENT_GAME__,
    window.__POKEMON_CACHE__
  );

  updateCurrentObjective(
    window.__CURRENT_GAME__,
    window.__POKEMON_CACHE__
  );
});

/* =========================================================
   INIT
   ========================================================= */

async function init() {
  try {
    buildGameSelector();
    wireSearch();
    wireMuteToggle();
    wireLanguageSelector();

    // Load default language safely
    await loadLanguage(getLanguage());

    applyTranslations();
    resetAppToBlankState();

  } catch (err) {
    console.error('Init failed:', err);
  }
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

    // Notify UI modules (detail panel, etc.)
    window.dispatchEvent(
      new CustomEvent('language-changed', {
        detail: { lang }
      })
    );
  });
}


function resetAppToBlankState() {
  window.__CURRENT_GAME__ = null;
  window.__POKEMON_CACHE__ = null;

  document.getElementById('app-title').textContent =
    t('appTitleNoVersion');

  document.getElementById('game-selector-btn').textContent =
    `${t('pickVersion')} ▾`;

  const sectionList = document.getElementById('section-list');
  if (sectionList) sectionList.innerHTML = '';

  document.getElementById('app')?.classList.remove('has-detail');

  const progressText = document.getElementById('progress-text');
  const progressFill = document.querySelector('.progress-fill');
  if (progressText) progressText.textContent = `0 / 0 ${t('caught')}`;
  if (progressFill) progressFill.style.width = '0%';

  const obj = document.getElementById('current-objective');
  if (obj) obj.textContent = t('pickVersionPrompt');
}


function applyTranslations() {
  const selectorBtn = document.getElementById('game-selector-btn');

  if (window.__CURRENT_GAME__) {
    const { meta } = window.__CURRENT_GAME__;

    selectorBtn.textContent = `${t(meta.labelKey)} ▾`;

    document.getElementById('app-title').textContent = t('appTitle', {
      version: t(meta.labelKey)
    });
  } else {
    selectorBtn.textContent = `${t('pickVersion')} ▾`;
    document.getElementById('app-title').textContent =
      t('appTitleNoVersion');
  }

  const search = document.getElementById('search-input');
  if (search) search.placeholder = t('searchPlaceholder');

  const objLabel = document.querySelector('.objective strong');
  if (objLabel) objLabel.textContent = t('currentObjective') + ':';

  if (window.__CURRENT_GAME__) {
    renderSections({
      game: window.__CURRENT_GAME__.data,
      pokemon: window.__CURRENT_GAME__.data.pokemon
    });

    updateGlobalProgress(
      window.__CURRENT_GAME__.data,
      window.__CURRENT_GAME__.data.pokemon
    );

    updateCurrentObjective(
      window.__CURRENT_GAME__.data,
      window.__CURRENT_GAME__.data.pokemon
    );
  }
}



/* =========================================================
   GAME SELECTOR
   ========================================================= */

function buildGameSelector() {
  const btn = document.getElementById('game-selector-btn');
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

      item.addEventListener('click', async () => {
        await selectGame({
          ...game,
          label: t(game.labelKey)
        });
        container.classList.remove('open');
      });

      submenu.appendChild(item);
    });

    genItem.appendChild(submenu);
    container.appendChild(genItem);
  });

  btn.parentElement.appendChild(container);

  btn.addEventListener('mouseenter', () => {
    container.classList.add('open');
  });

  btn.parentElement.addEventListener('mouseleave', () => {
    container.classList.remove('open');
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

/* =========================================================
   GAME SWITCH CORE
   ========================================================= */

async function selectGame(gameMeta) {
  // gameMeta comes from GAME_REGISTRY
  const gameData = await loadGame(gameMeta.id);

  window.__CURRENT_GAME__ = {
    data: gameData,
    meta: gameMeta
  };

  // Selector button
  document.getElementById('game-selector-btn').textContent =
    `${t(gameMeta.labelKey)} ▾`;

  // Title
  document.getElementById('app-title').textContent = t('appTitle', {
    version: t(gameMeta.labelKey)
  });

  renderSections({
    game: gameData,
    pokemon: gameData.pokemon
  });

  updateGlobalProgress(gameData, gameData.pokemon);
  updateCurrentObjective(gameData, gameData.pokemon);
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
    text.textContent = t('caughtCount', {
      caught,
      total
    });
  }

  if (fill) {
    fill.style.width = `${percent}%`;
  }
}

/* =========================================================
   CURRENT OBJECTIVE
   ========================================================= */

function getCurrentObjective(game, pokemon) {
  for (const section of game.sections) {
    if (!section.requiredCount) continue;

    const matches = pokemon.filter(p =>
      p.games?.[game.id]?.sections?.includes(section.id)
    );

    const caughtCount = matches.filter(p =>
      isCaught(game.id, p.dex)
    ).length;

    if (caughtCount < section.requiredCount) {
      return section.title;
    }
  }

  return t('challengeComplete');
}

function updateCurrentObjective(game, pokemon) {
  const label = document.getElementById('current-objective');
  if (!label) return;

  label.textContent = getCurrentObjective(game, pokemon);
}

function applySearchFilter(query) {
  const q = query.trim().toLowerCase();

  document.querySelectorAll('.section-block').forEach(section => {
    let anyVisible = false;

    section.querySelectorAll('.pokemon-row').forEach(row => {
      const name = row.dataset.name;
      const dex = row.dataset.dex;

      const match =
        !q ||
        name.includes(q) ||
        dex.startsWith(q.replace('#', ''));

      row.style.display = match ? '' : 'none';
      if (match) anyVisible = true;
    });

    // Hide entire section if nothing matches
    const rowsContainer = section.querySelector('.section-rows');
    if (rowsContainer) {
      rowsContainer.style.display = anyVisible ? '' : 'none';
    }
  });
}

function wireSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    applySearchFilter(input.value);
  });
}

init();

