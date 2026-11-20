# Floc Nation website

A small static website for Floc Nation, Toon's home-brewing brand in Bangkok. Read `PROJECT.md` for the outcomes. The current work lives on the Trello board "Floc Nation website": https://trello.com/b/bFug8tRw/floc-nation-website

## How this project runs

- The PM agent runs every morning, and whenever Toon starts it. It reads `PROJECT.md`, `STATUS.md` and the Trello board, then keeps handing tickets to workers until something needs Toon. It updates the board and writes `STATUS.md`.
- Each run works in this repo and on the "Floc Nation website" Trello board only. It uses the Trello connector for that board and nothing else: no other boards and none of Toon's other connected apps. It never posts, publishes or messages anything outside these two.
- Workers: `builder`, `tester`, `security`. Their job descriptions are in `.claude/agents/`.
- Toon checks in when he likes. He only approves gates (G0 to G3 in `PROJECT.md`), on their cards in the board's "Needs you" list.
- Only the PM moves ticket cards on the Trello board. Workers never touch Trello; they report back to the PM.

## Brand

The site must match the identity already used on the social channels: the "three hops" badge that is the profile picture on Instagram, TikTok and Facebook (chosen by Toon on the "Floc Nation logo" canvas, Direction 3). The earlier copper bottle-cap logo is retired.

- Name: **Floc Nation**, always spelled without a K (a play on flocculation).
- Social handle everywhere: `flocnationbrew` (Instagram, YouTube, Facebook, TikTok).
- Logo: the three-hops badge, `docs/assets/floc-nation-badge.svg` (source copy in `brand/logo/`). Three teal hop cones above a navy banner, "FLOC" in white, "NATION" in sky. Use the file as it is: never redraw, recolour, stretch, crop or add to it. Give it clear space of at least a quarter of its height on every side.
- Colours (taken from the badge):
  - Navy `#022C54`: text, header and footer backgrounds, dark panels
  - Hop teal `#06929E`: accents, rules, icons, and text 24 px or larger on white
  - Deep teal `#06727B`: links and small accent text on white
  - Sky `#2BACC7`: accents and links on navy only (too light for text on white)
  - White `#FDFDFD`: page background, text on navy
  - Pale blue `#EEF4F8`: cards and panels on the white page
  - Line `#D5DEE6`: borders and dividers (decoration only)
  - Muted text `#4F5B6B`: secondary text on white or pale blue
- Type: Manrope. ExtraBold (800) for headlines; 500 and 600 for everything else. The badge lettering is artwork, not a font.
- Tagline: "Brewed and built in Bangkok".
- Look: professional and calm, like the badge. Not playful, not kid-like.
- Voice: practical and plain. Talk about real brewing problems and how they get fixed. Short sentences. No hype words.
- Copy stays on the hobby, the automations and the community. No beer sales, prices or legal topics.
- Social profiles use the same badge, colours, tagline and bio on every channel. The kit lives in `brand/social/`.

## Tech rules

- Plain HTML, CSS and JavaScript. No framework, no build step, no npm dependencies.
- The site lives in `docs/`, which GitHub Pages serves at https://toondegryse.github.io/floc-nation-site/
- Pages: `docs/index.html` (home) and `docs/calculator.html`.
- Calculator maths: `docs/js/priming.js`, an ES module of pure functions with no DOM code.
- Tests: `tests/*.test.js`, run with `npm test` (Node's built-in test runner, no packages).
- Nothing loads from other sites. Manrope (free under the SIL Open Font Licence) is self-hosted in `docs/fonts/` with its licence file. If the font files can't be downloaded yet, loading Manrope from Google Fonts is allowed on the preview only. It must be self-hosted before gate G3.
- Every page keeps `<meta name="robots" content="noindex">` until gate G3 is approved.
- Mobile first: everything must work at 360 px wide.
- No personal details anywhere on the site: no personal names, addresses, phone numbers or personal email addresses.
