// docs/js/ui/detail.js

export function renderPokemonDetail(pokemon, game) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  const gameId = game.id;
  const gameData = pokemon.games?.[gameId];

  panel.innerHTML = `
    <h2>${pokemon.names.en}</h2>

    <p><strong>National Dex:</strong> #${String(pokemon.dex).padStart(3, '0')}</p>

    <p><strong>Types:</strong> ${pokemon.types.join(', ')}</p>

    <hr />

    ${
      gameData
        ? renderGameInfo(gameData)
        : `<p style="opacity:0.6">Not obtainable in this game.</p>`
    }
  `;
}

function renderGameInfo(gameData) {
  const sections = gameData.sections?.join(', ') ?? '—';

  const obtainHtml = (gameData.obtain || [])
    .map(o => {
      return `
        <li>
          <strong>${o.method}</strong>
          ${o.location ? `— ${o.location}` : ''}
          ${o.notes ? `<br/><em>${o.notes}</em>` : ''}
        </li>
      `;
    })
    .join('');

  return `
    <p><strong>Sections:</strong> ${sections}</p>

    <h3>Obtain Methods</h3>
    <ul>
      ${obtainHtml || '<li>—</li>'}
    </ul>
  `;
}

