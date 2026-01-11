// docs/js/ui/sections.js

import { renderPokemonDetail } from './detail.js';
import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';
import { getLanguage } from '../state/language.js';
import { t } from '../data/i18n.js';

// Tracks sections manually expanded by the user
const userExpandedSections = new Set();

/* =========================================================
   SECTION COUNTER + COLLAPSE
   ========================================================= */

function updateSectionCounter(sectionBlock) {
  const sectionId = sectionBlock.dataset.sectionId;
  const gameId = sectionBlock.dataset.gameId;
  const required = Number(sectionBlock.dataset.requiredCount);
  if (!required) return;

  const rows = sectionBlock.querySelectorAll('.pokemon-row');
  let caughtCount = 0;

  if (sectionId === 'STARTER') {
    // Count families caught (Oak rules)
    const families = {};

    rows.forEach(row => {
      const family = row.dataset.family;
      if (!families[family]) families[family] = [];
      families[family].push(row);
    });

    caughtCount = Object.values(families).filter(familyRows =>
      familyRows.some(row =>
        isCaught(gameId, Number(row.dataset.dex))
      )
    ).length;
  } else {
    caughtCount = Array.from(rows).filter(row =>
      isCaught(gameId, Number(row.dataset.dex))
    ).length;
  }

  sectionBlock._counterEl.textContent = t('sectionCaughtCount', {
    caught: caughtCount,
    total: required
  });
}

function applyStarterExclusivity(sectionBlock, gameId) {
  const rows = sectionBlock.querySelectorAll('.pokemon-row');

  // Group rows by family
  const families = {};
  rows.forEach(row => {
    const family = row.dataset.family;
    if (!family) return;
    if (!families[family]) families[family] = [];
    families[family].push(row);
  });

  // Reset all rows to visible first
  rows.forEach(row => {
    row.style.display = '';
  });

  // Find the chosen family (any caught Pokémon)
  let chosenFamily = null;

  Object.entries(families).forEach(([family, familyRows]) => {
    if (
      familyRows.some(row =>
        isCaught(gameId, Number(row.dataset.dex))
      )
    ) {
      chosenFamily = family;
    }
  });

  // Hide all other families
  if (chosenFamily) {
    Object.entries(families).forEach(([family, familyRows]) => {
      if (family !== chosenFamily) {
        familyRows.forEach(row => {
          row.style.display = 'none';
        });
      }
    });
  }
}


/* =========================================================
   REACT TO CAUGHT CHANGES
   ========================================================= */

window.addEventListener('caught-changed', () => {
  document.querySelectorAll('.section-block').forEach(section => {
    updateSectionCounter(section);

    if (section.dataset.sectionId === 'STARTER') {
      applyStarterExclusivity(
        section,
        section.dataset.gameId
      );
    }
  });
});

/* =========================================================
   SECTION 2 RENDERER
   ========================================================= */

export function renderSections({ game, pokemon }) {
  // Make Pokémon list globally readable (derived-only)
  window.__POKEMON_CACHE__ = pokemon;

  const container = document.getElementById('section-list');
  container.innerHTML = '';

  game.sections.forEach(section => {
    if (!section.requiredCount) return;

    /* ---------- Section wrapper ---------- */

    const sectionBlock = document.createElement('div');
    sectionBlock.className = 'section-block';
    sectionBlock.dataset.sectionId = section.id;
    sectionBlock.dataset.requiredCount = section.requiredCount;
    sectionBlock.dataset.gameId = game.id;
    sectionBlock.dataset.titleKey = section.titleKey;

    /* ---------- Header ---------- */

    const header = document.createElement('h2');
    header.className = 'section-header';

    const counter = document.createElement('span');
    counter.className = 'section-counter';
    counter.textContent = t('sectionCaughtCount', {
      caught: 0,
      total: section.requiredCount
    });

    const title = document.createElement('span');
    title.className = 'section-title';
    title.textContent = t(section.titleKey);

    header.append(counter, title);
    sectionBlock._counterEl = counter;

    /* ---------- Rows container ---------- */

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

    /* ---------- Pokémon rows ---------- */

    const matches = pokemon.filter(p =>
      p.games?.[game.id]?.sections?.includes(section.id)
    );

    matches.forEach(p => {
      const caught = isCaught(game.id, p.dex);

      const row = document.createElement('div');
      row.className = 'pokemon-row';
      row.dataset.dex = String(p.dex);

      const lang = getLanguage();
      const displayName = p.names[lang] || p.names.en;

      row.dataset.name = displayName.toLowerCase();
      row.dataset.family = p.evolution?.family?.join('|') ?? '';

      /* Pokéball toggle */

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

        window.dispatchEvent(
          new CustomEvent('caught-changed', {
            detail: { gameId: game.id, dex: p.dex, caught: newState }
          })
        );
      });

      /* Icon */

      const icon = document.createElement('img');
      icon.className = 'pokemon-icon';
      icon.src = `./assets/icons/pokemon/${String(p.dex).padStart(3, '0')}-${p.slug}-icon.png`;
      icon.alt = displayName;

      row.append(
        ball,
        icon,
        document.createTextNode(` #${String(p.dex).padStart(3, '0')} `),
        document.createTextNode(displayName)
      );

      /* Row click → Section 3 */

      row.addEventListener('click', () => {
        const app = document.getElementById('app');
        const isActive = row.classList.contains('is-active');

        document
          .querySelectorAll('.pokemon-row.is-active')
          .forEach(r => r.classList.remove('is-active'));

        if (isActive) {
          app?.classList.remove('has-detail');
          return;
        }

        row.classList.add('is-active');
        renderPokemonDetail(p, game);
        playPokemonCry(p);
        app?.classList.add('has-detail');
      });

      if (caught) row.classList.add('is-caught');

      sectionRows.appendChild(row);
    });

    // Apply starter exclusivity AFTER all rows exist
    if (section.id === 'STARTER') {
     applyStarterExclusivity(sectionBlock, game.id);
    }

    /* ---------- Final assembly ---------- */

    sectionBlock.append(header, sectionRows);
    container.appendChild(sectionBlock);

    updateSectionCounter(sectionBlock);
  });
}


