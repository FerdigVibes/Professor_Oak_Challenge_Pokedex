import { loadGameData } from './data/loader.js';
import { renderSections } from './ui/sections.js';
import { GAME_REGISTRY } from './data/registry.js';
import { loadGame } from './data/loader.js';
import { getGlobalProgress } from './state/progress.js';

const GAME_ID = 'red'; // hardcoded for now

window.addEventListener('caught-changed', () => {
  if (window.__CURRENT_GAME__ && window.__POKEMON_CACHE__) {
    updateGlobalProgress(
      window.__CURRENT_GAME__,
      window.__POKEMON_CACHE__
    );
  }
});

async function init() {
  const gameData = await loadGameData(GAME_ID);
  document.getElementById('progress').textContent = 'Pokémon Red';
  renderSections(gameData);
}

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

      item.addEventListener('click', () => {
        selectGame(game);
        container.remove();
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

async function selectGame(game) {
  // 1️⃣ Load game data
  const gameData = await loadGame(game.id);
  window.__CURRENT_GAME__ = gameData;
  window.__POKEMON_CACHE__ = gameData.pokemon;

  // 2️⃣ Update title row
  document.getElementById('app-title').textContent =
    `Professor Oak Challenge – ${game.label} Version`;

  // 3️⃣ Reset UI state
  document.getElementById('app')?.classList.remove('has-detail');
  document.querySelectorAll('.pokemon-row.is-active')
    .forEach(r => r.classList.remove('is-active'));

  // 4️⃣ Scroll Section 2 to top
  document.getElementById('section-list').scrollTop = 0;

  // 5️⃣ Render sections
  renderSections({
    game: gameData,
    pokemon: gameData.pokemon
  });

  // 6️⃣ Update progress bar + text
  updateGlobalProgress(game.id, game.total);

  // 7️⃣ Update current objective
  updateCurrentObjective(gameData);
}

export function getCurrentObjective(game, pokemon) {
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

  return 'Challenge Complete';
}

export function updateGlobalProgress(game, pokemon) {
  const { caught, total, percent } =
    getGlobalProgress(game, pokemon);

  const text = document.getElementById('progress-text');
  const fill = document.querySelector('.progress-fill');

  if (text) text.textContent = `${caught} / ${total} Caught`;
  if (fill) fill.style.width = `${percent}%`;
}


init();
