// The screenshot scenes behind ?shot=cover|rush|serve|title. Each one builds a state
// the real game actually reaches — the same world, the same renderer, the same rules —
// by placing orders, food and the chef where a real shift would have them, so the
// frame is what a short game really looks like and the same seed always gives the
// same frame.
import { STATE_BURNT, STATE_CHOPPED, STATE_COOKED, STATE_RAW, STATE_READY } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function order(id, recipe, patience, max) {
  return { id, recipe, patience, max };
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the
 * best score to show. Any other name is the title scene.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'cover') {
    state.elapsed = 89;
    state.coins = 47;
    state.combo = 2;
    state.bestCombo = 2;
    state.orders.push(order(1, 'burger', 42, 70), order(2, 'salad', 28, 65), order(3, 'pasta', 55, 70));
    state.grill[0].item = { kind: 'patty', state: STATE_RAW, t: 3.2 };
    state.grill[1].item = { kind: 'patty', state: STATE_COOKED, t: 1.1 };
    state.pot[0].item = { kind: 'pasta', state: STATE_RAW, t: 4.5 };
    state.board.item = { kind: 'tomato', state: STATE_RAW };
    state.board.chops = 2;
    state.plates[0] = { items: [{ kind: 'bun', state: STATE_READY }, { kind: 'patty', state: STATE_COOKED }] };
    state.plates[1] = { items: [{ kind: 'lettuce', state: STATE_CHOPPED }] };
    state.chef.x = 640;
    state.chef.y = 540;
    state.chef.carrying = { kind: 'lettuce', state: STATE_CHOPPED };
    state.nearest = world.nearestStation();
    return { screen: SCREEN_PLAY, best: 47 };
  }
  if (name === 'rush') {
    state.elapsed = 150;
    state.coins = 96;
    state.combo = 4;
    state.bestCombo = 5;
    state.orders.push(
      order(1, 'burger', 9, 60), order(2, 'salad', 15, 60),
      order(3, 'pasta', 33, 65), order(4, 'melt', 48, 65),
    );
    state.grill[0].item = { kind: 'patty', state: STATE_RAW, t: 4.6 };
    state.grill[1].item = { kind: 'patty', state: STATE_RAW, t: 1.2 };
    state.pot[0].item = { kind: 'pasta', state: STATE_COOKED, t: 0.8 };
    state.board.item = { kind: 'mushroom', state: STATE_CHOPPED };
    state.board.chops = 3;
    state.plates[0] = { items: [{ kind: 'bun', state: STATE_READY }, { kind: 'cheese', state: STATE_READY }] };
    state.plates[1] = { items: [] };
    state.chef.x = 790;
    state.chef.y = 330;
    state.chef.carrying = { kind: 'patty', state: STATE_COOKED };
    state.nearest = world.nearestStation();
    return { screen: SCREEN_PLAY, best: 96 };
  }
  if (name === 'serve') {
    state.elapsed = 120;
    state.coins = 83;
    state.combo = 3;
    state.bestCombo = 3;
    state.dishes = 5;
    state.orders.push(order(1, 'burger', 30, 65), order(2, 'salad', 40, 65));
    state.grill[0].item = { kind: 'patty', state: STATE_BURNT, t: 0 };
    state.pot[0].item = { kind: 'pasta', state: STATE_RAW, t: 2.0 };
    state.plates[0] = { items: [{ kind: 'pasta', state: STATE_COOKED }, { kind: 'mushroom', state: STATE_CHOPPED }] };
    state.plates[1] = { items: [] };
    state.chef.x = 1110;
    state.chef.y = 540;
    state.chef.carrying = {
      items: [
        { kind: 'bun', state: STATE_READY }, { kind: 'patty', state: STATE_COOKED },
        { kind: 'lettuce', state: STATE_CHOPPED }, { kind: 'tomato', state: STATE_CHOPPED },
      ],
    };
    state.floaters.push({ x: 1110, y: 560, text: '+21¢', t: 0.2, life: 1.3, color: '#f2c94c' });
    state.nearest = world.nearestStation();
    return { screen: SCREEN_PLAY, best: 83 };
  }
  if (name === 'over') {
    state.elapsed = 180;
    state.coins = 132;
    state.combo = 0;
    state.bestCombo = 6;
    state.dishes = 9;
    state.strikes = 1;
    state.over = true;
    state.won = true;
    return { screen: SCREEN_OVER, best: 132 };
  }
  // Title: a quiet kitchen before the shift starts.
  state.orders.push(order(1, 'salad', 60, 70));
  return { screen: SCREEN_TITLE, best: 0 };
}
