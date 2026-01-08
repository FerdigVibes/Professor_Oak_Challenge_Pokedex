const registry = new Map();

export function registerPokemon(pokemon) {
  registry.set(pokemon.slug, pokemon);
}

export function getAllPokemon() {
  return Array.from(registry.values());
}
