// docs/js/ui/sections.js
// Sole renderer for Section 2 (Pokédex list)

import { renderPokemonDetail } from './detail.js';
import { playPokemonCry } from './cry.js';


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
      
      const icon = document.createElement('img');
      icon.src = `./assets/icons/pokemon/${dex}-${p.slug}-icon.png`;
      icon.alt = p.names.en;
      icon.className = 'pokemon-icon';
      
      const label = document.createElement('span');
      label.textContent = `${dex} – ${p.names.en}`;
      
      row.appendChild(icon);
      row.appendChild(label);
      
      row.addEventListener('click', () => {
        renderPokemonDetail(p, game);
        playPokemonCry(p);
      });
      
      container.appendChild(row);
    });
  });
}

