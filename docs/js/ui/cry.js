// docs/js/ui/cry.js
// Centralized Pokémon cry playback

let currentAudio = null;

export function playPokemonCry(pokemon) {
  if (!pokemon?.dex || !pokemon?.slug) return;

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
