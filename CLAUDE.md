# Floc Nation website

A small static website for Floc Nation, Toon's home-brewing brand in Bangkok. Read `PROJECT.md` for the outcomes and `BOARD.md` for the current work.

## How this project runs

- The PM agent runs once every morning. It reads `PROJECT.md`, `BOARD.md` and `STATUS.md`, hands tickets to workers, updates the board and writes `STATUS.md`.
- Workers: `builder`, `tester`, `security`. Their job descriptions are in `.claude/agents/`.
- Toon checks in when he likes. He only approves gates (G0 to G3 in `PROJECT.md`).
- Only the PM moves tickets on `BOARD.md`. Workers report back to the PM.

## Brand

- Name: **Floc Nation**, always spelled without a K (a play on flocculation).
- Social handle everywhere: `flocnationbrew` (Instagram, YouTube, Facebook, TikTok).
- Colours:
  - Navy `#13233A`: text and dark backgrounds
  - Steel blue `#2F5D8A`: sub-brand names, links, rules
  - Copper `#B8741F`: the bottle cap in the logo only
  - Paper `#F3EEE5`: page background
  - Paper border `#D9D1C3`
  - Muted text `#4F5B6B`
- Type: Manrope. ExtraBold (800) for the wordmark and headlines; 500 and 600 for everything else.
- Logo: "FL", then the copper bottle cap as the O (`docs/assets/cap.svg`), then "C". Under it, "NATION" in widely spaced capitals between two thin steel-blue lines.
- Tagline: "Brewed and built in Bangkok".
- Look: professional and calm. Not playful, not kid-like.
- Voice: practical and plain. Talk about real brewing problems and how they get fixed. Short sentences. No hype words.
- Copy stays on the hobby, the automations and the community. No beer sales, prices or legal topics.

## Tech rules

- Plain HTML, CSS and JavaScript. No framework, no build step, no npm dependencies.
- The site lives in `docs/`, which GitHub Pages serves at https://toondegryse.github.io/floc-nation-site/
- Pages: `docs/index.html` (home) and `docs/calculator.html`.
- Calculator maths: `docs/js/priming.js`, an ES module of pure functions with no DOM code.
- Tests: `tests/*.test.js`, run with `npm test` (Node's built-in test runner, no packages).
- Only outside resource allowed: the Manrope font from Google Fonts. Nothing else loads from other sites.
- Every page keeps `<meta name="robots" content="noindex">` until gate G3 is approved.
- Mobile first: everything must work at 360 px wide.
- No personal details anywhere on the site: no personal names, addresses, phone numbers or personal email addresses.
