export const state = {
  game: "gold",
  language: "en",

  time: {
    hour: 12,
    period: "day"
  },

  progress: {
    caught: new Set(),
    shiny: new Set()
  },

  ui: {
    selectedPokemon: null,
    expandedMobileRow: null
  }
};
