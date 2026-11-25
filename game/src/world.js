// The game's rules and state, with no drawing and no browser in it: the chef, the
// counters, cooking, chopping, plating, orders and scoring. step() advances one fixed
// step and returns what happened as bit flags, so the caller can react (sounds,
// announcements) without the world knowing about screens or audio. Nothing here
// allocates after createWorld returns, except the short-lived floater list.
import {
  BOARD, CHOPS_NEEDED, DAY_SECONDS, FIELD, GOAL_COINS, GRILL, INGREDIENTS,
  MAX_ORDERS, ORDERS, PLATE_RETURN, POT, PREP, RECIPE_IDS, RECIPE_STATE,
  RECIPES, REACH, STATIONS, STATE_BURNT, STATE_CHOPPED, STATE_COOKED,
  STATE_RAW, STATE_READY, STATE_SOGGY, STRIKES, CHEF,
} from './config.js';

export const EVENT_PICKUP = 1;
export const EVENT_PLACE = 2;
export const EVENT_CHOP = 4;
export const EVENT_SIZZLE = 8;
export const EVENT_BUBBLE = 16;
export const EVENT_DONE = 32;
export const EVENT_SERVE = 64;
export const EVENT_FAIL = 128;
export const EVENT_EXPIRE = 256;
export const EVENT_TRASH = 512;
export const EVENT_CLICK = 1024;
export const EVENT_TICK = 2048;
export const EVENT_BURNT = 4096;

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function distToRect(x, y, rect) {
  const cx = clamp(x, rect.x, rect.x + rect.w);
  const cy = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - cx;
  const dy = y - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function binRect(index) {
  const s = STATIONS.bins;
  const col = index % s.cols;
  const row = (index / s.cols) | 0;
  return { x: s.x + col * s.cell, y: s.y + row * s.cell, w: s.size, h: s.size };
}

function slotCentres(rect, count) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push({ x: rect.x + (rect.w * (i + 0.5)) / count, y: rect.y + rect.h / 2 });
  }
  return out;
}

function plateMatches(items, recipeId) {
  const needs = RECIPES[recipeId].needs;
  if (items.length !== needs.length) return false;
  const have = {};
  for (const item of items) have[`${item.kind}:${item.state}`] = (have[`${item.kind}:${item.state}`] ?? 0) + 1;
  for (const kind of needs) {
    const key = `${kind}:${RECIPE_STATE[kind]}`;
    if (!have[key]) return false;
    have[key] -= 1;
  }
  return true;
}

export function createWorld(random) {
  const state = {
    chef: { x: 640, y: 470, carrying: null },
    board: { item: null, chops: 0 },
    grill: [{ item: null }, { item: null }],
    pot: [{ item: null }, { item: null }],
    plates: [{ items: [] }, { items: [] }, null, null],
    plateQueue: 0,
    plateTimer: 0,
    orders: [],
    spawnTimer: ORDERS.firstAfter,
    elapsed: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    strikes: 0,
    dishes: 0,
    floaters: [],
    over: false,
    won: false,
    moveTarget: null,
    pendingStation: null,
    nearest: { id: null, slot: -1 },
    lastTick: -1,
    nextOrderId: 1,
  };

  function reset() {
    state.chef.x = 640;
    state.chef.y = 470;
    state.chef.carrying = null;
    state.board.item = null;
    state.board.chops = 0;
    for (const slot of state.grill) slot.item = null;
    for (const slot of state.pot) slot.item = null;
    state.plates = [{ items: [] }, { items: [] }, null, null];
    state.plateQueue = 0;
    state.plateTimer = 0;
    state.orders.length = 0;
    state.spawnTimer = ORDERS.firstAfter;
    state.elapsed = 0;
    state.coins = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.strikes = 0;
    state.dishes = 0;
    state.floaters.length = 0;
    state.over = false;
    state.won = false;
    state.moveTarget = null;
    state.pendingStation = null;
    state.nearest = { id: null, slot: -1 };
    state.lastTick = -1;
    state.nextOrderId = 1;
  }

  function collides(x, y) {
    if (x < 24 || x > FIELD.width - 24 || y < 202 || y > FIELD.height - 12) return true;
    const r = CHEF.radius - 2;
    const hit = (rect) => x > rect.x - r && x < rect.x + rect.w + r && y > rect.y - r && y < rect.y + rect.h + r;
    // The pantry crates stand apart with aisles between them: each is its own block.
    for (let i = 0; i < INGREDIENTS.length; i += 1) if (hit(binRect(i))) return true;
    for (const key of ['board', 'grill', 'pot', 'plates', 'window', 'trash']) {
      if (hit(STATIONS[key])) return true;
    }
    return false;
  }

  function nearestStation() {
    const chef = state.chef;
    let best = { id: null, slot: -1, dist: Infinity };
    const check = (id, rect, slot = -1) => {
      const d = distToRect(chef.x, chef.y, rect);
      if (d < best.dist) best = { id, slot, dist: d };
    };
    // Pantry crates: the nearest crate wins, and it names the ingredient.
    for (let i = 0; i < INGREDIENTS.length; i += 1) check('bins', binRect(i), i);
    check('board', STATIONS.board);
    check('grill', STATIONS.grill);
    check('pot', STATIONS.pot);
    check('plates', STATIONS.plates);
    check('window', STATIONS.window);
    check('trash', STATIONS.trash);
    if (best.dist > REACH) return { id: null, slot: -1 };
    if (best.id === 'grill' || best.id === 'pot' || best.id === 'plates') {
      const rect = STATIONS[best.id];
      const count = best.id === 'plates' ? STATIONS.plates.slots : 2;
      const centres = slotCentres(rect, count);
      let slot = -1;
      let slotDist = Infinity;
      for (let i = 0; i < centres.length; i += 1) {
        const dx = chef.x - centres[i].x;
        const dy = chef.y - centres[i].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < slotDist) { slotDist = d; slot = i; }
      }
      best.slot = slot;
    }
    return { id: best.id, slot: best.slot };
  }

  function isPlate(item) {
    return item !== null && Array.isArray(item.items);
  }

  function interact() {
    const near = state.nearest;
    if (near.id === null) return 0;
    const chef = state.chef;
    let events = 0;

    if (near.id === 'bins') {
      if (chef.carrying !== null) return 0;
      const kind = INGREDIENTS[near.slot];
      const prep = PREP[kind];
      chef.carrying = { kind, state: prep === 'ready' ? STATE_READY : STATE_RAW };
      return EVENT_PICKUP;
    }

    if (near.id === 'board') {
      const board = state.board;
      if (board.item === null) {
        if (chef.carrying !== null && !isPlate(chef.carrying) && PREP[chef.carrying.kind] === 'chop' && chef.carrying.state === STATE_RAW) {
          board.item = chef.carrying;
          board.chops = 0;
          chef.carrying = null;
          return EVENT_PLACE;
        }
        return 0;
      }
      if (chef.carrying === null) {
        if (board.item.state === STATE_CHOPPED) {
          chef.carrying = board.item;
          board.item = null;
          board.chops = 0;
          return EVENT_PICKUP;
        }
        board.chops += 1;
        if (board.chops >= CHOPS_NEEDED) board.item.state = STATE_CHOPPED;
        return EVENT_CHOP;
      }
      return 0;
    }

    if (near.id === 'grill' || near.id === 'pot') {
      const isGrill = near.id === 'grill';
      const slots = isGrill ? state.grill : state.pot;
      const slot = slots[near.slot];
      const want = isGrill ? 'patty' : 'pasta';
      if (slot.item === null) {
        if (chef.carrying !== null && !isPlate(chef.carrying) && chef.carrying.kind === want && chef.carrying.state === STATE_RAW) {
          slot.item = { kind: want, state: STATE_RAW, t: 0 };
          chef.carrying = null;
          return isGrill ? EVENT_SIZZLE : EVENT_BUBBLE;
        }
        return 0;
      }
      if (chef.carrying === null && (slot.item.state === STATE_COOKED || slot.item.state === STATE_BURNT || slot.item.state === STATE_SOGGY)) {
        chef.carrying = { kind: slot.item.kind, state: slot.item.state };
        slot.item = null;
        return EVENT_PICKUP;
      }
      return 0;
    }

    if (near.id === 'plates') {
      const plate = state.plates[near.slot];
      if (chef.carrying !== null && !isPlate(chef.carrying)) {
        if (plate === null) return 0;
        if (plate.items.length >= 4) return 0;
        plate.items.push({ kind: chef.carrying.kind, state: chef.carrying.state });
        chef.carrying = null;
        return EVENT_PLACE;
      }
      if (isPlate(chef.carrying)) {
        if (plate === null) {
          state.plates[near.slot] = chef.carrying;
          chef.carrying = null;
          return EVENT_PLACE;
        }
        return 0;
      }
      if (plate !== null) {
        chef.carrying = plate;
        state.plates[near.slot] = null;
        return EVENT_PICKUP;
      }
      return 0;
    }

    if (near.id === 'window') {
      if (!isPlate(chef.carrying)) return 0;
      const plate = chef.carrying;
      for (let i = 0; i < state.orders.length; i += 1) {
        const order = state.orders[i];
        if (!plateMatches(plate.items, order.recipe)) continue;
        const recipe = RECIPES[order.recipe];
        const tip = Math.round(recipe.value * 0.5 * (order.patience / order.max));
        const bonus = state.combo >= 2 ? 2 : 0;
        const earned = recipe.value + tip + bonus;
        state.coins += earned;
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        state.dishes += 1;
        state.orders.splice(i, 1);
        state.plateQueue += 1;
        state.plateTimer = PLATE_RETURN;
        chef.carrying = null;
        state.floaters.push({ x: STATIONS.window.x + STATIONS.window.w / 2, y: STATIONS.window.y - 14, text: `+${earned}¢`, t: 0, life: 1.3, color: '#f2c94c' });
        if (state.combo >= 3) state.floaters.push({ x: STATIONS.window.x + STATIONS.window.w / 2, y: STATIONS.window.y - 44, text: `COMBO x${state.combo}!`, t: 0, life: 1.3, color: '#ff9a3d' });
        return EVENT_SERVE;
      }
      return EVENT_FAIL;
    }

    if (near.id === 'trash') {
      if (chef.carrying === null) return 0;
      if (isPlate(chef.carrying)) {
        state.plateQueue += 1;
        state.plateTimer = PLATE_RETURN;
      }
      chef.carrying = null;
      return EVENT_TRASH;
    }
    return events;
  }

  function spawnOrder() {
    const progress = clamp(state.elapsed / DAY_SECONDS, 0, 1);
    const recipe = RECIPE_IDS[Math.floor(random() * RECIPE_IDS.length)];
    const max = Math.round(lerp(ORDERS.patienceStart, ORDERS.patienceEnd, progress));
    state.orders.push({ id: state.nextOrderId, recipe, patience: max, max });
    state.nextOrderId += 1;
  }

  function cookSlots(slots, dt, cookTime, goodTime, spoiledState) {
    let events = 0;
    for (const slot of slots) {
      const item = slot.item;
      if (item === null) continue;
      item.t += dt;
      if (item.state === STATE_RAW && item.t >= cookTime) {
        item.state = STATE_COOKED;
        item.t = 0;
        events |= EVENT_DONE;
      } else if (item.state === STATE_COOKED && item.t >= goodTime) {
        item.state = spoiledState;
        events |= EVENT_BURNT;
      }
    }
    return events;
  }

  function step(dt, moveX, moveY, doInteract) {
    if (state.over) return 0;
    let events = 0;
    state.elapsed += dt;

    // Orders arrive, and their patience runs out.
    const progress = clamp(state.elapsed / DAY_SECONDS, 0, 1);
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < MAX_ORDERS) {
      spawnOrder();
      state.spawnTimer = lerp(ORDERS.intervalStart, ORDERS.intervalEnd, progress);
    }
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.strikes += 1;
        state.combo = 0;
        events |= EVENT_EXPIRE;
        if (state.strikes >= STRIKES) {
          state.over = true;
          state.won = false;
        }
      }
    }

    // Cooking advances; a finished dish waits, then spoils.
    events |= cookSlots(state.grill, dt, GRILL.cook, GRILL.good, STATE_BURNT);
    events |= cookSlots(state.pot, dt, POT.cook, POT.good, STATE_SOGGY);

    // A clean plate comes back a little after one is served or trashed.
    if (state.plateQueue > 0) {
      state.plateTimer -= dt;
      if (state.plateTimer <= 0) {
        for (let i = 0; i < state.plates.length; i += 1) {
          if (state.plates[i] === null) {
            state.plates[i] = { items: [] };
            state.plateQueue -= 1;
            state.plateTimer = state.plateQueue > 0 ? PLATE_RETURN : 0;
            break;
          }
        }
      }
    }

    // Urgent orders tick once a second.
    const urgent = state.orders.filter((o) => o.patience <= 10);
    if (urgent.length > 0) {
      const mark = Math.ceil(Math.min(...urgent.map((o) => o.patience)));
      if (mark !== state.lastTick) {
        state.lastTick = mark;
        events |= EVENT_TICK;
      }
    } else {
      state.lastTick = -1;
    }

    // Floaters rise and fade.
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const f = state.floaters[i];
      f.t += dt;
      if (f.t >= f.life) state.floaters.splice(i, 1);
    }

    // Movement: keys steer directly; a click sets a target the chef walks to.
    const chef = state.chef;
    let dx = moveX;
    let dy = moveY;
    if (dx === 0 && dy === 0 && state.moveTarget !== null) {
      const tx = state.moveTarget.x - chef.x;
      const ty = state.moveTarget.y - chef.y;
      const dist = Math.sqrt(tx * tx + ty * ty);
      if (dist < 8) {
        state.moveTarget = null;
        if (state.pendingStation !== null) {
          state.nearest = nearestStation();
          if (state.nearest.id === state.pendingStation) events |= interact();
          state.pendingStation = null;
        }
      } else {
        dx = tx / dist;
        dy = ty / dist;
      }
    } else if (dx !== 0 || dy !== 0) {
      state.moveTarget = null;
      state.pendingStation = null;
    }
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = chef.x + (dx / len) * CHEF.speed * dt;
      const ny = chef.y + (dy / len) * CHEF.speed * dt;
      const beforeX = chef.x;
      const beforeY = chef.y;
      if (!collides(nx, chef.y)) chef.x = nx;
      if (!collides(chef.x, ny)) chef.y = ny;
      // A click target behind a counter can never be reached: give up after
      // pushing against the same spot for a moment instead of forever.
      if (state.moveTarget !== null && chef.x === beforeX && chef.y === beforeY) {
        state.stuckTime = (state.stuckTime ?? 0) + dt;
        if (state.stuckTime > 0.4) {
          state.moveTarget = null;
          state.pendingStation = null;
          state.stuckTime = 0;
        }
      } else {
        state.stuckTime = 0;
      }
    }

    state.nearest = nearestStation();
    if (doInteract) events |= interact();

    if (state.elapsed >= DAY_SECONDS && !state.over) {
      state.over = true;
      state.won = state.coins >= GOAL_COINS;
    }
    return events;
  }

  function setMoveTarget(x, y, stationId) {
    state.moveTarget = { x: clamp(x, 24, FIELD.width - 24), y: clamp(y, 202, FIELD.height - 12) };
    state.pendingStation = stationId;
  }

  reset();
  return { state, reset, step, interact, nearestStation, setMoveTarget, plateMatches };
}
