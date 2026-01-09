// docs/js/ui/sections.js

import { renderPokemonDetail } from './detail.js';
import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';

// Tracks sections the user manually expanded
const userExpandedSections = new Set();

/* =========================
   STARTER HELPERS
   ========================= */

function getStarterFamilies(pokemon, gameId, sectionId) {
  const families = new Map();

  pokemon.forEach(p => {
    const gameData = p.games?.[gameId];
    if (!gameData) return;

    if (!gameData.sections?.includes(sectionId)) return;

    const family = p.evolution?.family;
    if (!Array.isArray(family)) return;

    const key = family.join('|');
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(p);
  });

  return Array.from(families.values());
}

function isFamilyCaught(gameId, family) {
  return family.some(p => isCaught(gameId, p.dex));
}

/* =========================
   STEP 2 — SECTION COLLAPSE
   ========================= */

window.addEventListener('caught-changed', () => {
  document.querySelectorAll('.section-block').forEach(block => {
    const sectionId = block.dataset.sectionId;
    const gameId = block.dataset.gameId;
    const required = Number(block.dataset.requiredCount);
    if (!required) return;

    const rows = block.querySelectorAll('.pokemon-row');
    const header = block.querySelector('h2');
    const rowsContainer = block.querySelector('.section-rows');

    let caughtCount;

    if (sectionId === 'STARTER') {
      const families = [...new Set(
        Array.from(rows).map(r => r.dataset.family)
      )];

      caughtCount = families.filter(familyKey => {
        return Array.from(rows).some(r =>
          r.dataset.family === familyKey &&
          isCaught(gameId, Number(r.dataset.dex))
        );
      }).length;
    } else {
      caughtCount = Array.from(rows).filter(r =>
        isCaught(gameId, Number(r.dataset.dex))
      ).length;
    }

    if (caughtCount >= required && !userExpandedSections.has(sectionId)) {
      rowsContainer.style.display = 'none';
      header.classList.add('collapsed');
    }
  });
});

/* =========================
   SECTION 2 RENDERER
   ========================= */

export function renderSections({ game, pokemon }) {
  const container = document.getElementById('section-list');
  container.innerHTML = '';

  game.sections.forEach(section => {
    if (!section.requiredCount) return;

    const isStarterSection = section.id === 'STARTER';

    const sectionBlock = document.createElement('div');
    sectionBlock.className = 'section-block';
    sectionBlock.dataset.sectionId = section.id;
    sectionBlock.dataset.requiredCount = section.requiredCount;
    sectionBlock.dataset.gameId = game.id;

    const header = document.createElement('h2');
    header.textContent = section.title;

    const sectionRows = document.createElement('div');
    sectionRows.className = 'section-rows';

    header.addEventListener('click', () => {
      const collapsed = sectionRows.style.display === 'none';
      sectionRows.style.display = collapsed ? '' : 'none';
      header.classList.toggle('collapsed', !collapsed);

      collapsed
        ? userExpandedSections.add(section.id)
        : userExpandedSections.delete(section.id);
    });

    let matches = pokemon.filter(p =>
      p.games?.[game.id]?.sections?.includes(section.id)
    );

    // ⭐ STARTER EXCLUSIVITY
    if (isStarterSection) {
      const families = getStarterFamilies(pokemon, game.id, section.id);
      const chosenFamily = families.find(f =>
        isFamilyCaught(game.id, f)
      );
      if (chosenFamily) matches = chosenFamily;
    }

    matches.forEach(p => {
      const dex = String(p.dex).padStart(3, '0');
      const caught = isCaught(game.id, p.dex);

      const row = document.createElement('div');
      row.className = 'pokemon-row';
      row.dataset.dex = dex;
      row.dataset.family = p.evolution?.family?.join('|') ?? '';

      const ball = document.createElement('button');
      ball.className = 'caught-toggle';
      ball.style.backgroundImage = `url(./assets/icons/${
        caught ? 'pokeball-full.png' : 'pokeball-empty.png'
      })`;

      ball.addEventListener('click', e => {
        e.stopPropagation();
        const newState = toggleCaught(game.id, p.dex);
        ball.style.backgroundImage = `url(./assets/icons/${
          newState ? 'pokeball-full.png' : 'pokeball-empty.png'
        })`;
        row.classList.toggle('is-caught', newState);
        if (newState) playPokemonCry(p);

        window.dispatchEvent(new CustomEvent('caught-changed', {
          detail: { gameId: game.id, dex: p.dex, caught: newState }
        }));
      });

      row.append(ball, document.createTextNode(` #${dex} `), document.createTextNode(p.names.en));
      row.addEventListener('click', () => renderPokemonDetail(p, game));
      if (caught) row.classList.add('is-caught');

      sectionRows.appendChild(row);
    });

    sectionBlock.append(header, sectionRows);
    container.appendChild(sectionBlock);
  });
}


