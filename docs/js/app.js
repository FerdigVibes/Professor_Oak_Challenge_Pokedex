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
  const lang = getLanguage();
  await loadLanguage(lang);

  buildGameSelector();
  wireSearch();
  wireMuteToggle();
  wireLanguageSelector();

  await selectGame({
    id: 'red',
    label: 'Red',
    total: 124
  });

  applyTranslations();
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

    // 🔔 Notify UI modules (detail panel, etc.)
    window.dispatchEvent(new CustomEvent('language-changed', {
     detail: { lang }
    }));
  });
}

function applyTranslations() {
  // ----- Top bar -----
  document.getElementById('game-selector-btn').textContent =
    t('pickVersion') + ' ▾';

  const search = document.getElementById('search-input');
  if (search) search.placeholder = t('searchPlaceholder');

  const objLabel = document.querySelector('.objective strong');
  if (objLabel) objLabel.textContent = t('currentObjective') + ':';

  // ----- Re-render sections (Section 2) -----
  if (window.__CURRENT_GAME__ && window.__POKEMON_CACHE__) {
    renderSections({
      game: window.__CURRENT_GAME__,
      pokemon: window.__POKEMON_CACHE__
    });

    document.getElementById('app-title').textContent = t('appTitle', {
     version: window.__CURRENT_GAME__.label
    });

    updateGlobalProgress(
      window.__CURRENT_GAME__,
      window.__POKEMON_CACHE__
    );

    updateCurrentObjective(
      window.__CURRENT_GAME__,
      window.__POKEMON_CACHE__
    );
  }

  // ----- Re-render Section 3 if open -----
  const activeRow = document.querySelector('.pokemon-row.is-active');
  if (activeRow && window.__CURRENT_GAME__) {
    const dex = Number(activeRow.dataset.dex);
    const pokemon = window.__POKEMON_CACHE__.find(p => p.dex === dex);
    if (pokemon) {
      renderPokemonDetail(pokemon, window.__CURRENT_GAME__);
    }
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
    genItem.textContent = gen.label;

    const submenu = document.createElement('div');
    submenu.className = 'game-menu-sub';

    gen.games.forEach(game => {
      const item = document.createElement('div');
      item.className = 'game-menu-item';
      item.textContent = game.label;

      item.addEventListener('click', async () => {
        await selectGame(game);
        container.classList.remove('open');
      });

      submenu.appendChild(item);
    });

    genItem.appendChild(submenu);
    container.appendChild(genItem);
  });

  btn.parentElement.appendChild(container);

  const wrapper = btn.parentElement;

  wrapper.addEventListener('mouseenter', () => {
   container.classList.add('open');
  });
   
  wrapper.addEventListener('mouseleave', () => {
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

async function selectGame(game) {
  // 1️⃣ Load data
  const gameData = await loadGame(game.id);
  document.getElementById('game-selector-btn').textContent =
  `${game.label} ▾`;

  // 2️⃣ Expose derived state
  window.__CURRENT_GAME__ = gameData;
  window.__POKEMON_CACHE__ = gameData.pokemon;

  // 3️⃣ Update title
  import { t } from './data/i18n.js';

  document.getElementById('app-title').textContent = t('appTitle', {
   version: game.label
  });

  // 4️⃣ Reset UI
  document.getElementById('app')?.classList.remove('has-detail');
  document
    .querySelectorAll('.pokemon-row.is-active')
    .forEach(r => r.classList.remove('is-active'));

  document.getElementById('section-list').scrollTop = 0;

  // 5️⃣ Render sections
  renderSections({
    game: gameData,
    pokemon: gameData.pokemon
  });

  // 6️⃣ Update derived UI
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

