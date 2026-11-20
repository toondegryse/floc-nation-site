/**
 * Beer style guides for the priming-sugar calculator.
 *
 * Plain data: no DOM code and no imports. calculator.js shows the guide for
 * the picked style under the style menu.
 *
 * STYLE_GUIDES has one guide per id in STYLE_PRESETS (priming.js), and no
 * other ids. Each guide is { feel, points }:
 *   feel   How the carbonation should feel in the glass, and why. The page
 *          shows it on the first line, after the style's usual range from
 *          STYLE_PRESETS: "Usual range: 3.3 to 4.5 volumes. <feel>".
 *          null for Custom, which has no range.
 *   points The other lines, in order, each shown as "label: text".
 *          Presets: Serving, Bottles, Low or high end.
 *          Custom: how to choose a target instead (four lines).
 *
 * Copy rules (CLAUDE.md): plain and practical, short sentences, no hype,
 * no exclamation marks, no sales, prices or legal topics, no personal names.
 * About 60 words per guide as shown, range line and labels included. The CO2
 * ranges and defaults live in STYLE_PRESETS only; the tips say "low end" and
 * "high end" rather than repeat them.
 */

/** Bottle advice for styles that stay at or under 3.0 volumes. */
const STANDARD_BOTTLES = 'Standard bottles are fine: this style stays under 3.0 volumes.';

export const STYLE_GUIDES = Object.freeze({
  'british-ales': guide('Low and soft. Fresh, not fizzy, so the malt and hops come first.', [
    ['Serving', 'Cool, not cold: about 11 to 13 °C, warmer than a lager.'],
    ['Bottles', STANDARD_BOTTLES],
    ['Low or high end', 'Go low for a soft, cask-like pint. Go high for a firmer head that lasts.'],
  ]),

  'stout-porter': guide('Moderate and smooth. Enough to hold a head, but low enough to keep the body creamy.', [
    ['Serving', 'Cool, about 10 to 13 °C. Too cold hides the roast flavours.'],
    ['Bottles', STANDARD_BOTTLES],
    ['Low or high end', 'Go low for a rich, full-bodied stout. Go high for a lighter, drier porter.'],
  ]),

  'american-ale-ipa': guide('Medium and lively. The bubbles carry the hop aroma and keep the finish crisp.', [
    ['Serving', 'Cold, but not ice cold: about 7 to 10 °C.'],
    ['Bottles', STANDARD_BOTTLES],
    ['Low or high end', 'Go low for a malty amber or a strong ale. Go high for a dry, hoppy IPA.'],
  ]),

  'lager-pilsner': guide('Crisp and lively, with fine bubbles and a firm head. A clean, light beer tastes dull without it.', [
    ['Serving', 'Cold, about 4 to 7 °C.'],
    ['Bottles', STANDARD_BOTTLES],
    ['Low or high end', 'The range is narrow. Go low for a darker, maltier lager. Go high for a pale, dry pilsner.'],
  ]),

  wheat: guide('High and lively. A tall, thick head carries the yeast aroma.', [
    ['Serving', 'Cold, in a tall glass with room for the foam.'],
    ['Bottles', 'Standard bottles are fine only up to about 3.0 volumes. Use bottles rated for high pressure.'],
    ['Low or high end', 'Start at the low end. Go higher for more foam, only in bottles rated for it.'],
  ]),

  custom: guide(null, [
    ['Where to start', 'Start from the closest style and adjust its target a little.'],
    ['Usual range', 'Most beers sit between 1.5 and 3.0 volumes. Wheat beer goes up to 4.5.'],
    ['In the glass', 'Lower feels softer. Higher feels crisper, with a bigger head.'],
    ['Bottles', 'Standard bottles are fine up to about 3.0 volumes. Above that, use bottles rated for high pressure.'],
  ]),
});

/**
 * The guide data for a style.
 * @param {string} styleId An id from STYLE_PRESETS.
 * @returns {{ feel: string|null, points: ReadonlyArray<{ label: string, text: string }> }|null}
 *   The guide, or null for an unknown id.
 */
export function guideForStyle(styleId) {
  return typeof styleId === 'string' && Object.hasOwn(STYLE_GUIDES, styleId) ? STYLE_GUIDES[styleId] : null;
}

function guide(feel, points) {
  return Object.freeze({
    feel,
    points: Object.freeze(points.map(([label, text]) => Object.freeze({ label, text }))),
  });
}
