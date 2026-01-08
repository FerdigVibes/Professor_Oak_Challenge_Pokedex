import { loadGameData } from './data/loader.js';
import { renderSections } from './ui/sections.js';

const GAME_ID = 'red'; // hardcoded for now

async function init() {
  const gameData = await loadGameData(GAME_ID);
  document.getElementById('progress').textContent = 'Pokémon Red';
  renderSections(gameData);
}

init();
