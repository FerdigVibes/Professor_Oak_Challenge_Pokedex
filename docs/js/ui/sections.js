// docs/js/ui/sections.js
// Sole renderer for Section 2 (Pokédex list)

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
      row.dataset.dex = p.dex;
      row.textContent = `${p.dex} – ${p.names.en}`;
      container.appendChild(row);
    });
  });
}

