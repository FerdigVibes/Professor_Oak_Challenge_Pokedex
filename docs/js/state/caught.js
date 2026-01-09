const keyForGame = (gameId) => `oak:${gameId}:caught`;

export function getCaught(gameId) {
  return JSON.parse(localStorage.getItem(keyForGame(gameId)) || '{}');
}

export function isCaught(gameId, dex) {
  const caught = getCaught(gameId);
  return !!caught[dex];
}

export function setCaught(gameId, dex, value = true) {
  const caught = getCaught(gameId);
  caught[dex] = value;
  localStorage.setItem(keyForGame(gameId), JSON.stringify(caught));
}
