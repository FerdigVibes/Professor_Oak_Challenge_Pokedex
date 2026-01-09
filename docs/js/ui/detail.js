// docs/js/ui/detail.js
// Renders Section 3 Pokémon detail (game-aware, minimal display)

import { playPokemonCry } from './cry.js';

export function renderPokemonDetail(pokemon, game) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  const dex = String(pokemon.dex).padStart(3, '0');
  const spritePath = `./assets/sprites/normal/${dex}-${pokemon.slug}.gif`;

  const gameId = game.id;
  const gameData = pokemon.games?.[gameId];

  panel.innerHTML = `
    <div class="detail-sprite">
      <img
        src="${spritePath}"
        alt="${pokemon.names.en}"
        data-cry
        style="cursor: pointer;"
      />
    </div>

    <h2>${pokemon.names.en}</h2>

    <p>
      <strong>National Dex:</strong> #${dex}
    </p>

    ${
      gameData
        ? renderGameInfo(gameData)
        : `<p style="opacity:0.6">Not obtainable in this game.</p>`
    }
  `;

  // Play cry on sprite click
  const sprite = panel.querySelector('[data-cry]');
  if (sprite) {
    sprite.addEventListener('click', () => {
      playPokemonCry(pokemon);
    });
  }
}

/* =========================
   Game-specific rendering
   ========================= */

function renderGameInfo(gameData) {
  const obtain = gameData.obtain || [];

  if (!obtain.length) {
    return `<p style="opacity:0.6">No obtain data.</p>`;
  }

  return `
    <div class="obtain-info">
      ${obtain.map(renderObtainEntry).join('')}
    </div>
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
    <div style="margin-top: 10px;">
      ${locations ? `<p><strong>Location:</strong> ${locations}</p>` : ''}

      ${time ? `<p><strong>Time:</strong> ${time}</p>` : ''}

      ${o.notes ? `<p style="opacity:0.7;"><em>${o.notes}</em></p>` : ''}
    </div>
  `;
}



