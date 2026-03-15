// docs/js/ui/mapModal.js

import { LOCATION_REGISTRY } from '../../data/maps/locations.js';

const MAP_IMAGES = {
  johto: './assets/maps/johto.png',
  kanto: './assets/maps/kanto.png',
  seviiislands: './assets/maps/seviiislands.png'
};

export function openMap({ gameId, locations }) {
  const modal = document.getElementById('map-modal');
  const container = document.querySelector('.map-container');

  container.innerHTML = '';

  const maps = {};

  locations.forEach(locationName => {
    const entryKey = Object.keys(LOCATION_REGISTRY)
      .find(k => k.endsWith(`:${locationName}`));

    const data = LOCATION_REGISTRY[entryKey];
    if (!data) return;

    const mapKey = data.map || 'kanto';

    if (!maps[mapKey]) maps[mapKey] = [];
    maps[mapKey].push({ locationName, data });
  });

  Object.entries(maps).forEach(([mapKey, entries]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'map-wrapper';

    const img = document.createElement('img');
    img.className = 'map-image';
    img.src = MAP_IMAGES[mapKey];

    const pinsContainer = document.createElement('div');
    pinsContainer.className = 'map-pins';

    entries.forEach(({ data }) => {
      const pin = document.createElement('div');
      pin.className = 'map-pin glow';
      pin.style.left = `${data.x}%`;
      pin.style.top = `${data.y}%`;
      pinsContainer.appendChild(pin);
    });

    wrapper.appendChild(img);
    wrapper.appendChild(pinsContainer);
    container.appendChild(wrapper);
  });

  modal.classList.remove('hidden');
}

function getMapForGame(gameId) {
  const id = gameId.toLowerCase();

  if (id.startsWith('gold') || id.startsWith('silver') || id.startsWith('crystal')) {
    return 'johto';
  }
  return 'kanto';
}

function closeMap() {
  document.getElementById('map-modal')?.classList.add('hidden');
}

document.addEventListener('click', e => {
  const modal = document.getElementById('map-modal');
  if (!modal || modal.classList.contains('hidden')) return;

  if (e.target.closest('.map-button')) return;

  const container = modal.querySelector('.map-container');

  if (e.target.closest('.map-close')) {
    closeMap();
    return;
  }

  if (container && !container.contains(e.target)) {
    closeMap();
  }
});
