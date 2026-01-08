export function renderPokedexSection(section, pokemonList, container) {
  const list = document.createElement('div');
  list.className = 'pokedex-section';

  const filtered = pokemonList.filter(p =>
    p.games?.red?.sections?.includes(section.id)
  );

  filtered.forEach(pokemon => {
    const row = document.createElement('div');
    row.className = 'pokemon-row';
    row.textContent = `${pokemon.dex} – ${pokemon.names.en}`;
    list.appendChild(row);
  });

  container.appendChild(list);
}
