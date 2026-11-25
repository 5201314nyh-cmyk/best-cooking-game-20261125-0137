// Everything the player sees: the kitchen, the counters, the chef, the orders and
// the screens. All art is drawn with canvas shapes — no image files, no network.
// draw() takes the world state and the screen to show; it never changes the state.
import {
  BOARD, CHEF, DAY_SECONDS, FIELD, FONT, GOAL_COINS, HUD, INGREDIENTS,
  PALETTE, PREP, RECIPES, RECIPE_STATE, STATIONS, STATE_BURNT, STATE_CHOPPED,
  STATE_COOKED, STATE_RAW, STATE_READY, STATE_SOGGY,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const INGREDIENT_NAMES = {
  lettuce: 'Lettuce', tomato: 'Tomato', cucumber: 'Cucumber', mushroom: 'Mushroom',
  bun: 'Bun', patty: 'Patty', cheese: 'Cheese', pasta: 'Pasta', sauce: 'Sauce',
};
const INGREDIENT_SHORT = {
  lettuce: 'Let', tomato: 'Tom', cucumber: 'Cuc', mushroom: 'Mus',
  bun: 'Bun', patty: 'Pat', cheese: 'Chs', pasta: 'Pas', sauce: 'Sau',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function text(ctx, str, x, y, size, color, weight = 700, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient, drawn as a small stylised icon. `state` changes the look: raw,
 *  chopped (a little pile), cooked (golden), burnt or soggy (spoiled). */
export function drawIngredient(ctx, kind, x, y, r, state = STATE_RAW) {
  ctx.save();
  ctx.translate(x, y);
  if (state === STATE_BURNT) {
    ctx.fillStyle = '#241d18';
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.strokeStyle = '#4a4038';
    ctx.lineWidth = 2;
    circle(ctx, 0, 0, r);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (state === STATE_SOGGY) {
    ctx.fillStyle = '#8a7d4a';
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.strokeStyle = '#5d5330';
    ctx.lineWidth = 2;
    circle(ctx, 0, 0, r);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (state === STATE_CHOPPED) {
    // A little pile of three pieces.
    const spots = [[-r * 0.45, r * 0.2], [r * 0.45, r * 0.25], [0, -r * 0.4]];
    for (const [sx, sy] of spots) drawIngredientPiece(ctx, kind, sx, sy, r * 0.55, true);
    ctx.restore();
    return;
  }
  drawIngredientPiece(ctx, kind, 0, 0, r, false);
  if (state === STATE_COOKED) {
    // Golden grill marks over the cooked piece.
    ctx.strokeStyle = 'rgba(90, 50, 10, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.2);
    ctx.lineTo(r * 0.6, r * 0.3);
    ctx.moveTo(-r * 0.6, r * 0.3);
    ctx.lineTo(r * 0.6, -r * 0.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawIngredientPiece(ctx, kind, x, y, r, chopped) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'lettuce') {
    ctx.fillStyle = '#5da83c';
    for (const [ox, oy, rr] of [[-r * 0.4, 0, r * 0.62], [r * 0.4, 0, r * 0.62], [0, -r * 0.35, r * 0.62], [0, r * 0.35, r * 0.62], [0, 0, r * 0.6]]) {
      circle(ctx, ox, oy, rr);
      ctx.fill();
    }
    ctx.fillStyle = '#8fd35f';
    circle(ctx, 0, 0, r * 0.42);
    ctx.fill();
  } else if (kind === 'tomato') {
    ctx.fillStyle = '#e0492f';
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.fillStyle = '#f4705a';
    circle(ctx, -r * 0.3, -r * 0.3, r * 0.45);
    ctx.fill();
    ctx.fillStyle = '#3f8f3a';
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      ctx.lineTo(Math.cos(a) * r * 0.5, -r * 0.7 + Math.sin(a) * r * 0.28);
      ctx.lineTo(Math.cos(a + 0.35) * r * 0.16, -r * 0.7 + Math.sin(a + 0.35) * r * 0.16);
    }
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'cucumber') {
    ctx.fillStyle = '#2f7d32';
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.fillStyle = '#a8d88a';
    circle(ctx, 0, 0, r * 0.72);
    ctx.fill();
    ctx.fillStyle = '#e8f5d8';
    for (const [sx, sy] of [[-r * 0.3, 0], [r * 0.3, 0], [0, -r * 0.3], [0, r * 0.3]]) {
      circle(ctx, sx, sy, r * 0.1);
      ctx.fill();
    }
  } else if (kind === 'mushroom') {
    ctx.fillStyle = '#e8d9b0';
    ctx.fillRect(-r * 0.28, -r * 0.1, r * 0.56, r * 0.85);
    ctx.fillStyle = '#b98a56';
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9b183';
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.6, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'bun') {
    ctx.fillStyle = '#e8b96a';
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(-r * 0.95, r * 0.15, r * 1.9, r * 0.5);
    ctx.fillStyle = '#fff3cf';
    for (const [sx, sy] of [[-r * 0.4, -r * 0.45], [r * 0.1, -r * 0.6], [r * 0.5, -r * 0.3], [-r * 0.05, -r * 0.2]]) {
      circle(ctx, sx, sy, r * 0.09);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = '#7a4a26';
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.fill();
    ctx.fillStyle = '#96603a';
    roundRect(ctx, -r * 0.8, -r * 0.35, r * 1.6, r * 0.6, r * 0.25);
    ctx.fill();
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.lineTo(r, r * 0.7);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a93a';
    for (const [sx, sy] of [[-r * 0.25, r * 0.3], [r * 0.3, r * 0.35], [0, -r * 0.1]]) {
      circle(ctx, sx, sy, r * 0.14);
      ctx.fill();
    }
  } else if (kind === 'pasta') {
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, i * r * 0.55);
      ctx.quadraticCurveTo(0, i * r * 0.55 - r * 0.5, r * 0.8, i * r * 0.55);
      ctx.stroke();
    }
  } else if (kind === 'sauce') {
    ctx.fillStyle = '#c93a22';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.85, r * 0.1, r * 0.55, r * 0.7);
    ctx.quadraticCurveTo(0, r * 1.05, -r * 0.55, r * 0.7);
    ctx.quadraticCurveTo(-r * 0.85, r * 0.1, 0, -r);
    ctx.fill();
    ctx.fillStyle = '#f4705a';
    circle(ctx, -r * 0.25, -r * 0.1, r * 0.28);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, r) {
  ctx.fillStyle = '#ffffff';
  circle(ctx, x, y, r);
  ctx.fill();
  ctx.strokeStyle = '#d8cdb4';
  ctx.lineWidth = 2;
  circle(ctx, x, y, r);
  ctx.stroke();
  ctx.strokeStyle = '#efe7d2';
  circle(ctx, x, y, r * 0.72);
  ctx.stroke();
  if (items.length === 0) return;
  const spots = [[-r * 0.36, -r * 0.2], [r * 0.36, -r * 0.2], [-r * 0.36, r * 0.32], [r * 0.36, r * 0.32]];
  items.forEach((item, i) => {
    const [ox, oy] = spots[i % spots.length];
    drawIngredient(ctx, item.kind, x + ox, y + oy, r * 0.34, item.state);
  });
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 5;
  circle(ctx, x, y, r);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac)));
  ctx.stroke();
}

function counter(ctx, rect, top, trim, label) {
  ctx.fillStyle = PALETTE.counterSide;
  roundRect(ctx, rect.x, rect.y + 10, rect.w, rect.h, 10);
  ctx.fill();
  ctx.fillStyle = top;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h - 10, 10);
  ctx.fill();
  ctx.fillStyle = trim;
  ctx.fillRect(rect.x + 8, rect.y + rect.h - 16, rect.w - 16, 4);
  if (label) text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h - 4, 13, PALETTE.textLight, 700);
}

function actionLabel(state) {
  const near = state.nearest;
  const chef = state.chef;
  if (near.id === null) return null;
  const carrying = chef.carrying;
  const isPlate = carrying !== null && Array.isArray(carrying.items);
  if (near.id === 'bins') {
    if (carrying !== null) return 'Hands full';
    const kind = INGREDIENTS[near.slot];
    return `Pick up ${INGREDIENT_NAMES[kind]}`;
  }
  if (near.id === 'board') {
    if (state.board.item === null) {
      if (carrying !== null && !isPlate && PREP[carrying.kind] === 'chop' && carrying.state === STATE_RAW) return `Place ${INGREDIENT_NAMES[carrying.kind]} to chop`;
      return 'Chopping board';
    }
    if (carrying === null) {
      if (state.board.item.state === STATE_CHOPPED) return `Pick up chopped ${INGREDIENT_NAMES[state.board.item.kind]}`;
      return `Chop! (${state.board.chops}/3)`;
    }
    return 'Chopping board';
  }
  if (near.id === 'grill' || near.id === 'pot') {
    const isGrill = near.id === 'grill';
    const slots = isGrill ? state.grill : state.pot;
    const slot = slots[near.slot];
    const want = isGrill ? 'patty' : 'pasta';
    if (slot.item === null) {
      if (carrying !== null && !isPlate && carrying.kind === want && carrying.state === STATE_RAW) return `Put ${INGREDIENT_NAMES[want]} on the ${isGrill ? 'grill' : 'pot'}`;
      return isGrill ? 'Grill — needs a patty' : 'Pot — needs pasta';
    }
    if (slot.item.state === STATE_COOKED) return `Take the ${isGrill ? 'grilled patty' : 'pasta'} — ready!`;
    if (slot.item.state === STATE_BURNT || slot.item.state === STATE_SOGGY) return 'Take it out — spoiled!';
    return isGrill ? 'Grilling…' : 'Boiling…';
  }
  if (near.id === 'plates') {
    const plate = state.plates[near.slot];
    if (carrying !== null && !isPlate) {
      if (plate === null) return 'No plate here';
      if (plate.items.length >= 4) return 'Plate is full';
      return `Add ${INGREDIENT_NAMES[carrying.kind]} to plate`;
    }
    if (isPlate) {
      if (plate === null) return 'Set the plate down';
      return 'Plate slot taken';
    }
    if (plate !== null) return plate.items.length === 0 ? 'Pick up the empty plate' : 'Pick up the plate';
    return 'Plating counter';
  }
  if (near.id === 'window') {
    if (!isPlate) return 'Serving window — bring a finished plate';
    for (const order of state.orders) {
      if (plateMatches(carrying.items, order.recipe)) return `Serve the ${RECIPES[order.recipe].name}!`;
    }
    return 'No order matches this plate';
  }
  if (near.id === 'trash') {
    if (carrying === null) return 'Trash';
    return 'Throw it away';
  }
  return null;
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

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let lastX = 640;
  let lastY = 470;
  let facing = 1;

  function drawFloor() {
    for (let row = 0; row < 9; row += 1) {
      ctx.fillStyle = row % 2 === 0 ? PALETTE.floorLight : PALETTE.floorDark;
      ctx.fillRect(0, 196 + row * 58, FIELD.width, 58);
      ctx.strokeStyle = PALETTE.floorLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 196 + row * 58);
      ctx.lineTo(FIELD.width, 196 + row * 58);
      ctx.stroke();
      ctx.beginPath();
      for (let x = (row % 2) * 90 + 45; x < FIELD.width; x += 180) {
        ctx.moveTo(x, 196 + row * 58);
        ctx.lineTo(x, 196 + row * 58 + 58);
      }
      ctx.stroke();
    }
    // Tiled wall band behind the top counters.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 196, FIELD.width, 16);
    ctx.fillStyle = PALETTE.wallTile;
    for (let x = 0; x < FIELD.width; x += 32) ctx.fillRect(x, 196, 16, 16);
  }

  function drawBins(state) {
    const s = STATIONS.bins;
    text(ctx, 'PANTRY', s.x + 8, s.y + s.h + 16, 13, PALETTE.text, 800, 'left');
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const col = i % s.cols;
      const row = (i / s.cols) | 0;
      const bx = s.x + col * s.cell;
      const by = s.y + row * s.cell;
      const kind = INGREDIENTS[i];
      const hot = state.nearest.id === 'bins' && state.nearest.slot === i;
      ctx.fillStyle = hot ? '#e8b96a' : '#c49a6b';
      roundRect(ctx, bx, by, s.size, s.size, 8);
      ctx.fill();
      ctx.strokeStyle = hot ? '#fff3d0' : '#8a6420';
      ctx.lineWidth = hot ? 3 : 2;
      roundRect(ctx, bx, by, s.size, s.size, 8);
      ctx.stroke();
      drawIngredient(ctx, kind, bx + s.size / 2, by + s.size / 2 - 10, 15);
      text(ctx, INGREDIENT_SHORT[kind], bx + s.size / 2, by + s.size - 10, 11, '#4a3220', 700);
    }
  }

  function drawBoard(state) {
    const rect = STATIONS.board;
    counter(ctx, rect, PALETTE.boardTop, '#8a6420', 'CHOP');
    ctx.fillStyle = '#d9a441';
    roundRect(ctx, rect.x + 24, rect.y + 12, rect.w - 48, rect.h - 34, 8);
    ctx.fill();
    ctx.fillStyle = '#b9832e';
    roundRect(ctx, rect.x + 24, rect.y + 12, rect.w - 48, 8, 4);
    ctx.fill();
    const item = state.board.item;
    if (item !== null) {
      drawIngredient(ctx, item.kind, rect.x + rect.w / 2 - 30, rect.y + 34, 20, item.state);
      if (item.state !== STATE_CHOPPED) {
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = i < state.board.chops ? '#3f9e4d' : '#ffffff';
          circle(ctx, rect.x + rect.w - 52 + i * 18, rect.y + 34, 6);
          ctx.fill();
          ctx.strokeStyle = '#8a6f4d';
          ctx.lineWidth = 1;
          circle(ctx, rect.x + rect.w - 52 + i * 18, rect.y + 34, 6);
          ctx.stroke();
        }
      } else {
        text(ctx, 'CHOPPED!', rect.x + rect.w - 34, rect.y + 34, 12, '#2e7d32', 800);
      }
    } else {
      text(ctx, 'chop veggies here', rect.x + rect.w / 2, rect.y + 34, 13, '#7a5a28', 600);
    }
  }

  function drawCooker(state, rect, slots, isGrill, label) {
    counter(ctx, rect, isGrill ? PALETTE.grillTop : PALETTE.potTop, PALETTE.counterTrim, label);
    const centres = [];
    for (let i = 0; i < 2; i += 1) centres.push({ x: rect.x + (rect.w * (i + 0.5)) / 2, y: rect.y + 34 });
    slots.forEach((slot, i) => {
      const c = centres[i];
      ctx.fillStyle = isGrill ? '#22252b' : '#2c4a63';
      circle(ctx, c.x, c.y, 30);
      ctx.fill();
      ctx.strokeStyle = '#565e68';
      ctx.lineWidth = 2;
      circle(ctx, c.x, c.y, 30);
      ctx.stroke();
      const item = slot.item;
      if (item !== null) {
        const cookTime = isGrill ? 5 : 6;
        const goodTime = 4;
        if (item.state === STATE_RAW) {
          drawIngredient(ctx, item.kind, c.x, c.y, 18, STATE_RAW);
          progressRing(ctx, c.x, c.y, 36, item.t / cookTime, '#f2c94c');
        } else if (item.state === STATE_COOKED) {
          drawIngredient(ctx, item.kind, c.x, c.y, 18, STATE_COOKED);
          progressRing(ctx, c.x, c.y, 36, 1 - item.t / goodTime, '#3f9e4d');
        } else {
          drawIngredient(ctx, item.kind, c.x, c.y, 18, item.state);
        }
        if (item.state === STATE_RAW) {
          // Steam puffs while it cooks.
          const puff = (state.elapsed * 2 + i) % 1;
          ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - puff)})`;
          circle(ctx, c.x - 8 + i * 6, c.y - 26 - puff * 14, 4 + puff * 3);
          ctx.fill();
        }
      } else {
        text(ctx, isGrill ? 'grill' : 'pot', c.x, c.y, 12, '#8b93a3', 600);
      }
    });
  }

  function drawPlates(state) {
    const rect = STATIONS.plates;
    counter(ctx, rect, PALETTE.plateTop, PALETTE.counterTrim, 'PLATE UP');
    for (let i = 0; i < 4; i += 1) {
      const cx = rect.x + (rect.w * (i + 0.5)) / 4;
      const cy = rect.y + 34;
      const plate = state.plates[i];
      const hot = state.nearest.id === 'plates' && state.nearest.slot === i;
      if (plate === null) {
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        circle(ctx, cx, cy, 30);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        if (hot) {
          ctx.strokeStyle = PALETTE.counterTrim;
          ctx.lineWidth = 3;
          circle(ctx, cx, cy, 34);
          ctx.stroke();
        }
        drawPlate(ctx, plate.items, cx, cy, 30);
      }
    }
  }

  function drawWindow(state) {
    const rect = STATIONS.window;
    const carrying = state.chef.carrying;
    const isPlate = carrying !== null && Array.isArray(carrying.items);
    let match = false;
    if (isPlate) for (const order of state.orders) if (plateMatches(carrying.items, order.recipe)) match = true;
    counter(ctx, rect, PALETTE.windowTop, '#f2c94c', 'SERVE');
    if (match) {
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.3 * Math.sin(state.elapsed * 6);
      ctx.strokeStyle = '#f2c94c';
      ctx.lineWidth = 4;
      roundRect(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 12);
      ctx.stroke();
      ctx.restore();
      text(ctx, 'SERVE IT!', rect.x + rect.w / 2, rect.y + 34, 18, '#ffffff', 800);
    } else {
      // The little service bell.
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + 32, 16, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(rect.x + rect.w / 2 - 20, rect.y + 32, 40, 5);
      circle(ctx, rect.x + rect.w / 2 + 24, rect.y + 38, 3);
      ctx.fill();
      text(ctx, 'ring the bell', rect.x + rect.w / 2, rect.y + 58, 12, '#ffe9c9', 600);
    }
  }

  function drawTrash(state) {
    const rect = STATIONS.trash;
    counter(ctx, rect, PALETTE.trashTop, '#3d4a34', 'TRASH');
    ctx.fillStyle = '#46543c';
    roundRect(ctx, rect.x + rect.w / 2 - 26, rect.y + 14, 52, 44, 8);
    ctx.fill();
    ctx.fillStyle = '#5d6b52';
    ctx.fillRect(rect.x + rect.w / 2 - 30, rect.y + 10, 60, 8);
  }

  function drawChef(state) {
    const chef = state.chef;
    if (Math.abs(chef.x - lastX) > 1) facing = chef.x > lastX ? 1 : -1;
    lastX = chef.x;
    lastY = chef.y;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(chef.x, chef.y + 16, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body with apron.
    ctx.fillStyle = PALETTE.chefBody;
    circle(ctx, chef.x, chef.y, CHEF.radius);
    ctx.fill();
    ctx.fillStyle = PALETTE.chefApron;
    ctx.beginPath();
    ctx.arc(chef.x, chef.y, CHEF.radius - 2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.closePath();
    ctx.fill();
    // Face: eyes look the way he walks.
    ctx.fillStyle = '#2e2118';
    circle(ctx, chef.x + facing * 5 - 4, chef.y - 4, 2.2);
    ctx.fill();
    circle(ctx, chef.x + facing * 5 + 5, chef.y - 4, 2.2);
    ctx.fill();
    ctx.strokeStyle = '#2e2118';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(chef.x + facing * 3, chef.y + 4, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // Toque.
    ctx.fillStyle = PALETTE.chefToque;
    roundRect(ctx, chef.x - 13, chef.y - 32, 26, 16, 7);
    ctx.fill();
    circle(ctx, chef.x - 9, chef.y - 32, 7);
    ctx.fill();
    circle(ctx, chef.x + 9, chef.y - 32, 7);
    ctx.fill();
    circle(ctx, chef.x, chef.y - 35, 8);
    ctx.fill();
    // What he carries rides above his head.
    const carrying = chef.carrying;
    if (carrying !== null) {
      const bob = Math.sin(state.elapsed * 4) * 2;
      if (Array.isArray(carrying.items)) drawPlate(ctx, carrying.items, chef.x, chef.y - 52 + bob, 22);
      else drawIngredient(ctx, carrying.kind, chef.x, chef.y - 52 + bob, 17, carrying.state);
    }
    // Click-to-move target ring.
    if (state.moveTarget !== null) {
      ctx.strokeStyle = 'rgba(46,33,24,0.5)';
      ctx.lineWidth = 2;
      circle(ctx, state.moveTarget.x, state.moveTarget.y, 10);
      ctx.stroke();
      circle(ctx, state.moveTarget.x, state.moveTarget.y, 2);
      ctx.fillStyle = 'rgba(46,33,24,0.5)';
      ctx.fill();
    }
  }

  function drawOrders(state) {
    const board = BOARD;
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, board.x - 8, board.y - 8, board.w + 16, board.h + 16, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    roundRect(ctx, board.x - 8, board.y - 8, board.w + 16, board.h + 16, 12);
    ctx.stroke();
    text(ctx, 'ORDER BOARD', board.x + 8, board.y + 2, 12, PALETTE.muted, 800, 'left');
    if (state.orders.length === 0) {
      text(ctx, 'No orders yet — the lunch rush is coming…', board.x + board.w / 2, board.y + board.h / 2 + 8, 15, PALETTE.muted, 600);
      return;
    }
    state.orders.forEach((order, i) => {
      const recipe = RECIPES[order.recipe];
      const tx = board.x + i * (board.ticketW + board.gap);
      const ty = board.y + 10;
      const frac = Math.max(0, order.patience / order.max);
      const urgent = order.patience <= 12;
      const pulse = urgent ? 1 + 0.04 * Math.sin(state.elapsed * 8) : 1;
      ctx.save();
      ctx.translate(tx + board.ticketW / 2, ty + 36);
      ctx.scale(pulse, pulse);
      ctx.translate(-(tx + board.ticketW / 2), -(ty + 36));
      ctx.fillStyle = urgent ? '#ffe9e2' : '#ffffff';
      roundRect(ctx, tx, ty, board.ticketW, 72, 8);
      ctx.fill();
      ctx.strokeStyle = urgent ? '#d94f3d' : '#d9c9a3';
      ctx.lineWidth = urgent ? 3 : 2;
      roundRect(ctx, tx, ty, board.ticketW, 72, 8);
      ctx.stroke();
      text(ctx, recipe.name, tx + 12, ty + 14, 16, PALETTE.text, 800, 'left');
      text(ctx, `${recipe.value}¢`, tx + board.ticketW - 12, ty + 14, 16, '#b8860b', 800, 'right');
      recipe.needs.forEach((kind, j) => {
        const ix = tx + 24 + j * 44;
        drawIngredient(ctx, kind, ix, ty + 44, 14, RECIPE_STATE[kind]);
      });
      // Patience bar.
      ctx.fillStyle = '#e5d9bd';
      roundRect(ctx, tx + 12, ty + 62, board.ticketW - 24, 6, 3);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? PALETTE.good : frac > 0.25 ? PALETTE.warn : PALETTE.bad;
      roundRect(ctx, tx + 12, ty + 62, (board.ticketW - 24) * frac, 6, 3);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawHud(state, muted) {
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(0, 0, FIELD.width, HUD.h);
    ctx.fillStyle = '#5d4128';
    ctx.fillRect(0, HUD.h - 6, FIELD.width, 6);
    // Day timer.
    const remain = Math.max(0, DAY_SECONDS - state.elapsed);
    const mins = Math.floor(remain / 60);
    const secs = Math.floor(remain % 60);
    circle(ctx, 52, 40, 26);
    ctx.fillStyle = '#f7ecd4';
    ctx.fill();
    ctx.strokeStyle = '#2e2118';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(52, 40);
    ctx.lineTo(52, 22);
    ctx.moveTo(52, 40);
    ctx.lineTo(64, 46);
    ctx.stroke();
    text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, 92, 40, 30, '#fff8ec', 800, 'left');
    text(ctx, 'SHIFT', 92, 66, 12, '#d9b77c', 700, 'left');
    // Goal progress.
    const goalFrac = Math.min(1, state.coins / GOAL_COINS);
    text(ctx, `GOAL ${GOAL_COINS}¢`, 300, 30, 13, '#d9b77c', 700, 'left');
    ctx.fillStyle = '#2e2118';
    roundRect(ctx, 300, 44, 220, 12, 6);
    ctx.fill();
    ctx.fillStyle = goalFrac >= 1 ? PALETTE.good : PALETTE.gold;
    roundRect(ctx, 300, 44, 220 * goalFrac, 12, 6);
    ctx.fill();
    // Coins.
    circle(ctx, 640, 40, 24);
    ctx.fillStyle = PALETTE.gold;
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    circle(ctx, 640, 40, 24);
    ctx.stroke();
    text(ctx, '¢', 640, 41, 24, '#8a6508', 800);
    text(ctx, String(state.coins), 672, 40, 30, '#fff8ec', 800, 'left');
    // Combo.
    if (state.combo >= 2) {
      text(ctx, `COMBO x${state.combo}`, 820, 40, 22, '#ff9a3d', 800, 'left');
    }
    // Strikes as hearts.
    for (let i = 0; i < 3; i += 1) {
      const hx = 1000 + i * 36;
      ctx.fillStyle = i < 3 - state.strikes ? '#e0492f' : 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(hx, 50);
      ctx.bezierCurveTo(hx - 14, 36, hx - 22, 46, hx, 60);
      ctx.bezierCurveTo(hx + 22, 46, hx + 14, 36, hx, 50);
      ctx.fill();
    }
    text(ctx, muted ? 'MUTED (M)' : 'SOUND (M)', 1180, 40, 13, '#d9b77c', 700, 'right');
  }

  function drawHint(state) {
    const label = actionLabel(state);
    if (label === null) return;
    const chef = state.chef;
    ctx.fillStyle = 'rgba(46,33,24,0.85)';
    const w = ctx.measureText(label).width + 90;
    roundRect(ctx, chef.x - w / 2, chef.y + 30, w, 30, 15);
    ctx.fill();
    text(ctx, `E — ${label}`, chef.x, chef.y + 46, 14, '#fff8ec', 700);
  }

  function drawFloaters(state) {
    for (const f of state.floaters) {
      ctx.save();
      ctx.globalAlpha = 1 - f.t / f.life;
      text(ctx, f.text, f.x, f.y - (f.t / f.life) * 36, 24, f.color, 800);
      ctx.restore();
    }
  }

  function dim(ctx) {
    ctx.fillStyle = 'rgba(20,12,6,0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, w, h, 16);
    ctx.stroke();
  }

  function drawTitle(state, best) {
    dim(ctx);
    panel(ctx, 290, 110, 700, 500);
    text(ctx, 'THE GOLDEN LADLE', 640, 168, 52, '#8a5a1d', 900);
    text(ctx, 'a cozy bistro rush', 640, 208, 22, PALETTE.muted, 600);
    // A little plate of the house special.
    drawPlate(ctx, [
      { kind: 'bun', state: STATE_READY }, { kind: 'patty', state: STATE_COOKED },
      { kind: 'lettuce', state: STATE_CHOPPED }, { kind: 'tomato', state: STATE_CHOPPED },
    ], 640, 280, 52);
    text(ctx, 'Cook to order. Serve before the ticket runs out.', 640, 352, 18, PALETTE.text, 600);
    text(ctx, 'WASD / arrows — move     E / Space — use a counter', 640, 392, 16, PALETTE.text, 600);
    text(ctx, 'Click a counter — walk over and use it     P — pause     M — mute', 640, 420, 16, PALETTE.text, 600);
    text(ctx, 'Chop veggies · grill patties · boil pasta · plate it up · serve!', 640, 448, 16, '#8a5a1d', 700);
    text(ctx, `Goal: earn ${GOAL_COINS}¢ in a 3-minute shift. 3 missed orders ends the shift.`, 640, 478, 15, PALETTE.muted, 600);
    if (best > 0) text(ctx, `Best shift: ${best}¢`, 640, 512, 16, '#b8860b', 800);
    const blink = 0.65 + 0.35 * Math.sin(state.elapsed * 4);
    ctx.save();
    ctx.globalAlpha = blink;
    text(ctx, 'Press Enter or click to start', 640, 566, 22, '#8a5a1d', 800);
    ctx.restore();
  }

  function drawPaused() {
    dim(ctx);
    panel(ctx, 440, 280, 400, 160);
    text(ctx, 'PAUSED', 640, 330, 40, '#8a5a1d', 900);
    text(ctx, 'Press P or Esc to keep cooking', 640, 380, 17, PALETTE.muted, 600);
  }

  function drawOver(state, best) {
    dim(ctx);
    panel(ctx, 340, 140, 600, 440);
    const finished = state.won || state.elapsed >= DAY_SECONDS;
    text(ctx, finished ? (state.won ? 'SHIFT COMPLETE!' : 'SHIFT OVER') : 'SHIFT OVER', 640, 196, 44, '#8a5a1d', 900);
    text(ctx, state.won ? 'You beat the goal — the bistro is buzzing!' : state.elapsed >= DAY_SECONDS ? 'The shift ended just short of the goal.' : 'Three orders went cold. The lunch crowd left hungry.', 640, 240, 17, PALETTE.muted, 600);
    text(ctx, `Coins earned: ${state.coins}¢  (goal ${GOAL_COINS}¢)`, 640, 300, 22, PALETTE.text, 700);
    text(ctx, `Dishes served: ${state.dishes}     Best combo: x${state.bestCombo}`, 640, 338, 20, PALETTE.text, 600);
    text(ctx, `Best shift: ${best}¢`, 640, 376, 20, '#b8860b', 800);
    const blink = 0.65 + 0.35 * Math.sin(state.elapsed * 4);
    ctx.save();
    ctx.globalAlpha = blink;
    text(ctx, 'Press R or Enter to cook again', 640, 440, 22, '#8a5a1d', 800);
    ctx.restore();
    if (state.strikes > 0) {
      text(ctx, `Missed orders: ${state.strikes}`, 640, 500, 16, '#d94f3d', 700);
    }
  }

  function draw(state, screen, best, muted) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawFloor();
    drawBins(state);
    drawBoard(state);
    drawCooker(state, STATIONS.grill, state.grill, true, 'GRILL');
    drawCooker(state, STATIONS.pot, state.pot, false, 'POT');
    drawPlates(state);
    drawWindow(state);
    drawTrash(state);
    drawChef(state);
    drawOrders(state);
    drawHud(state, muted);
    drawFloaters(state);
    if (screen === SCREEN_PLAY) drawHint(state);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    if (screen === SCREEN_PAUSED) drawPaused();
    if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw };
}
