# Status

## Fri 20 Nov 2026 · Day 0 · PM run (scheduled, started 14:28)

- **Done:** T6a passed review (tester and security), in step with the run you started. The calculator test pass (T6) ran again: everything passes except one small case, its second fail, so it is parked for your call. Tests: 359, 0 fail, 4 todo.
- **Doing:** nothing, waiting on you. The home page waits on G1, and the rest waits on the home page, T6 or G2.
- **Needs you:**
  - T6: if the CO2 target typed is exactly the CO2 already in the beer (for example 0.8614872 at 20 °C), the page shows 0.0 g but not the "No sugar needed" note. The cause is a rounding error inside the computer; the grams are right. Approve to have the builder fix it next run (a one-line change), or answer `no: leave it` to accept it. Either way, G2 (try the calculator on your phone) comes next.
  - The scheduled run still isn't allowed to use connected apps, so it can't read or move the Trello cards. Update the scheduled task to allow the Trello board, or say the board should come back to `BOARD.md`. Until then, answer gates and T6 in a chat with Claude.
  - G0 (preview link) and G1 (read `COPY.md`) are still open.
- **Try it:** nothing new. The calculator link from the morning entry works once G0 is on.
- **Risks:**
  - Manrope still can't be downloaded from the run's cloud setup (checked again: GitHub, Google's font servers and npm are all blocked). It must be self-hosted before G3; the options are in the morning entry.
  - 4 tests are marked "todo": 2 older known gaps, and the 2 new checks for the T6 case, which switch back on once you decide.
  - Two PM runs worked at the same time again; this run merged the other run's Trello move and tests by hand, keeping both.
- **Board updates to apply** (this run couldn't use Trello):
  - T6 · Calculator test pass: move to "Needs you", comment "Failed review twice (Fri 20 Nov, tester). Only fail: a target exactly at the residual CO2 misses the no-sugar note. Approve to have it fixed, or `no: leave it`." 9 tests added; the 2 for this case are marked todo.
  - T7 · Phone and accessibility check: comment "Seen in the T6 second run (fallback font, calculator only): no sideways scroll at 360 or 320 px, a logical Tab order, reference case 1 works with the keyboard alone."
  - T9 · Calculator ready for Toon to try: comment "Waits on the T6 decision."

## Fri 20 Nov 2026 · Day 0 · PM run (started by Toon)
- **Done:** T6a: number fields no longer read "0x14" as 20, and long pasted text can't freeze the page. Tester and security both pass. The ticket board moved to Trello: https://trello.com/b/bFug8tRw/floc-nation-website (`BOARD.md` now points there).
- **Doing:** T6 calculator test rerun, being handled by the parallel PM run that started at 14:28.
- **Needs you:** G0 (preview link) and G1 (read `COPY.md`), now as cards in "Needs you" on the Trello board. The morning task's instructions still say "this repo only", and Trello isn't among its connectors. Update both so the morning runs can use the board.
- **Try it:** nothing new (the calculator link works once G0 is on).
- **Risks:** two PM runs were working at the same time today; their board and test changes were merged by hand. Manrope still has to be self-hosted before G3.

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
