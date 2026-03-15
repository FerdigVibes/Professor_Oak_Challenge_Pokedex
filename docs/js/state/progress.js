import { isCaught } from './caught.js';
import { normalizeGameId } from '../utils/normalizeGameId.js';
import { getGameData } from '../data/loader.js';

export function getGlobalProgress(game, pokemon) {
  const total = game.totalPokemon;

  const gameKey = normalizeGameId(game.id);

  const caught = pokemon.filter(p => {
    const entry = getGameData(p, gameKey);
    return entry && isCaught(game.id, p.dex);
  }).length;

  const percent = total > 0
    ? Math.min(100, Math.round((caught / total) * 100))
    : 0;

  return { caught, total, percent };
}
