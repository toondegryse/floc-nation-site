# Board

Only the PM edits this file, except for the "Needs you" boxes, which are Toon's.

## Needs you

- [ ] **G0 · Turn on the preview link (one time).** On GitHub, go to this repo, then Settings, then Pages. Under "Build and deployment", choose "Deploy from a branch", branch `main`, folder `/docs`, and save. The link will be https://toondegryse.github.io/floc-nation-site/

## Doing

None.

## In review

- **T1 · Site skeleton and brand styles** · builder · Fri 20 Nov
  - Files: `docs/index.html`, `docs/css/site.css`
  - Built: header logo lockup, footer with tagline and social links, shared brand styles (incl. form and card styles for the calculator), CSP and `noindex`. Manrope uses the Google Fonts fallback for now (font downloads are blocked here); must be self-hosted before G3.
- **T2 · Priming maths and tests** · builder · Fri 20 Nov
  - Files: `docs/js/priming.js`, `tests/priming.test.js`
  - Built: pure functions, presets and input checks; 62 tests pass, including the three reference cases.
- **T3 · Home page copy draft** · builder · Fri 20 Nov
  - Files: `COPY.md`
  - Built: hero (two options), what Floc Nation is, the three ventures, calculator pointer, community line, links, and six questions for Toon.

## To do

- **T4 · Calculator page** · builder · needs: T1, T2
  - Files: `docs/calculator.html`, `docs/js/calculator.js`, `docs/index.html` (link to the calculator only)
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
