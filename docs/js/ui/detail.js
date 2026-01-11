// docs/js/ui/detail.js

import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';
import { getLanguage } from '../state/language.js';
import { resolveLangField } from '../data/i18n.js';

export function renderPokemonDetail(pokemon, game) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  const lang = getLanguage();
  const displayName = pokemon.names?.[lang] || pokemon.names?.en || pokemon.slug;

  const dex = String(pokemon.dex).padStart(3, '0');
  const spritePath = `./assets/sprites/normal/${dex}-${pokemon.slug}.gif`;

  const gameData = pokemon.games?.[game.id];
  const caught = isCaught(game.id, pokemon.dex);

  const pokeballPath = `./assets/icons/${
    caught ? 'pokeball-full.png' : 'pokeball-empty.png'
  }`;

  panel.innerHTML = `
    <div class="detail-sprite">
      <img
        src="${spritePath}"
        alt="${displayName}"
        data-cry
        style="cursor:pointer"
      />
    </div>

    <button
      id="detail-caught"
      class="caught-toggle"
      style="background-image:url(${pokeballPath})"
      aria-label="Toggle caught"
    ></button>

    <h2>${displayName}</h2>

    <p><strong>National Dex:</strong> #${dex}</p>

    ${
      gameData
        ? renderGameInfo(gameData, lang)
        : `<p style="opacity:.6">Not obtainable in this game.</p>`
    }
  `;

  // Sprite → cry
  const sprite = panel.querySelector('[data-cry]');
  if (sprite) sprite.addEventListener('click', () => playPokemonCry(pokemon));

  // Pokéball toggle (only cry when marking caught)
  const ball = panel.querySelector('#detail-caught');
  if (ball) {
    ball.addEventListener('click', () => {
      const newState = toggleCaught(game.id, pokemon.dex);

      ball.style.backgroundImage = `url(./assets/icons/${
        newState ? 'pokeball-full.png' : 'pokeball-empty.png'
      })`;

      if (newState) playPokemonCry(pokemon);

      window.dispatchEvent(
        new CustomEvent('caught-changed', {
          detail: { gameId: game.id, dex: pokemon.dex, caught: newState }
        })
      );
    });
  }
}

/* =========================================================
   Game-specific info (translated fields)
   ========================================================= */

function renderGameInfo(gameData, lang) {
  const obtain = Array.isArray(gameData.obtain) ? gameData.obtain : [];

  const obtainHtml = obtain.map(o => renderObtainEntry(o, lang)).join('');

  return `
    <h3>How to Obtain</h3>
    <ul>
      ${obtainHtml || '<li>—</li>'}
    </ul>
  `;
}

function renderObtainEntry(o, lang) {
  // locations can be array of strings or array of lang-objects (future-safe)
  const locs = Array.isArray(o.locations)
    ? o.locations
        .map(x => resolveLangField(x, lang))
        .filter(Boolean)
        .join(', ')
    : resolveLangField(o.location, lang);

  const time = Array.isArray(o.time) ? o.time.join(', ') : null;

  const notes = resolveLangField(o.notes, lang);

  return `
    <li style="margin-bottom:8px;">
      ${locs ? `<strong>Locations:</strong> ${locs}<br/>` : ''}
      ${time ? `<strong>Time:</strong> ${time}<br/>` : ''}
      ${notes ? `<em>${notes}</em>` : ''}
    </li>
  `;
}







