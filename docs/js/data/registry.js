const registry = new Map();

export function registerPokemon(pokemon) {
  registry.set(pokemon.slug, pokemon);
}

export function getAllPokemon() {
  return Array.from(registry.values());
}

export const GAME_REGISTRY = [
  {
    genKey: 'gen1',
    games: [
      { id: 'red', labelKey: 'red' },
      { id: 'blue', labelKey: 'blue' },
      { id: 'yellow', labelKey: 'yellow' }
    ]
  },
  {
    genKey: 'gen2',
    games: [
      { id: 'gold', labelKey: 'gold' },
      { id: 'silver', labelKey: 'silver' },
      { id: "crystal_gbc", labelKey: "crystal_gbc" },
      { id: "crystal_vc", labelKey: "crystal_vc" }
    ]
  },
  {
    genKey: 'gen3',
    games: [
      { id: 'firered', labelKey: 'firered' },
      { id: 'leafgreen', labelKey: 'leafgreen' },
      { id: 'firered_switch', labelKey: 'firered_switch' },
      { id: 'leagreen_switch', labelKey: 'leafgreen_switch' }
    ]
  }
];
