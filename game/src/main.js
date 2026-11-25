// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and shift over.
//
// ?seed=N fixes the order pattern. ?shot=cover|rush|serve|over|title (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURNT, EVENT_BUBBLE, EVENT_CHOP, EVENT_CLICK, EVENT_DONE, EVENT_EXPIRE, EVENT_FAIL, EVENT_PICKUP, EVENT_PLACE, EVENT_SERVE, EVENT_SIZZLE, EVENT_TICK, EVENT_TRASH } from './world.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

// Size the canvas to the window at the field's aspect; the renderer draws in
// logical 1280x720 coordinates and the browser scales it. This runs for the
// game and for the staged screenshot scenes alike.
function resize() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(FIELD.width * scale * dpr);
  canvas.height = Math.round(FIELD.height * scale * dpr);
  canvas.style.width = `${Math.round(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.round(FIELD.height * scale)}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform((canvas.width / FIELD.width), 0, 0, (canvas.height / FIELD.height), 0, 0);
}
window.addEventListener('resize', resize);
resize();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function playEvents(events) {
  if (events & EVENT_PICKUP) audio.pickup();
  if (events & EVENT_PLACE) audio.place();
  if (events & EVENT_CHOP) audio.chop();
  if (events & EVENT_SIZZLE) audio.sizzle();
  if (events & EVENT_BUBBLE) audio.bubble();
  if (events & EVENT_DONE) audio.done();
  if (events & EVENT_SERVE) audio.serve();
  if (events & EVENT_FAIL) audio.fail();
  if (events & EVENT_EXPIRE) audio.expire();
  if (events & EVENT_TRASH) audio.trash();
  if (events & EVENT_CLICK) audio.click();
  if (events & EVENT_TICK) audio.tick();
  if (events & EVENT_BURNT) audio.fail();
}

function runShot(name) {
  const scene = stageShot(name, world);
  window.__game = { world, screen: () => scene.screen };
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, audio.isMuted());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  // Debug handle for automated play-testing: the world and the current screen.
  window.__game = { world, screen: () => screen };

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve orders before their timers run out.');
  }

  function endShift() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Shift over. ${world.state.coins} coins, ${world.state.dishes} dishes served. Best ${best}.`);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const actions = input.takeActions();
    const click = input.takeClick();

    if (actions & ACTION_MUTE) {
      audio.setMuted(!audio.isMuted());
      announce(audio.isMuted() ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_PAUSE && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
    }
    if (actions & ACTION_RESTART && screen === SCREEN_OVER) startGame();
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE) startGame();
      else if (screen === SCREEN_OVER) startGame();
    }
    if (click !== null) {
      audio.unlock();
      if (screen === SCREEN_TITLE) startGame();
      else if (screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_PLAY) world.setMoveTarget(click.x, click.y, click.station);
    }

    if (screen === SCREEN_PLAY) {
      const move = input.move();
      accumulator += elapsed;
      let events = 0;
      let firstStep = true;
      while (accumulator >= STEP) {
        // A one-shot press counts once per frame, not once per catch-up step.
        events |= world.step(STEP, move.x, move.y, firstStep && Boolean(actions & ACTION_INTERACT));
        firstStep = false;
        accumulator -= STEP;
        if (world.state.over) break;
      }
      playEvents(events);
      if (world.state.over) endShift();
    } else if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      // The title and end screens keep their own slow clock for blinking hints.
      world.state.elapsed += elapsed;
    }
    renderer.draw(world.state, screen, best, audio.isMuted());
  }

  // Size the canvas to the window at the field's aspect; the renderer draws in
  // logical 1280x720 coordinates and the browser scales it.
  requestAnimationFrame(frame);
}

if (shot !== null) runShot(shot);
else runGame();
