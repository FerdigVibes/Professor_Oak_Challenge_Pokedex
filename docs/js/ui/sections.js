// docs/js/ui/sections.js
// Sole renderer for Section 2 (Pokédex list)

import { renderPokemonDetail } from './detail.js';
import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';
import { isCaught, toggleCaught } from '../state/caught.js';


export function renderSections({ game, pokemon }) {
  const container = document.getElementById('section-list');
  container.innerHTML = '';

  game.sections.forEach(section => {
    // Only render sections that actually require Pokémon
    if (!section.requiredCount) return;

    // Section header
    const header = document.createElement('h2');
    header.textContent = section.title;
    header.dataset.sectionId = section.id;
    container.appendChild(header);

    // Pokémon that belong to this section (game-aware, not hardcoded)
    const matches = pokemon.filter(p => {
      const gameData = p.games?.[game.id] || p.games?.[game.key];
      if (!gameData) return false;

      const sections =
        gameData.section ||
        gameData.sections ||
        [];

      if (Array.isArray(sections)) {
        return sections.includes(section.id);
      }

      return sections === section.id;
    });

    // Render rows
    matches.forEach(p => {
      const row = document.createElement('div');
      row.className = 'pokemon-row';
      
      const dex = String(p.dex).padStart(3, '0');
      const caught = isCaught(game.id, p.dex);
      
      // Pokéball toggle
      const ball = document.createElement('button');
      ball.className = 'caught-toggle';
      ball.style.backgroundImage = `url(./assets/icons/${
        caught ? 'pokeball-full.png' : 'pokeball-empty.png'
      })`;
      
      ball.addEventListener('click', (e) => {
        e.stopPropagation(); // IMPORTANT: don't trigger row click
        const newState = toggleCaught(game.id, p.dex);
        ball.style.backgroundImage = `url(./assets/icons/${
          newState ? 'pokeball-full.png' : 'pokeball-empty.png'
        })`;
      
        row.classList.toggle('is-caught', newState);
      
        // Re-evaluate sections after change (next step)
        renderSections({ game, pokemon });
      });
      
      const dexSpan = document.createElement('span');
      dexSpan.className = 'dex';
      dexSpan.textContent = `#${dex}`;
      
      const icon = document.createElement('img');
      icon.className = 'pokemon-icon';
      icon.src = `./assets/icons/pokemon/${dex}-${p.slug}-icon.png`;
      
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = p.names.en;
      
      row.append(ball, dexSpan, icon, name);
      
      // Row click still opens detail + plays cry
      row.addEventListener('click', () => {
        renderPokemonDetail(p, game);
        playPokemonCry(p);
      });
      
      container.appendChild(row);
    });
  });
}

const keyForGame = (gameId) => `oak:${gameId}:caught`;

export function getCaught(gameId) {
  return JSON.parse(localStorage.getItem(keyForGame(gameId)) || '{}');
}

export function isCaught(gameId, dex) {
  const caught = getCaught(gameId);
  return !!caught[dex];
}

export function toggleCaught(gameId, dex) {
  const caught = getCaught(gameId);
  caught[dex] = !caught[dex];
  localStorage.setItem(keyForGame(gameId), JSON.stringify(caught));
  return caught[dex];
}

