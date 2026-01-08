import { state } from "./state.js";
import { getTimePeriod } from "./time.js";

export function loadState() {
  const hour = localStorage.getItem("timeHour");
  if (hour !== null) {
    state.time.hour = Number(hour);
    state.time.period = getTimePeriod(state.time.hour);
  }
}

export function saveTime(hour) {
  localStorage.setItem("timeHour", hour);
}
