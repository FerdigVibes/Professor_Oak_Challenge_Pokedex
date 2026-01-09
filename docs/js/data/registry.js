const registry = new Map();

export function registerPokemon(pokemon) {
  registry.set(pokemon.slug, pokemon);
}

export function getAllPokemon() {
  return Array.from(registry.values());
}

export const GAME_REGISTRY = [
  {
    generation: 1,
    label: 'Generation I',
    games: [
      { id: 'red',    label: 'Red',    total: 124 },
      { id: 'blue',   label: 'Blue',   total: 124 },
      { id: 'yellow', label: 'Yellow', total: 124 }
    ]
  },
  {
    generation: 2,
    label: 'Generation II',
    games: [
      { id: 'gold',    label: 'Gold',    total: 251 },
      { id: 'silver',  label: 'Silver',  total: 251 },
      { id: 'crystal', label: 'Crystal', total: 251 }
    ]
  }
];
