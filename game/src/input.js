// Keyboard and pointer input. Held keys give a steering vector; one-shot presses
// (interact, start, pause, mute, restart) are queued as bit flags and taken once by
// the loop, so a press between two frames is never lost and never counted twice.
// A mouse click sets a walk target in kitchen coordinates; a click on a counter
// also asks the chef to use that counter when he gets there.
import { FIELD, INGREDIENTS, STATIONS } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const INTERACT = new Set(['KeyE', 'Space']);
const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);

function stationAt(x, y) {
  // Pantry crates stand apart: a click on a crate names it, a click in an aisle does not.
  const bins = STATIONS.bins;
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    const col = i % bins.cols;
    const row = (i / bins.cols) | 0;
    const bx = bins.x + col * bins.cell;
    const by = bins.y + row * bins.cell;
    if (x >= bx - 24 && x <= bx + bins.size + 24 && y >= by - 24 && y <= by + bins.size + 24) return 'bins';
  }
  for (const key of ['board', 'grill', 'pot', 'plates', 'window', 'trash']) {
    const r = STATIONS[key];
    if (x >= r.x - 30 && x <= r.x + r.w + 30 && y >= r.y - 30 && y <= r.y + r.h + 30) return key;
  }
  return null;
}

export function createInput(canvas) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let actions = 0;
  let click = null;

  function toKitchen(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (INTERACT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_INTERACT;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    up = false;
    down = false;
    left = false;
    right = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toKitchen(event);
    click = { x: point.x, y: point.y, station: stationAt(point.x, point.y) };
  });

  return {
    /** Steering vector from the held keys, each component -1, 0 or 1. */
    move() {
      return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0) };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The latest click's kitchen point (and the counter it hit, if any), once. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
