// docs/js/ui/detail.js
// Renders Section 3 Pokémon detail (game-aware)

export function renderPokemonDetail(pokemon, game) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  const dex = String(pokemon.dex).padStart(3, '0');
  const spritePath = `./assets/sprites/normal/${dex}-${pokemon.slug}.gif`;

  const gameId = game.id;
  const gameData = pokemon.games?.[gameId];

  panel.innerHTML = `
    <div class="detail-sprite">
      <img src="${spritePath}" alt="${pokemon.names.en}" />
    </div>

    <h2>${pokemon.names.en}</h2>

    <p>
      <strong>National Dex:</strong>
      #${dex}
    </p>

    <p>
      <strong>Types:</strong>
      ${pokemon.types.join(', ')}
    </p>

    <hr />

    ${
      gameData
        ? renderGameInfo(gameData)
        : `<p style="opacity:0.6">Not obtainable in this game.</p>`
    }
  `;
}

/* =========================
   Game-specific rendering
   ========================= */

function renderGameInfo(gameData) {
  const sections = gameData.sections?.join(', ') ?? '—';

  const obtainHtml = (gameData.obtain || [])
    .map(o => renderObtainEntry(o))
    .join('');

  return `
    <p><strong>Sections:</strong> ${sections}</p>

    <h3>Obtain Methods</h3>
    <ul>
      ${obtainHtml || '<li>—</li>'}
    </ul>
  `;
}

function renderObtainEntry(o) {
  const locations = Array.isArray(o.locations)
    ? o.locations.join(', ')
    : o.location ?? null;

  const time = Array.isArray(o.time)
    ? o.time.join(', ')
    : o.time ?? null;

  return `
    <li style="margin-bottom: 8px;">
      <strong>${o.method}</strong>

      ${locations ? `<br/><strong>Locations:</strong> ${locations}` : ''}

      ${time ? `<br/><strong>Time:</strong> ${time}` : ''}

      ${o.notes ? `<br/><em>${o.notes}</em>` : ''}
    </li>
  `;
}


