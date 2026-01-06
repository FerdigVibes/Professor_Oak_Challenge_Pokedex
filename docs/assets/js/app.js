import { loadState } from "./storage.js";
import { renderApp } from "./render.js";

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderApp();
});
