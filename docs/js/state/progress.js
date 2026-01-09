import { isCaught } from './caught.js';

export function getGlobalProgress(game, pokemon) {
  const total = game.total;
  let caught = 0;

  pokemon.forEach(p => {
    if (isCaught(game.id, p.dex)) caught++;
  });

  return {
    caught,
    total,
    percent: total ? Math.floor((caught / total) * 100) : 0
  };
}
