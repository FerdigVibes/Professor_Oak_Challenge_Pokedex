// docs/js/data/loader.js

// ========================================================
// GAME INHERITANCE (FRLG → RBY)
// ========================================================

export const GAME_ALIASES = {
  firered: "red",
  leafgreen: "blue",
  firered_switch: "firered",
  leafgreen_switch: "leafgreen"
};

function resolveGameEntry(pokemon, gameId) {
  let current = normalizeGameId(gameId);

  while (current) {
    const entry = pokemon.games?.[current];
    if (entry) return entry;

    current = GAME_ALIASES?.[current];
  }

  return undefined;
}

export function getGameData(pokemon, gameId) {
  const baseId = GAME_ALIASES[gameId];
  const baseData = pokemon.games?.[baseId] || {};
  const override = pokemon.games?.[gameId] || {};

  return {
    ...baseData,
    ...override,
    sections: override.sections ?? baseData.sections,
    obtain: override.obtain ?? baseData.obtain,
    availability: override.availability ?? baseData.availability
  };
}

export async function loadGame(gameId) {
  // ❗ DO NOT normalize here
  const gameUrl = `./data/games/${gameId}.json`;

  console.log('[LOAD GAME]', gameId, '→', gameUrl);

  const gameRes = await fetch(gameUrl);
  if (!gameRes.ok) {
    throw new Error(`Failed to load game JSON (${gameRes.status}): ${gameUrl}`);
  }

  const game = await gameRes.json();

  const indexRes = await fetch('./data/pokemon/index.json');
  if (!indexRes.ok) {
    throw new Error('Failed to load Pokémon index');
  }

  const pokemonIndex = await indexRes.json();

  const pokemon = await Promise.all(
    pokemonIndex.map(async file => {
      const res = await fetch(`./data/pokemon/${file}`);
      if (!res.ok) {
        throw new Error(`Failed to load Pokémon JSON: ${file}`);
      }
      return res.json();
    })
  );

  game.pokemon = pokemon;
  return game;
}

