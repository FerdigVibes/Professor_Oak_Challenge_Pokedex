import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';

export function renderPokemonDetail(pokemon, game) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  const dex = String(pokemon.dex).padStart(3, '0');
  const spritePath = `./assets/sprites/normal/${dex}-${pokemon.slug}.gif`;

  const gameId = game.id;
  const gameData = pokemon.games?.[gameId];
  const caught = isCaught(game.id, pokemon.dex);

  const pokeballPath = `./assets/icons/${
    caught ? 'pokeball-full.png' : 'pokeball-empty.png'
  }`;

  // 1️⃣ Render HTML first
  panel.innerHTML = `
    <div class="detail-sprite">
      <img
        src="${spritePath}"
        alt="${pokemon.names.en}"
        data-cry
        style="cursor: pointer;"
      />
    </div>

    <!-- Section 3 Pokéball -->
    <button
      id="detail-caught"
      class="caught-toggle"
      style="background-image: url(${pokeballPath});"
    ></button>

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

  // 2️⃣ Attach sprite cry
  const sprite = panel.querySelector('[data-cry]');
  if (sprite) {
    sprite.addEventListener('click', () => {
      playPokemonCry(pokemon);
    });
  }

  // 3️⃣ Attach Pokéball toggle + cry
  const ball = panel.querySelector('#detail-caught');
  if (ball) {
    ball.addEventListener('click', () => {
      const newState = toggleCaught(game.id, pokemon.dex);

      ball.style.backgroundImage = `url(./assets/icons/${
        newState ? 'pokeball-full.png' : 'pokeball-empty.png'
      })`;

      playPokemonCry(pokemon);
    });
  }
}




