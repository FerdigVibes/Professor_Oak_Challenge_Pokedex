// docs/js/ui/cry.js
// Centralized Pokémon cry playback (mute-aware)

import { isMuted } from '../state/audio.js';

let currentAudio = null;

export function playPokemonCry(pokemon) {
  // Safety guard
  if (!pokemon?.dex || !pokemon?.slug) return;

  // Respect mute toggle
  if (isMuted()) return;

  const dex = String(pokemon.dex).padStart(3, '0');
  const src = `./assets/cries/${dex}-${pokemon.slug}.ogg`;

  // Stop any currently playing cry
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  const audio = new Audio(src);
  currentAudio = audio;

  audio.volume = 0.7; // safe default
  audio.play().catch(err => {
    // Autoplay policies can block; this is expected sometimes
    console.warn('Cry playback blocked:', err);
  });
}
