# Status

## Mon 23 Nov 2026 · Day 3
- **Done:**
  - T19: your Sat 21 Nov answers are in `COPY.md`: "we" throughout, Merch is a Floc Nation T-shirt (not available yet), brew days are shared online, the dextrose dispenser is still being built, and the Facebook link is confirmed. Links follow the footer order. `THAI.md` records "keep วอลุ่ม".
  - T20: the social kit follows your Facebook cover pick. The old cover with the badge is gone from `brand/social/`, and `UPLOAD.md`, `PROFILES.md` and `BRAND.md` point to the "fill line" cover on the "Floc Nation logo" canvas.
  - Both passed the tester. Security wasn't needed (docs only). Tests: 605, 0 fail, 4 todo.
- **Doing:** nothing, waiting on you.
- **Needs you** (cards in "Needs you" on the Trello board):
  - G1: read `COPY.md` and tick the card. Optional: pick hero A or B and final venture names. Approving starts the home page (T5) and the Thai home page copy (T16).
  - T6: tick to have the "no sugar needed" edge case fixed, or comment `no: leave it`. Then G2 (try the calculator on your phone) follows.
  - Social: upload the "fill line" Facebook cover (export it at 1702×630 or larger), the YouTube banner and the four bios.
  - G-TH: the native-speaker read of `THAI.md` (แบตช์ / ไพรมิ่ง and the Thai tagline are still open).
- **Try it:** nothing new on the site. `COPY.md` on GitHub shows the updated home page text.
- **Risks:**
  - The "fill line" cover isn't in the repo, so the upload steps depend on the canvas. Its wording ("glass edge and fill line") comes from your description; the run couldn't see it.
  - `PROJECT.md` still lists the Facebook link as an open question. You've answered it; the PM leaves the brief to you.
  - Manrope and Noto Sans Thai must be self-hosted before G3.
  - No PM run left a commit or a card update on Sat 21 or Sun 22 Nov, so your Saturday answers waited until this run (Mon 18:27 Bangkok time). If the morning runs should have happened, check the scheduled task.

## Fri 20 Nov 2026 · Day 0 · evening, with Toon
- **Done:**
  - T15: the site is Thai and English. Every page has a ไทย / English switch to its twin in `docs/th/`, and the Thai calculator gives exactly the same numbers as the English one. English stays the default on the preview.
  - T14 (merged into T15): style guide polish. Custom's "Typical beers" figures now come from the style table, the wheat beer tip matches its default, no guide line has two colons, and the calculator also works on phones older than iOS 15.4.
  - `THAI.md` lists every Thai string next to its English one, for the native-speaker check.
  - The morning run can use Trello now: a new scheduled task, "Floc site PM run (with Trello)", replaces the old one.
  - Checked in the chat: 605 tests (601 pass, 0 fail, 4 todo), both languages in a browser at 360 and 320 px, and the security checklist (pass).
- **Doing:** nothing, waiting on you.
- **Needs you:**
  - Switch off the old "Floc site PM run" scheduled task and keep "(with Trello)". Claude wasn't allowed to switch it off. Until it's off, both start at 06:46.
  - G-TH: ask your native-speaker contact to read `THAI.md` and mark anything to change.
  - Still open: upload the social kit, the T6 decision, G1 (read `COPY.md`).
- **Try it:** https://toondegryse.github.io/floc-nation-site/th/calculator.html. Enter 20 L and 20 °C: it should say 123.1 g and 2.03 g, the same as the English page. Pick เบียร์ข้าวสาลี (wheat beer) to see the Thai guide and the high-pressure note. Tap "English" to switch back.
- **Risks:**
  - The Thai stays unchecked until the native speaker has read it. It goes live only after that (G-TH).
  - Manrope and now Noto Sans Thai must be self-hosted before G3.
  - The hreflang links are relative for now. At go-live (T10), make them full addresses on the final domain.

## Fri 20 Nov 2026 · Day 0 · afternoon, with Toon
- **Done:**
  - G0: the preview link is live.
  - T11: the site now uses the three-hops badge and its colours, the same as the social channels.
  - T12: the calculator shows a short guide for each beer style.
  - T13: a social profile kit for Instagram, YouTube, Facebook and TikTok is in `brand/social/`, with a brand sheet in `brand/BRAND.md`.
  - All passed the tester and security. Tests: 440, 0 fail, 4 todo.
- **Doing:** nothing, waiting on you.
- **Needs you** (cards in "Needs you" on the Trello board):
  - Upload the social kit (`brand/social/UPLOAD.md`).
  - T6: tick to have the "no sugar needed" edge case fixed, or comment `no: leave it`.
  - G1: read `COPY.md`.
- **Try it:** https://toondegryse.github.io/floc-nation-site/calculator.html. Check the new look, then pick each beer style and read its guide.
- **Risks:**
  - The morning task still can't use Trello: its instructions and connectors need updating.
  - Manrope must be self-hosted before G3.

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
- **Board updates** (this run couldn't use Trello; applied on the board at 15:09 from a chat with Toon):
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
