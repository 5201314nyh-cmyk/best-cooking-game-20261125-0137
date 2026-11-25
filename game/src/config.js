// Every tuning number, colour and layout rect in one place. The kitchen is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One shift lasts three minutes; the day timer counts down from here. */
export const DAY_SECONDS = 180;

/** Coins the shift aims for; hitting it is a win, missing it is not a loss. */
export const GOAL_COINS = 120;

/** Strikes before the shift ends early. */
export const STRIKES = 3;

export const CHEF = { radius: 18, speed: 275 };

/** How close the chef must be to a counter's edge to use it. */
export const REACH = 62;

/** Seconds a patty spends on the grill, and how long it stays good after that. */
export const GRILL = { cook: 5, good: 4 };
/** Seconds pasta spends in the pot, and how long it stays good after that. */
export const POT = { cook: 6, good: 4 };
/** Chops that turn a raw vegetable into a chopped one. */
export const CHOPS_NEEDED = 3;
/** Seconds after a plate is served (or trashed) before a clean one returns. */
export const PLATE_RETURN = 2.5;
/** Orders on the board at once, at most. */
export const MAX_ORDERS = 4;

/** Ingredient kinds, in bin order (3 columns x 3 rows, left wall). */
export const INGREDIENTS = [
  'lettuce', 'tomato', 'cucumber',
  'mushroom', 'bun', 'patty',
  'cheese', 'pasta', 'sauce',
];

/** What each ingredient needs before it can go on a plate. */
export const PREP = {
  lettuce: 'chop', tomato: 'chop', cucumber: 'chop', mushroom: 'chop',
  patty: 'grill', pasta: 'boil',
  bun: 'ready', cheese: 'ready', sauce: 'ready',
};

/** Item states an ingredient can be in. */
export const STATE_RAW = 'raw';
export const STATE_CHOPPED = 'chopped';
export const STATE_COOKED = 'cooked';
export const STATE_READY = 'ready';
export const STATE_BURNT = 'burnt';
export const STATE_SOGGY = 'soggy';

/** The state a recipe wants each ingredient in. */
export const RECIPE_STATE = {
  lettuce: STATE_CHOPPED, tomato: STATE_CHOPPED, cucumber: STATE_CHOPPED,
  mushroom: STATE_CHOPPED, patty: STATE_COOKED, pasta: STATE_COOKED,
  bun: STATE_READY, cheese: STATE_READY, sauce: STATE_READY,
};

/** The menu: each dish lists the ingredients it needs, one of each, and its price. */
export const RECIPES = {
  burger: {
    name: 'Ember Burger',
    needs: ['bun', 'patty', 'lettuce', 'tomato'],
    value: 18,
    blurb: 'Flame-grilled patty, garden fresh',
  },
  salad: {
    name: 'Garden Salad',
    needs: ['lettuce', 'tomato', 'cucumber'],
    value: 14,
    blurb: 'Crisp, cool and chopped to order',
  },
  pasta: {
    name: 'Forest Pasta',
    needs: ['pasta', 'mushroom', 'sauce'],
    value: 16,
    blurb: 'Silky pasta, wild mushrooms',
  },
  melt: {
    name: 'Melty Melt',
    needs: ['bun', 'cheese', 'tomato'],
    value: 12,
    blurb: 'Golden bun, gooey cheese',
  },
};
export const RECIPE_IDS = ['burger', 'salad', 'pasta', 'melt'];

/** Order pacing: first order after 2 s, then a new one every interval (which shrinks
 *  as the shift goes on); patience starts generous and tightens the same way. */
export const ORDERS = {
  firstAfter: 2,
  intervalStart: 14,
  intervalEnd: 9,
  patienceStart: 70,
  patienceEnd: 55,
};

/** Counter rectangles. Bins are nine separate crates on the left wall, with aisles
 *  between them so the chef can walk up to any one; the board, grill and pot sit
 *  along the top; the plating counter and serving window along the bottom; trash
 *  bottom-left. */
export const STATIONS = {
  // Nine crates in three rows with wide aisles (94px) between them, so the
  // chef can walk up to any crate: the aisle bands are y 304-334 and 454-484
  // for the chef's centre. The board sits right of the pantry with a
  // walkable corridor between them (the pantry's right edge is 396, the
  // board starts at 480).
  bins: { x: 40, y: 216, w: 356, h: 356, cols: 3, cell: 150, size: 56 },
  // The chopping board sits right of the pantry with a walkable corridor
  // between them (the pantry's right edge is 396, the board starts at 480),
  // so the chef can slip into the pantry aisles from the floor.
  board: { x: 480, y: 216, w: 220, h: 88 },
  grill: { x: 720, y: 216, w: 220, h: 88, slots: 2 },
  pot: { x: 980, y: 216, w: 260, h: 88, slots: 2 },
  plates: { x: 400, y: 600, w: 520, h: 88, slots: 4 },
  window: { x: 980, y: 600, w: 260, h: 88 },
  trash: { x: 40, y: 600, w: 200, h: 88 },
};

/** The order board strip, below the HUD. */
export const BOARD = { x: 40, y: 104, w: 1200, h: 92, ticketW: 288, gap: 16 };
export const HUD = { h: 96 };

export const PALETTE = {
  floorLight: '#c98f4e',
  floorDark: '#bd8143',
  floorLine: '#a96f35',
  wall: '#f3e3c2',
  wallTile: '#e8d3a8',
  counterTop: '#8f9aa6',
  counterSide: '#6e7883',
  counterTrim: '#d9a441',
  boardTop: '#e8b04b',
  grillTop: '#3a3f47',
  potTop: '#4a6b8a',
  plateTop: '#f7f3ea',
  windowTop: '#c96f4a',
  trashTop: '#5d6b52',
  text: '#2e2118',
  textLight: '#fff8ec',
  muted: '#8a6f4d',
  panel: '#fff6e3',
  panelEdge: '#d9b77c',
  good: '#3f9e4d',
  warn: '#e8a13a',
  bad: '#d94f3d',
  gold: '#f2c94c',
  chefBody: '#f6ead6',
  chefApron: '#3f6fb5',
  chefToque: '#ffffff',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best shift total is kept between visits (this browser only). */
export const BEST_KEY = 'golden-ladle.best';
