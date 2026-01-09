// docs/js/ui/sections.js
// Sole renderer for Section 2 (Pokédex list)

import { renderPokemonDetail } from './detail.js';
import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';

// 🔄 Sync Section 2 UI when caught state changes elsewhere
window.addEventListener('caught-changed', (e) => {
  const { dex, caught } = e.detail;

  const dexStr = String(dex).padStart(3, '0');

  const row = document.querySelector(
    `.pokemon-row[data-dex="${dexStr}"]`
  );

  if (!row) return;

  // Update row caught state
  row.classList.toggle('is-caught', caught);

  // Update Pokéball icon
  const ball = row.querySelector('.caught-toggle');
  if (ball) {
    ball.style.backgroundImage = `url(./assets/icons/${
      caught ? 'pokeball-full.png' : 'pokeball-empty.png'
    })`;
  }
});

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

      const sections = gameData.sections ?? gameData.section ?? [];

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

      const ball = document.createElement('button');
      ball.className = 'caught-toggle';
      ball.style.backgroundImage = `url(./assets/icons/${
        caught ? 'pokeball-full.png' : 'pokeball-empty.png'
      })`;
      
      ball.addEventListener('click', (e) => {
        e.stopPropagation();
      
        const newState = toggleCaught(game.id, p.dex);
      
        ball.style.backgroundImage = `url(./assets/icons/${
          newState ? 'pokeball-full.png' : 'pokeball-empty.png'
        })`;
      
        row.classList.toggle('is-caught', newState);
        playPokemonCry(p);
      
        // 🔔 STEP 1 (event dispatch)
        window.dispatchEvent(new CustomEvent('caught-changed', {
          detail: {
            gameId: game.id,
            dex: p.dex,
            caught: newState
          }
        }));
      });

    
      const dexSpan = document.createElement('span');
      dexSpan.className = 'dex';
      dexSpan.textContent = `#${dex}`;
    
      const icon = document.createElement('img');
      icon.className = 'pokemon-icon';
      icon.src = `./assets/icons/pokemon/${dex}-${p.slug}-icon.png`;
      icon.alt = p.names.en;
    
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = p.names.en;
    
      row.append(ball, dexSpan, icon, name);
    
      // Row click = detail + cry
      row.addEventListener('click', () => {
        renderPokemonDetail(p, game);
        playPokemonCry(p);
      });
    
      if (caught) {
        row.classList.add('is-caught');
      }
    
      container.appendChild(row);
    });
  });
}

