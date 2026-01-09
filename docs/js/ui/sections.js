// docs/js/ui/sections.js

import { renderPokemonDetail } from './detail.js';
import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';

// Tracks sections the user manually expanded
const userExpandedSections = new Set();

/* =========================================================
   SECTION COLLAPSE EVALUATION
   ========================================================= */

function evaluateSectionCollapse(sectionBlock) {
  const sectionId = sectionBlock.dataset.sectionId;
  const gameId = sectionBlock.dataset.gameId;
  const required = Number(sectionBlock.dataset.requiredCount);
  if (!required) return;

  const rows = sectionBlock.querySelectorAll('.pokemon-row');
  const header = sectionBlock.querySelector('h2');
  const rowsContainer = sectionBlock.querySelector('.section-rows');

  let caughtCount;

  if (sectionId === 'STARTER') {
    const families = getStarterFamilies(
      window.__POKEMON_CACHE__,
      gameId,
      sectionId
    );

    caughtCount = families.filter(f =>
      isFamilyCaught(gameId, f)
    ).length;
  } else {
    caughtCount = Array.from(rows).filter(r =>
      isCaught(gameId, Number(r.dataset.dex))
    ).length;
  }

  // If section is no longer complete, remove manual override
  if (caughtCount < required) {
     userExpandedSections.delete(sectionId);
  }

  if (caughtCount >= required && !userExpandedSections.has(sectionId)) {
    rowsContainer.style.display = 'none';
    header.classList.add('collapsed');
  }
}

/* =========================================================
   STARTER HELPERS
   ========================================================= */

function getStarterFamilies(pokemon, gameId, sectionId) {
  const families = new Map();

  pokemon.forEach(p => {
    const gameData = p.games?.[gameId];
    if (!gameData) return;

    const sections = gameData.sections ?? [];
    if (!sections.includes(sectionId)) return;

    const family = p.evolution?.family;
    if (!Array.isArray(family) || family.length === 0) return;

    const key = [...family].sort().join('|');

    if (!families.has(key)) {
      families.set(key, { key, members: [] });
    }

    families.get(key).members.push(p);
  });

  return Array.from(families.values());
}

function isFamilyCaught(gameId, family) {
  return family.members.some(p => isCaught(gameId, p.dex));
}

/* =========================================================
   STEP 2 — SECTION COLLAPSE LISTENER
   ========================================================= */

window.addEventListener('caught-changed', () => {
  document.querySelectorAll('.section-block').forEach(block => {
    if (block.dataset.sectionId !== 'STARTER') return;

    const gameId = block.dataset.gameId;
    const rows = block.querySelectorAll('.pokemon-row');

    // Group rows by family
    const families = {};
    rows.forEach(row => {
      const family = row.dataset.family;
      if (!families[family]) families[family] = [];
      families[family].push(row);
    });

    // Determine which family (if any) is chosen
    let chosenFamilyKey = null;

    for (const [familyKey, familyRows] of Object.entries(families)) {
      const familyCaught = familyRows.some(row =>
        isCaught(gameId, Number(row.dataset.dex))
      );
      if (familyCaught) {
        chosenFamilyKey = familyKey;
        break;
      }
    }

    // Apply visibility rules
    Object.entries(families).forEach(([familyKey, familyRows]) => {
      const hide = chosenFamilyKey && familyKey !== chosenFamilyKey;

      familyRows.forEach(row => {
        row.style.display = hide ? 'none' : '';
      });
    });
  });
});

/* =========================================================
   SECTION 2 RENDERER
   ========================================================= */

export function renderSections({ game, pokemon }) {
  // 🔒 Make Pokémon globally available for collapse logic
  window.__POKEMON_CACHE__ = pokemon;

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
      if (chosenFamily) matches = chosenFamily.members;
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
   
     const icon = document.createElement('img');
     icon.className = 'pokemon-icon';
     icon.src = `./assets/icons/pokemon/${dex}-${p.slug}-icon.png`;
     icon.alt = p.names.en;
   
     row.append(
       ball,
       icon,
       document.createTextNode(` #${dex} `),
       document.createTextNode(p.names.en)
     );
   
     row.addEventListener('click', () => {
        // Clear previous active row
        document
          .querySelectorAll('.pokemon-row.is-active')
          .forEach(r => r.classList.remove('is-active'));
      
        // Mark this row active (for icon bounce)
        row.classList.add('is-active');
      
        // Render Section 3
        renderPokemonDetail(p, game);
      
        // 🔊 Play cry on hard click
        playPokemonCry(p);
      });
   
     if (caught) row.classList.add('is-caught');
   
     // ✅ THIS WAS MISSING
     sectionRows.appendChild(row);
   }); // ✅ CLOSE matches.forEach
   
   // ✅ THESE MUST BE OUTSIDE THE LOOP
   sectionBlock.append(header, sectionRows);
   container.appendChild(sectionBlock);
   evaluateSectionCollapse(sectionBlock);
  });
}


