// docs/js/ui/sections.js

import { renderPokemonDetail } from './detail.js';
import { playPokemonCry } from './cry.js';
import { isCaught, toggleCaught } from '../state/caught.js';
import { getLanguage } from '../state/language.js';
import { t } from '../data/i18n.js';
import { normalizeGameId } from '../utils/normalizeGameId.js';
import { getGameTime } from '../state/gameTime.js';
import { setCurrentDetailSelection } from './detail.js';
import { GAME_ALIASES } from '../data/loader.js';

const MOON_STONE_SECTIONS = new Set([
  'MOON_STONE_1',
  'MOON_STONE_2'
]);

// Tracks sections manually expanded by the user
const userExpandedSections = new Set();

function getGameEntries(pokemon, gameId) {
  const normalized = normalizeGameId(gameId);

  // ✅ If this game inherits from another (firered -> red), fallback when missing
  const baseId = GAME_ALIASES?.[normalized];
  const raw =
    pokemon.games?.[normalized] ??
    (baseId ? pokemon.games?.[baseId] : undefined);

  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

/* =========================================================
   Helpers
   ========================================================= */

function getPokemonTimeAvailability(gameData) {
  if (!gameData?.obtain) return [];
  return gameData.obtain.flatMap(o =>
    Array.isArray(o.time) ? o.time : o.time ? [o.time] : []
  );
}

function isAvailableToday(entry) {
  if (!entry?.obtain) return true;

  const { day } = getGameTime();

  return entry.obtain.some(o => {
    if (!o.days) return true; // If no restriction, it's always available
    return o.days.includes(day);
  });
}

function getStarterLinkedFamily(gameId, slug, baseFamily) {
  const id = normalizeGameId(gameId);

  // Only apply to FR/LG
  if (id !== 'firered' && id !== 'leafgreen') {
    return baseFamily;
  }

  // 🔥 Legendary dogs mapped to starter families
  if (slug === 'raikou') return 'squirtle|wartortle|blastoise';
  if (slug === 'entei') return 'bulbasaur|ivysaur|venusaur';
  if (slug === 'suicune') return 'charmander|charmeleon|charizard';

  return baseFamily;
}

function applyDuplicateLocking(gameId) {
  const rows = document.querySelectorAll('.pokemon-row');

  rows.forEach(row => {
    row.classList.remove('is-duplicate-locked');

    const dex = row.dataset.dex;
    const sectionId = row.dataset.sectionId;

    const primary =
      localStorage.getItem(`oak:${gameId}:primary:${dex}`);

    // No primary chosen yet → nothing locked
    if (!primary) return;

    // Lock ALL other instances
    if (primary !== sectionId) {
      row.classList.add('is-duplicate-locked');
    }
  });
}

function hasTimeOrDayRestriction(entry) {
  if (!entry?.obtain) return false;
  return entry.obtain.some(o =>
    Array.isArray(o.time) || Array.isArray(o.days)
  );
}

function getPokemonDayAvailability(gameData) {
  if (!gameData?.obtain) return [];
  return gameData.obtain.flatMap(o => Array.isArray(o.days) ? o.days : []);
}

function isMoonStoneDexResolved(gameId, dex) {
  return isCaught(gameId, dex);
}

function updateSectionCounter(sectionBlock) {
  const sectionId = sectionBlock.dataset.sectionId;
  const gameId = sectionBlock.dataset.gameId;
  const required = Number(sectionBlock.dataset.requiredCount);
  if (Number.isNaN(required)) return;

  const rows = sectionBlock.querySelectorAll('.pokemon-row');
  let caughtCount = 0;

  if (sectionId === 'STARTER') {
    // ✅ Count Pokémon, NOT families
    caughtCount = Array.from(rows).filter(row =>
      isCaught(gameId, Number(row.dataset.dex))
    ).length;
  } else {
      caughtCount = Array.from(rows).filter(row => {
        const dex = Number(row.dataset.dex);
    
        if (!isCaught(gameId, dex)) return false;
    
        // ⭐ NEW — only count primary catch location
        const primary = localStorage.getItem(`oak:${gameId}:primary:${dex}`);
        if (primary && primary !== row.dataset.sectionId) return false;
    
        return true;
      }).length;
    }

  sectionBlock._counterEl.textContent = t('sectionCaughtCount', {
    caught: caughtCount,
    total: required
  });
}

function applyStarterExclusivityGlobal(gameId) {
  const rows = document.querySelectorAll('.pokemon-row');

  // ⭐ ONLY THESE families participate
  const STARTER_FAMILIES = new Set([
    // Gen 1 / FRLG starters
    'bulbasaur|ivysaur|venusaur',
    'charmander|charmeleon|charizard',
    'squirtle|wartortle|blastoise',

    // Gen 2 starters
    'chikorita|bayleef|meganium',
    'cyndaquil|quilava|typhlosion',
    'totodile|croconaw|feraligatr'
  ]);

  const families = {};

  rows.forEach(row => {
    const family = row.dataset.family;

    // ❌ Ignore non-starter Pokémon
    if (!STARTER_FAMILIES.has(family)) return;

    families[family] ??= [];
    families[family].push(row);
  });

  // If no starter rows exist → do nothing
  if (!Object.keys(families).length) return;

  // Reset collapse state FIRST
  rows.forEach(row => row.classList.remove('starter-collapsed'));

  const caughtFamilies = Object.entries(families)
    .filter(([_, familyRows]) =>
      familyRows.some(row =>
        isCaught(gameId, Number(row.dataset.dex))
      )
    )
    .map(([family]) => family);

  // Only collapse when EXACTLY ONE starter line is chosen
  if (caughtFamilies.length !== 1) return;

  const chosen = caughtFamilies[0];

  Object.entries(families).forEach(([family, familyRows]) => {
    if (family === chosen) return;

    familyRows.forEach(row => {
      row.classList.add('starter-collapsed');
    });
  });
}

function isSectionCompleted(game, sectionId, pokemon, excludeDex = []) {
  const section = game.sections.find(s => s.id === sectionId);
  if (!section) return false;

  if (section.requiredCount) {
    const matches = pokemon.filter(p => {
      if (excludeDex.includes(p.dex)) return false;
    
      const entries = getGameEntries(p, normalizeGameId(game.id));
      return entries.some(e =>
        e.sections?.includes(sectionId)
      );
    });

    const caughtCount = matches.filter(p =>
      isCaught(game.id, p.dex)
    ).length;

    return caughtCount >= section.requiredCount;
  }

  if (Array.isArray(section.children)) {
    return section.children.every(childId =>
      isSectionCompleted(game, childId, pokemon, excludeDex)
    );
  }

  return false;
}

function isPokemonAvailable(gameEntry) {
  if (!gameEntry?.obtain) return true;

  const { day, hour, meridiem } = getGameTime();

  // Convert current time to 24h
  let h = hour % 12;
  if (meridiem === 'PM') h += 12;

  return gameEntry.obtain.some(o => {
    // Time check
    let timeOk = true;
    if (Array.isArray(o.time)) {
      if (o.time.includes('morning')) timeOk = h >= 6 && h < 10;
      else if (o.time.includes('day')) timeOk = h >= 10 && h < 18;
      else if (o.time.includes('night')) timeOk = h >= 18 || h < 6;
    }

    // Day check
    let dayOk = true;
    if (Array.isArray(o.days)) {
      dayOk = o.days.includes(day);
    }

    return timeOk && dayOk;
  });
}

function applyPokemonAvailabilityState(row, caught, availableNow, timeGated = false) {
  row.classList.remove('is-caught', 'is-available', 'is-unavailable', 'is-time-gated');

  if (caught) {
    row.classList.add('is-caught');
  } else if (availableNow) {
    row.classList.add('is-available');
    if (timeGated) row.classList.add('is-time-gated');
  } else {
    row.classList.add('is-unavailable');
  }
}

function applyMoonStoneLogic(game) {
  const config = game.moonStone;
  if (!config) return;

  const { pool, sections } = config;
  const gameId = game.id;

  // All Moon Stone rows (final evolutions only)
  const rows = [...document.querySelectorAll('.pokemon-row')]
    .filter(row => pool.includes(row.dataset.slug));

  // Group rows by section
  const rowsBySection = {};
  rows.forEach(row => {
    const sectionId = row.closest('.section-block')?.dataset.sectionId;
    if (!sections[sectionId]) return;
    rowsBySection[sectionId] ??= [];
    rowsBySection[sectionId].push(row);
  });

  // Slugs already resolved anywhere
  const resolvedSlugs = new Set(
    rows
      .filter(row => isCaught(gameId, Number(row.dataset.dex)))
      .map(row => row.dataset.slug)
  );

  Object.entries(rowsBySection).forEach(([sectionId, sectionRows]) => {
    const capacity = sections[sectionId].capacity;

    const caughtHere = sectionRows.filter(row => {
      const dex = Number(row.dataset.dex);
      if (!isCaught(gameId, dex)) return false;
    
      // ✅ Only count if this section is the PRIMARY catch location
      const primary = localStorage.getItem(`oak:${gameId}:primary:${dex}`);
      return primary === sectionId;
    });

    sectionRows.forEach(row => {
      row.classList.remove('is-capacity-locked', 'is-counterpart-locked');

      const slug = row.dataset.slug;

      // Already caught → never lock
      if (isCaught(gameId, Number(row.dataset.dex))) return;

      // Same Pokémon chosen elsewhere
      if (resolvedSlugs.has(slug)) {
        row.classList.add('is-counterpart-locked');
        return;
      }

      // Section capacity reached
      if (caughtHere.length >= capacity) {
        row.classList.add('is-capacity-locked');
      }
    });
  });
}

/* =========================================================
   React to caught changes
   ========================================================= */

window.addEventListener('caught-changed', () => {
  if (!window.__CURRENT_GAME__) return;

  const game = window.__CURRENT_GAME__.data;
  const gameId = window.__CURRENT_GAME__.id;

  document.querySelectorAll('.section-block').forEach(updateSectionCounter);

  applyMoonStoneLogic(game);
  applyDuplicateLocking(gameId);
  applyStarterExclusivityGlobal(gameId);

  // 🔥 Special rule engines
  applyMoonStoneLogic(game);
  applyDuplicateLocking(gameId);
});

/* =========================================================
   SECTION 2 RENDERER
   ========================================================= */

export function renderSections({ game, pokemon }) {
  window.__POKEMON_CACHE__ = pokemon;

  const gameKey = normalizeGameId(game.id);

  const container = document.getElementById('section-list');
  if (!container) return;
  container.innerHTML = '';

  if (!game || !game.sections) {
    container.innerHTML = `
      <div class="intro-panel intro-with-bg">
        <h2>Professor Oak Pokédex</h2>
  
        <p>
          A Pokédex-style tracker built for Professor Oak–style completion.
          Catch every available Pokémon before progressing.
        </p>
  
        <ul>
          <li>Select a game version above</li>
          <li>Pokémon are grouped by progression</li>
          <li>Mark Pokémon as caught as you go</li>
          <li>Time-based availability updates automatically in Gen 2</li>
        </ul>
  
        <p class="intro-hint">
          Your progress is saved automatically.
        </p>
      </div>
    `;
    return;
  }

  game.sections.forEach(section => {
    if (typeof section.requiredCount !== 'number') return;

    const sectionBlock = document.createElement('div');
    sectionBlock.className = 'section-block';
    sectionBlock.dataset.sectionId = section.id;
    sectionBlock.dataset.requiredCount = section.requiredCount;
    sectionBlock.dataset.gameId = game.id;
    sectionBlock.dataset.titleKey = section.titleKey;

    const header = document.createElement('h2');
    header.className = 'section-header';

    const counter = document.createElement('span');
    counter.className = 'section-counter';
    counter.textContent = t('sectionCaughtCount', { caught: 0, total: section.requiredCount });

    const title = document.createElement('span');
    title.className = 'section-title';
    console.log('[Section TitleKey]', section.titleKey);
    title.textContent = t(`objective.${section.titleKey}`);

    header.append(counter, title);
    sectionBlock._counterEl = counter;

    const sectionRows = document.createElement('div');
    sectionRows.className = 'section-rows';

    const matches = pokemon.filter(p => {

      // ⭐ NEW: version exclusion check
      if (Array.isArray(game.excludedPokemon) &&
          game.excludedPokemon.includes(p.slug)) {
        return false;
      }
      
      const entries = getGameEntries(p, game.id); // ✅ uses alias fallback
      if (!entries.length) return false;
    
      // Block VC-only Pokémon outside Crystal VC
      if (
        entries.some(e => e.availability?.vcOnly === true) &&
        game.id !== 'crystal_vc'
      ) {
        return false;
      }
    
      return entries.some(e => e.sections?.includes(section.id));
    });

    matches.forEach(p => {
      const primary =
        localStorage.getItem(`oak:${game.id}:primary:${p.dex}`);
      
      const caught =
        isCaught(game.id, p.dex) &&
        (!primary || primary === section.id);

      // 1️⃣ CREATE ROW FIRST
      const row = document.createElement('div');
      row.className = 'pokemon-row';
      row.dataset.dex = String(p.dex);
      row.dataset.slug = p.slug;
      row.dataset.sectionId = section.id; // ← CRITICAL
    
      // 2️⃣ SECTION ID — USE sectionBlock, NOT row
      const sectionId = sectionBlock.dataset.sectionId;
    
      // 3️⃣ FIND GAME ENTRY
      const entries = getGameEntries(p, game.id);
      const entry =
        entries.find(e => e.sections?.includes(sectionId)) ??
        entries[0];

      const isAvailable = isAvailableToday(entry);
      if (isAvailable) {
        row.classList.add('is-available-today');
      }
    
      // 4️⃣ AVAILABILITY
      const availableNow = !caught && isPokemonAvailable(entry);

      if (!caught && availableNow && hasTimeOrDayRestriction(entry)) {
       row.classList.add('is-time-gated');
      }
    
      // 5️⃣ APPLY STATE CLASSES
      applyPokemonAvailabilityState(row, caught, availableNow, hasTimeOrDayRestriction(entry));

      const lang = getLanguage();
      const displayName = p.names?.[lang] || p.names?.en || p.slug;
      row.dataset.name = displayName.toLowerCase();
      const baseFamily = p.evolution?.family?.join('|') ?? '';
      row.dataset.family = getStarterLinkedFamily(
        game.id,
        p.slug,
        baseFamily
      );

      const ball = document.createElement('button');
      ball.className = 'caught-toggle';
      ball.style.backgroundImage = `url(./assets/icons/${
        caught ? 'pokeball-full.png' : 'pokeball-empty.png'
      })`;

      ball.addEventListener('click', e => {
        e.stopPropagation();

        if (
          row.classList.contains('is-capacity-locked') ||
          row.classList.contains('is-counterpart-locked') ||
          row.classList.contains('is-duplicate-locked')
        ) return;

        const newState = toggleCaught(game.id, p.dex);

        const key = `oak:${game.id}:primary:${p.dex}`;
        
        if (newState) {
          localStorage.setItem(key, section.id);
        } else {
          localStorage.removeItem(key);
        }
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

      row.addEventListener('click', () => {
        if (row.classList.contains('is-duplicate-locked')) return;
        const app = document.getElementById('app');
        const isActive = row.classList.contains('is-active');
      
        document.querySelectorAll('.pokemon-row.is-active')
          .forEach(r => r.classList.remove('is-active'));
      
        if (isActive) {
          app?.classList.remove('has-detail');
          return;
        }
      
        row.classList.add('is-active');
        setCurrentDetailSelection({
          pokemon: p,
          game: game,
          sectionId: sectionId
        });
        renderPokemonDetail(p, game, sectionId);
        playPokemonCry(p);
        app?.classList.add('has-detail');
      });

      sectionRows.appendChild(row);
    });

    sectionBlock.append(header, sectionRows);
    container.appendChild(sectionBlock);

    updateSectionCounter(sectionBlock);
  });
  // After all sections rendered
    applyMoonStoneLogic(game);
    applyDuplicateLocking(game.id);
    applyStarterExclusivityGlobal(game.id);
}

window.__isPokemonAvailable = isPokemonAvailable;

window.addEventListener('game-time-changed', () => {
  if (!window.__CURRENT_GAME__ || !window.__POKEMON_CACHE__) return;

  document.querySelectorAll('.pokemon-row').forEach(row => {
    const sectionBlock = row.closest('.section-block');
    if (!sectionBlock) return;

    const sectionId = sectionBlock.dataset.sectionId;
    const gameId = sectionBlock.dataset.gameId;

    const pokemon = window.__POKEMON_CACHE__
      .find(p => String(p.dex) === row.dataset.dex);
    if (!pokemon) return;

    const caught = isCaught(gameId, pokemon.dex);

    const entries = getGameEntries(pokemon, normalizeGameId(gameId));
    const entry =
      entries.find(e => e.sections?.includes(sectionId)) ??
      entries[0];

    const availableNow = !caught && isPokemonAvailable(entry);

    applyPokemonAvailabilityState(row, caught, availableNow, hasTimeOrDayRestriction(entry));
    applyDuplicateLocking(window.__CURRENT_GAME__.id);
  });
});

