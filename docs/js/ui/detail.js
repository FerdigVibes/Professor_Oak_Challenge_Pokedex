// docs/js/ui/detail.js

import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';
import { getLanguage } from '../state/language.js';
import { resolveLangField, t } from '../data/i18n.js';

let currentSelection = null; // { pokemon, game }

/* =========================================================
   React to language changes
   ========================================================= */

window.addEventListener('language-changed', () => {
  if (!currentSelection) return;
  renderPokemonDetail(currentSelection.pokemon, currentSelection.game);
});

/* =========================================================
   SECTION 3 — Pokémon Detail Panel
   ========================================================= */

export function renderPokemonDetail(pokemon, game) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  currentSelection = { pokemon, game };

  const lang = getLanguage();
  const displayName =
    pokemon.names?.[lang] || pokemon.names?.en || pokemon.slug;

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
      aria-label="${t('caught')}"
    ></button>

    <h2>${displayName}</h2>

    <p>
      <strong>${t('nationalDex')}:</strong> #${dex}
    </p>

    ${
      gameData
        ? renderGameInfo(gameData, lang)
        : `<p style="opacity:.6">${t('notObtainable')}</p>`
    }
  `;

  /* ---------- Sprite → Cry ---------- */

  const sprite = panel.querySelector('[data-cry]');
  if (sprite) {
    sprite.addEventListener('click', () => playPokemonCry(pokemon));
  }

  /* ---------- Pokéball toggle ---------- */

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
          detail: {
            gameId: game.id,
            dex: pokemon.dex,
            caught: newState
          }
        })
      );
    });
  }
}

/* =========================================================
   Game-specific info (translated fields)
   ========================================================= */

function renderGameInfo(gameData, lang) {
  const obtainHtml = (gameData.obtain || [])
    .map(o => renderObtainEntry(o, lang))
    .join('');

  return `
    <h3>${t('howToObtain')}</h3>
    <ul>
      ${obtainHtml || `<li>${t('notObtainable')}</li>`}
    </ul>
  `;
}

export function closePokemonDetail() {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  panel.innerHTML = '';
  currentSelection = null;

  document.getElementById('app')?.classList.remove('has-detail');

  document
    .querySelectorAll('.pokemon-row.is-active')
    .forEach(r => r.classList.remove('is-active'));
}

function renderObtainEntry(o, lang) {
  const method = o.methodKey ? t(o.methodKey) : '';

  const locations = Array.isArray(o.locations)
    ? o.locations.map(l => resolveLangField(l, lang)).join(', ')
    : resolveLangField(o.location, lang);

  const timeRaw = resolveLangField(o.time, lang);
  const time = Array.isArray(timeRaw) ? timeRaw.join(', ') : timeRaw;

  const notes = resolveLangField(o.notes, lang);

  return `
    <li style="margin-bottom:8px;">
      ${method ? `<strong>${method}</strong><br/>` : ''}
      ${locations ? `<strong>${t('locations')}:</strong> ${locations}<br/>` : ''}
      ${time ? `<strong>${t('time')}:</strong> ${time}<br/>` : ''}
      ${notes ? `<em>${notes}</em>` : ''}
    </li>
  `;
}









