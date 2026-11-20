# Floc Nation website · project brief

Owner: Toon. Started: Fri 20 Nov 2026. Run by: the PM agent (`.claude/agents/pm.md`), once every morning.

## Why

Floc Nation needs a home base on the web: one place the social accounts point to, so it looks established rather than brand new. The priming-sugar calculator gives brewers a reason to visit and tells the story the dextrose dispenser solves: measuring priming sugar by hand is fiddly.

## Outcomes

1. **Home page.** It says what Floc Nation is, shows the three ventures and links to the flocnationbrew accounts.
2. **Priming-sugar calculator.** The brewer enters beer volume, bottle size, beer style (or a target CO2 level) and the highest temperature the beer reached after fermentation. The page shows grams of sugar for the whole batch and per bottle. The numbers match the reference formula below.
3. **On brand, works on a phone.** It looks like the Floc Nation logo and colours, and works on a 360 px wide phone screen.

## Done means

- All three outcomes are met and Toon has signed off gates G1, G2 and G3.
- Every calculator test passes and the security review says pass.
- The site is live at the preview link with `noindex` removed.

## Gates (only Toon approves these)

| Gate | What Toon does |
|---|---|
| G0 | Turns on the preview link (one-time GitHub setting) |
| G1 | Signs off the home page copy |
| G2 | Tries the calculator on his phone and signs it off |
| G3 | Says "go public": the PM removes `noindex` |

The PM never approves a gate itself. Gates are cards in the "Needs you" list on the Trello board (https://trello.com/b/bFug8tRw/floc-nation-website). Toon approves by ticking the card's complete checkbox (or dragging it to Done), sends it back with a comment that starts with `no: <reason>`, or tells Claude in a chat and Claude marks it for him.

## Security and privacy

- **Least access.** Runs touch this repo and the project's Trello board only. They never use Toon's other connected apps or other Trello boards, and never post, publish or message anything outside these two.
- **Nothing personal.** No personal names, addresses, phone numbers or email addresses on the site.
- **Visitors aren't tracked.** No analytics, cookies, forms or outside code. The font is self-hosted before go-live.
- **No secrets** anywhere in the repo.
- The full checklist is in `.claude/agents/security.md`. Security must pass before T10 and before G3.

## Out of scope for v1

- Shop, payments, sign-up forms, newsletters or any form that collects data.
- Analytics or tracking of any kind.
- A Thai-language version (maybe later).
- Our own domain name (decided after G3).

## Calculator reference

Use these formulas so results match the calculators brewers already use.

- Temperature in °F: `F = C × 9/5 + 32`
- CO2 already in the beer: `residual = 3.0378 − 0.050062·F + 0.00026555·F²`
- Sugar for the batch, in grams: `(target − residual) × litres × factor`
  - Dextrose (corn sugar): factor 4.0
  - Table sugar: factor 3.82
- Per bottle: `batch grams × bottle litres ÷ batch litres`

Reference cases (dextrose; the tester checks these to ±0.5 g):

| Litres | Highest °C | Target vols | Residual | Batch g | Per 330 ml |
|---|---|---|---|---|---|
| 20 | 20 | 2.4 | 0.861 | 123.1 | 2.03 |
| 10 | 25 | 2.6 | 0.757 | 73.7 | 2.43 |
| 23 | 30 | 3.5 | 0.696 | 257.9 | 3.70 |

Style presets (target CO2 volumes; the target stays editable):

| Style | Range | Default |
|---|---|---|
| British ales | 1.5–2.0 | 1.8 |
| Stout and porter | 1.8–2.3 | 2.0 |
| American ales and IPA | 2.2–2.7 | 2.4 |
| Lager and pilsner | 2.4–2.6 | 2.5 |
| Wheat beer | 3.3–4.5 | 3.5 |
| Custom | any | — |

Bottle sizes: 330 ml (default), 500 ml, 620 ml, 640 ml, custom.

Safety notes the page must show:

- Above 3.0 volumes: "Use bottles rated for high pressure."
- If the target is below the residual CO2: "No sugar needed: the beer already holds this much CO2."
- Temperature outside 0–40 °C, or volume of 0 or less: a clear inline error, no result.

## Open questions (the PM raises these in "Needs you" on the board when they block work)

- Names for the three ventures. Until Toon decides, the copy uses plain names: Automation, Merch and Brew days.
- Exact link for the Facebook page.
- At G3: the preview link and the repo show Toon's personal GitHub name. Decide whether to go live on Floc Nation's own domain instead.
