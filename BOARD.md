# Board

Only the PM edits this file, except for the "Needs you" boxes, which are Toon's.

## Needs you

- [ ] **G0 · Turn on the preview link (one time).** On GitHub, go to this repo, then Settings, then Pages. Under "Build and deployment", choose "Deploy from a branch", branch `main`, folder `/docs`, and save. The link will be https://toondegryse.github.io/floc-nation-site/

## Doing

None yet. The first PM run picks up work.

## In review

None.

## To do

- **T1 · Site skeleton and brand styles** · builder · needs: none
  - Files: `docs/index.html`, `docs/css/site.css`
  - Done when: header with the logo lockup, footer with the tagline and social links, brand colours and Manrope in place, `noindex` meta present, works at 360 px.
- **T2 · Priming maths and tests** · builder · needs: none
  - Files: `docs/js/priming.js`, `tests/priming.test.js`
  - Done when: pure functions for residual CO2, batch grams and grams per bottle (dextrose and table sugar), the three reference cases in `PROJECT.md` pass, and invalid input throws a clear error.
- **T3 · Home page copy draft** · builder · needs: none
  - Files: `COPY.md`
  - Done when: a hero line, what Floc Nation is (two or three sentences), the three ventures (one or two lines each), a community line, and social links, all in the brand voice. The PM then raises gate G1.
- **T4 · Calculator page** · builder · needs: T1, T2
  - Files: `docs/calculator.html`, `docs/js/calculator.js`
  - Done when: the inputs and outputs from `PROJECT.md` work, style presets fill the target, the safety notes and inline errors show, and the home page links to it.
- **T5 · Build the home page from the approved copy** · builder · needs: T1, G1
  - Files: `docs/index.html`
- **T6 · Calculator test pass** · tester · needs: T4
  - Done when: the module tests pass, edge cases are covered, and the numbers on the page match the module for the reference cases.
- **T7 · Phone and accessibility check** · tester · needs: T4, T5
  - Done when: both pages are checked at 360 px, every input has a label, colour contrast passes, and the calculator works with a keyboard.
- **T8 · Security and privacy review** · security · needs: T4, T5
- **T9 · Calculator ready for Toon to try** · PM · needs: T6
  - The PM writes "how to try it" in `STATUS.md` and raises gate G2.
- **T10 · Go-live prep** · builder · needs: G1, G2, T7, T8
  - Files: all pages
  - Done when: favicon from the bottle cap, title and description tags, and a social preview image are ready. `noindex` is removed only after G3.

## Done

- **T0 · Project set up** (brief, board, crew, morning run) · Fri 20 Nov
