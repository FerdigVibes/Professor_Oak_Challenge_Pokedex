// docs/js/state/gameTime.js

const STORAGE_KEY = 'oakChallenge.gameTime';

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];

let gameTime = {
  day: 'mon',
  hour: 12,
  minute: 0,
  meridiem: 'AM',
  dst: false
};

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  try {
    gameTime = { ...gameTime, ...JSON.parse(saved) };
  } catch {}
}

function persistAndNotify() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameTime));
  window.dispatchEvent(
    new CustomEvent('game-time-changed', {
      detail: getGameTime()
    })
  );
}

function advanceOneMinute() {
  gameTime.minute++;

  if (gameTime.minute >= 60) {
    gameTime.minute = 0;
    gameTime.hour++;

    if (gameTime.hour === 12) {
      gameTime.meridiem = gameTime.meridiem === 'AM' ? 'PM' : 'AM';
    } else if (gameTime.hour > 12) {
      gameTime.hour = 1;
    }

    if (gameTime.hour === 12 && gameTime.meridiem === 'AM') {
      const idx = DAYS.indexOf(gameTime.day);
      gameTime.day = DAYS[(idx + 1) % 7];
    }
  }

  persistAndNotify();
}

let clockStarted = false;

export function startGameClock() {
  if (clockStarted) return;
  clockStarted = true;
  setInterval(advanceOneMinute, 60000);
}

export function getGameTime() {
  return { ...gameTime };
}

export function setGameTime(next) {
  gameTime = { ...gameTime, ...next };
  persistAndNotify();
}




