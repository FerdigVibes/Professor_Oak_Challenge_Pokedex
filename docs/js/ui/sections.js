import { renderPokedexSection } from './pokedex.js';

export function renderSections({ game, pokemon }) {
  const container = document.getElementById('section-list');
  container.innerHTML = '';

  game.sections.forEach(section => {
    // ✅ Only render sections that can contain Pokémon
    if (!section.requiredCount) return;

    const header = document.createElement('h2');
    header.textContent = section.title;
    container.appendChild(header);

    renderPokedexSection(section, pokemon, container);
  });
}
