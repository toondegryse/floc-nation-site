# Board

Only the PM edits this file, except for the "Needs you" boxes, which are Toon's.

## Needs you

- [ ] **G0 · Turn on the preview link (one time).** On GitHub, go to this repo, then Settings, then Pages. Under "Build and deployment", choose "Deploy from a branch", branch `main`, folder `/docs`, and save. The link will be https://toondegryse.github.io/floc-nation-site/
- [ ] **G1 · Sign off the home page copy.** Read `COPY.md`. Tick to approve, or write `no:` on this line with what to change. Five short questions sit at the end of `COPY.md`, including whether https://www.facebook.com/flocnationbrew is the right Facebook page. You can approve now and answer them later.

## Doing

None.

## In review

- **T6a · Reject hex, binary and octal text in number fields** · builder · Fri 20 Nov (second try)
  - Files: `docs/js/priming.js`
  - Fixed: the decimal check now runs in linear time (1,000,000 characters in under 20 ms); same text accepted as before. 319 tests, 0 fail.

## To do

- **T6 · Calculator test pass** · tester · needs: T6a · failed review once (Fri 20 Nov)
  - Done when: the module tests pass, edge cases are covered, and the numbers on the page match the module for the reference cases.
  - Findings: everything passes except hex/binary/octal input (4 tests in `tests/calculator.test.js`, 120 tests added). Rerun after T6a.
- **T5 · Build the home page from the approved copy** · builder · needs: T1, G1
  - Files: `docs/index.html`
- **T7 · Phone and accessibility check** · tester · needs: T4, T5
  - Done when: both pages are checked at 360 px, every input has a label, colour contrast passes, and the calculator works with a keyboard.
  - Also look at (from the T4 review): the results live region re-reads everything on each keystroke (`aria-atomic`); result figures use weight 800; recheck widths once real Manrope loads.
- **T8 · Security and privacy review** · security · needs: T4, T5
- **T9 · Calculator ready for Toon to try** · PM · needs: T6
  - The PM writes "how to try it" in `STATUS.md` and raises gate G2.
  - Include in "how to try it": typing a decimal on the phone keypad (some keypads only offer a comma, which the page rejects).
- **T10 · Go-live prep** · builder · needs: G1, G2, T7, T8
  - Files: all pages
  - Done when: favicon from the bottle cap, title and description tags, and a social preview image are ready. `noindex` is removed only after G3.

## Done

- **T4 · Calculator page** · builder · Fri 20 Nov · tester pass (browser check of all cases, 360 and 320 px, keyboard), security pass
- **T1 · Site skeleton and brand styles** · builder · Fri 20 Nov · tester pass, security pass (Manrope still on the Google Fonts fallback; self-host before G3)
- **T2 · Priming maths and tests** · builder · Fri 20 Nov · tester pass (87 maths tests), security pass
- **T3 · Home page copy draft** · builder · Fri 20 Nov · tester pass · G1 raised
- **T0 · Project set up** (brief, board, crew, morning run) · Fri 20 Nov
