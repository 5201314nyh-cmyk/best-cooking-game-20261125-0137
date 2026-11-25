# The Golden Ladle — Bistro Rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/5201314nyh-cmyk/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/5201314nyh-cmyk/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A cozy bistro rush: you are the only cook in The Golden Ladle. Orders land on the board, you run the kitchen — chop vegetables, grill patties, boil pasta, plate dishes up and serve them before their tickets run out. A complete, original cooking game that plays offline in a desktop browser from static files.

Built for the [best-cooking-game-20261125-0137 bounty on make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137).

## How to play

- **WASD / arrow keys** — move the chef. **Click a counter** — walk over and use it.
- **E / Space** — pick up, place, chop, take from the grill or pot, add to a plate, serve.
- **P / Esc** — pause. **M** — mute. **R** — cook again after a shift ends.

Chop lettuce, tomato, cucumber and mushroom on the board (3 chops each). Grill patties (5 s, then they burn). Boil pasta (6 s, then it goes soggy). Bun, cheese and sauce go straight on the plate. Build the dish on a plate, carry it to the serving window and ring the bell. Serve fast for a tip; serve three in a row for a combo bonus. Three missed orders — or the end of the 3-minute shift — ends the day. Earn 120¢ to beat the goal.

## Menu

- **Ember Burger** — bun + grilled patty + chopped lettuce + chopped tomato · 18¢
- **Garden Salad** — chopped lettuce + chopped tomato + chopped cucumber · 14¢
- **Forest Pasta** — boiled pasta + chopped mushroom + sauce · 16¢
- **Melty Melt** — bun + cheese + chopped tomato · 12¢

## Run it

```bash
node serve.ts   # serves game/ on http://localhost:8080
```

Node 22. No build step, no network requests, no libraries — all art is drawn in canvas and all sounds are synthesised with WebAudio.

## Files

- `main.ts` — entrypoint: copies `game/` and `screenshots/` to the output dir and writes `dossier.json`.
- `game/src/world.js` — the rules: chef, counters, cooking, orders, scoring.
- `game/src/render.js` — everything drawn: kitchen, food, chef, order board, screens.
- `game/src/input.js` — keyboard and pointer input.
- `game/src/audio.js` — synthesised sound effects.
- `game/src/shots.js` — the staged screenshot scenes.
- `game/src/config.js` — tuning, recipes, layout, palette.
- `vendor/makefun-game.ts` — vendored kit library (byte-for-byte from the kit).

---

Entered on [make.fun](https://make.fun/?ref=75k23xv8&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards
