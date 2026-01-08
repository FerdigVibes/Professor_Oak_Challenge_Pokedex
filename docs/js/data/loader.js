import { registerPokemon } from './registry.js';

export async function loadGameData(gameId) {
  // 1️⃣ Load game.json
  const gameRes = await fetch(`./data/games/${gameId}.json`);
  const game = await gameRes.json();

  // 2️⃣ Load all Pokémon JSONs
  const pokemonFiles = await fetch('./data/pokemon/index.json');
  const pokemonList = await pokemonFiles.json();

  // 3️⃣ Load each Pokémon file
  const pokemonData = await Promise.all(
    pokemonList.map(async file => {
      const res = await fetch(`./data/pokemon/${file}`);
      return res.json();
    })
  );

  // 4️⃣ Register Pokémon
  pokemonData.forEach(p => registerPokemon(p));

  return {
    game,
    pokemon: pokemonData
  };
}
