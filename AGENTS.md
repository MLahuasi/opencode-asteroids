# AGENTS.md

## Repo Shape

- Static HTML5 Canvas game: `index.html` loads `game.js` directly; there is no `package.json`, bundler, transpiler, test runner, linter, or CI config in this repo.
- `game.js` is the real source of truth for behavior. README currently overstates features by mentioning power-ups and a shooting star that are not implemented in code.
- UI text and README are Spanish; preserve Spanish player-facing copy unless the task asks otherwise.

## Run And Verify

- Quick manual run: open `index.html` directly in a browser.
- Local server option from README: `npx serve .`, then visit `http://localhost:3000`.
- There are no automated verification commands. For behavior changes, manually check the browser canvas and controls: arrow keys rotate/thrust, Space shoots/restarts after game over.

## Implementation Notes

- Canvas dimensions are fixed in both `index.html` (`800x600`) and `game.js` (`W = 800`, `H = 600`); keep them in sync if resizing.
- Game state is intentionally centralized in top-level globals in `game.js` (`ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state`). Avoid introducing modules or build tooling unless explicitly requested.
- The playfield wraps with `wrap(v, max)`; bullets and asteroids use toroidal movement, while particles do not wrap.
- Asteroid sizes use parallel arrays `RADII`, `SPEEDS`, and `POINTS` indexed by size `1..3`; update all related arrays together when changing asteroid tiers.
