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
- Type: Manrope for Latin text. ExtraBold (800) for headlines; 500 and 600 for everything else. Two exceptions also use 800 (Toon, Sat 28 Nov): the calculator's result figures and the footer tagline. Thai text uses Noto Sans Thai at the same weights (Manrope has no Thai letters). The badge lettering is artwork, not a font.
- Tagline: "Brewed and built in Bangkok".
- Look: professional and calm, like the badge. Not playful, not kid-like.
- Voice: practical and plain. Talk about real brewing problems and how they get fixed. Short sentences. No hype words.
- Copy stays on the hobby, the automations and the community. No beer sales, prices or legal topics.
- Social profiles use the same badge, colours, tagline and bio on every channel. The kit lives in `brand/social/`.

## Tech rules

- Plain HTML, CSS and JavaScript. No framework, no build step, no npm dependencies.
- The site lives in `docs/`, which GitHub Pages serves at https://toondegryse.github.io/floc-nation-site/
- Pages: `docs/index.html` (home) and `docs/calculator.html`, with Thai versions in `docs/th/` (`docs/th/index.html`, `docs/th/calculator.html`).
- Languages: the site is Thai and English. On the preview, English is the default and Thai is one tap away; every page links to its other-language twin and sets `lang` correctly. At go-live (gate G3) Thai becomes the default and all Floc Nation communication is Thai first (site, social bios, posts). Thai text ships only after a native speaker Toon chooses has checked it (the Thai check gate).
- Words: each page's own text is in its HTML, English in `docs/` and Thai in `docs/th/`, with the same elements and ids. Text the calculator writes while you type is in `docs/js/i18n.js` (English and Thai), and the beer style guides in `docs/js/styles.js` (both languages). Every Thai string is listed next to its English one in `THAI.md`; change both together (the tests check this).
- Calculator maths: `docs/js/priming.js`, an ES module of pure functions with no DOM code.
- Tests: `tests/*.test.js`, run with `npm test` (Node's built-in test runner, no packages).
- Nothing loads from other sites. Manrope and Noto Sans Thai (both free under the SIL Open Font Licence) are self-hosted in `docs/fonts/` with their licence files. If the font files can't be downloaded yet, loading them from Google Fonts is allowed on the preview only. They must be self-hosted before gate G3.
- Every page keeps `<meta name="robots" content="noindex">` until gate G3 is approved.
- Mobile first: everything must work at 360 px wide.
- No personal details anywhere on the site: no personal names, addresses, phone numbers or personal email addresses.
