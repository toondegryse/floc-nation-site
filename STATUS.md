# Status

## Fri 20 Nov 2026 · Day 0 · PM run

- **Done:** T1 site skeleton and brand styles, T2 priming maths (87 tests), T3 home page copy draft, T4 calculator page. Each passed the tester, and T1, T2 and T4 passed security. G1 raised.
- **Doing:** nothing, the run stopped at its 12-worker limit. Next run: T6a (the calculator reads text like "0x14" as the number 20; small fix in `priming.js`), then rerun T6, then raise G2.
- **Needs you:** G0, turn on the preview link. G1, read `COPY.md` and tick it or write `no:` (five short questions at the end, including whether the Facebook link is right).
- **Try it:** once G0 is on, https://toondegryse.github.io/floc-nation-site/calculator.html on your phone. Enter 20 L, 20 °C, American ales: it should say 123.1 g for the batch and 2.03 g per 330 ml bottle. Pick Wheat beer to see the high-pressure note. The formal G2 try-out follows after T6.
- **Risks:**
  - Manrope can't be downloaded from the run's cloud setup (font sites and the npm registry are blocked), so pages load it from Google Fonts for now. It must be self-hosted before G3: either add the Manrope `.woff2` files (500, 600, 800) and `OFL.txt` to `docs/fonts/`, or allow Claude's cloud runs to download from github.com and raw.githubusercontent.com (Manrope's official source). Steps are at the top of `docs/css/site.css`.
  - 4 tests on `main` fail on purpose. They catch the "0x14" bug and pass once T6a is done.

## Fri 20 Nov 2026 · Day 0

- **Done:** project set up. The brief, the board, the crew and the morning run are in place.
- **Next:** the first PM run starts today. It works through the board until something needs Toon, starting with T1, T2 and T3 side by side.
- **Needs you:** G0, turn on the preview link (see `BOARD.md`).
- **Try it:** nothing to try yet.
- **Risks:** none yet.
