// docs/js/data/loader.js

// ========================================================
// GAME INHERITANCE (FRLG → RBY)
// ========================================================
import { normalizeGameId } from '../utils/normalizeGameId.js';

export const GAME_ALIASES = {
  firered: "red",
  leafgreen: "blue",
  firered_switch: "firered",
  leafgreen_switch: "leafgreen"
};

export function resolveGameEntry(pokemon, gameId) {
  let current = normalizeGameId(gameId);

  while (current) {
    const entry = pokemon.games?.[current];
    if (entry) return entry;

    current = GAME_ALIASES?.[current];
  }

  return undefined;
}

export function getGameData(pokemon, gameId) {
  const chain = [];
  let current = normalizeGameId(gameId);

  while (current) {
    chain.unshift(current); // base first, specific last
    current = GAME_ALIASES?.[current];
  }

  return chain.reduce((acc, id) => {
    const data = pokemon.games?.[id];
    if (!data) return acc;

    return {
      ...acc,
      ...data,

      sections: data.sections ?? acc.sections,
      availability: data.availability ?? acc.availability,

      obtain: mergeObtainArrays(acc.obtain, data.obtain)
    };
  }, {});
}

function mergeObtainArrays(base = [], override = []) {
  const max = Math.max(base.length, override.length);
  const merged = [];

  for (let i = 0; i < max; i++) {
    const b = base[i] || {};
    const o = override[i] || {};

    merged.push({
      ...b,
      ...o,
      location: o.location ?? b.location,
      notes: o.notes ?? b.notes,
      notesI18n: o.notesI18n ?? b.notesI18n,
      method: o.method ?? b.method,
      time: o.time ?? b.time,
      days: o.days ?? b.days
    });
  }

  return merged;
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

