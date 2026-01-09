import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';
import { getLanguage } from '../state/language.js';

const lang = getLanguage();
const displayName = pokemon.names[lang] || pokemon.names.en;

/* =========================================================
   SECTION 3 — POKÉMON DETAIL PANEL
   ========================================================= */

export function renderPokemonDetail(pokemon, game) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  const dex = String(pokemon.dex).padStart(3, '0');
  const spritePath = `./assets/sprites/normal/${dex}-${pokemon.slug}.gif`;

  const gameData = pokemon.games?.[game.id];
  const caught = isCaught(game.id, pokemon.dex);

  const pokeballPath = `./assets/icons/${
    caught ? 'pokeball-full.png' : 'pokeball-empty.png'
  }`;

  /* ---------------------------------------------------------
     Render HTML
     --------------------------------------------------------- */

  panel.innerHTML = `
    <div class="detail-sprite">
      <img
        src="${spritePath}"
        alt="${displayName}"
        data-cry
        style="cursor: pointer;"
      />
    </div>

    <button
      id="detail-caught"
      class="caught-toggle"
      style="background-image: url(${pokeballPath});"
      aria-label="Toggle caught"
    ></button>

    <h2>${displayName}</h2>

    <p>
      <strong>National Dex:</strong> #${dex}
    </p>

    ${
      gameData
        ? renderGameInfo(gameData)
        : `<p style="opacity:0.6">Not obtainable in this game.</p>`
    }
  `;

  /* ---------------------------------------------------------
     Sprite → play cry
     --------------------------------------------------------- */

  const sprite = panel.querySelector('[data-cry]');
  if (sprite) {
    sprite.addEventListener('click', () => {
      playPokemonCry(pokemon);
    });
  }

  /* ---------------------------------------------------------
     Pokéball toggle (Section 3)
     --------------------------------------------------------- */

  const ball = panel.querySelector('#detail-caught');
  if (ball) {
    ball.addEventListener('click', () => {
      const newState = toggleCaught(game.id, pokemon.dex);

      ball.style.backgroundImage = `url(./assets/icons/${
        newState ? 'pokeball-full.png' : 'pokeball-empty.png'
      })`;

      // 🔊 Only play cry when marking as caught
      if (newState) {
        playPokemonCry(pokemon);
      }

      // 🔔 Notify rest of app
      window.dispatchEvent(new CustomEvent('caught-changed', {
        detail: {
          gameId: game.id,
          dex: pokemon.dex,
          caught: newState
        }
      }));
    });
  }

  /* ---------------------------------------------------------
     Sync with external caught changes (Step 3)
     --------------------------------------------------------- */

  // Remove previous listener (if any)
  if (panel._onCaughtChanged) {
    window.removeEventListener('caught-changed', panel._onCaughtChanged);
  }

  panel._onCaughtChanged = (e) => {
    const { dex: changedDex, caught: newCaught } = e.detail;

    if (changedDex !== pokemon.dex) return;

    const ball = panel.querySelector('#detail-caught');
    if (!ball) return;

    ball.style.backgroundImage = `url(./assets/icons/${
      newCaught ? 'pokeball-full.png' : 'pokeball-empty.png'
    })`;
  };

  window.addEventListener('caught-changed', panel._onCaughtChanged);
}

/* =========================================================
   GAME-SPECIFIC INFO RENDERING
   ========================================================= */

function renderGameInfo(gameData) {
  const obtainHtml = (gameData.obtain || [])
    .map(o => renderObtainEntry(o))
    .join('');

  return `
    <h3>How to Obtain</h3>
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
    : null;

  return `
    <li style="margin-bottom: 8px;">
      ${locations ? `<strong>Locations:</strong> ${locations}<br/>` : ''}
      ${time ? `<strong>Time:</strong> ${time}<br/>` : ''}
      ${o.notes ? `<em>${o.notes}</em>` : ''}
    </li>
  `;
}






