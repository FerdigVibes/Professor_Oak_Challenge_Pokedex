// docs/js/ui/cry.js


import { isMuted } from '../state/audio.js';

let currentAudio = null;

export function playPokemonCry(pokemon) {
  if (!pokemon?.dex || !pokemon?.slug) return;

  if (isMuted()) return;

  const dex = String(pokemon.dex).padStart(3, '0');
  const src = `./assets/cries/${dex}-${pokemon.slug}.ogg`;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  const audio = new Audio(src);
  currentAudio = audio;

  audio.volume = 0.5;
  audio.play().catch(err => {
    console.warn('Cry playback blocked:', err);
  });
}
