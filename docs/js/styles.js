/**
 * Beer style guides for the priming-sugar calculator, in English
 * (STYLE_GUIDES) and Thai (STYLE_GUIDES_TH).
 *
 * Plain data: no DOM code and no imports. calculator.js shows the guide for
 * the picked style under the style menu, in the page's language.
 *
 * STYLE_GUIDES has one guide per id in STYLE_PRESETS (priming.js), and no
 * other ids. STYLE_GUIDES_TH has the same ids and the same number of lines
 * per guide, in the same order. Each guide is { feel, points }:
 *   feel   How the carbonation should feel in the glass, and why. The page
 *          shows it on the first line, after the style's usual range from
 *          STYLE_PRESETS: "Usual range: 3.3 to 4.5 volumes. <feel>".
 *          null for Custom, which has no range.
 *   points The other lines, in order, each shown as "label: text".
 *          Presets: Serving, Bottles, Low or high end.
 *          Custom: how to choose a target instead (three lines here;
 *          calculator.js adds a "Typical beers" line, built from
 *          STYLE_PRESETS, after the first one).
 *
 * Copy rules (CLAUDE.md): plain and practical, short sentences, no hype,
 * no exclamation marks, no sales, prices or legal topics, no personal names.
 * One colon per line at most: the page already puts one after the label.
 * The Thai is listed next to the English in THAI.md for a native speaker to
 * check, and must be changed there too.
 * About 60 words per guide as shown, range line and labels included. The CO2
 * ranges and defaults live in STYLE_PRESETS only; the tips say "low end" and
 * "high end" rather than repeat them.
 */

/** Bottle advice for styles that stay at or under 3.0 volumes. */
const STANDARD_BOTTLES = 'Standard bottles are fine. This style stays under 3.0 volumes.';

export const STYLE_GUIDES = Object.freeze({
  'british-ales': guide('Low and soft. Fresh, not fizzy, so the malt and hops come first.', [
    ['Serving', 'Cool, not cold. About 11 to 13 °C, warmer than a lager.'],
    ['Bottles', STANDARD_BOTTLES],
    ['Low or high end', 'Go low for a soft, cask-like pint. Go high for a firmer head that lasts.'],
  ]),

  'stout-porter': guide('Moderate and smooth. Enough to hold a head, but low enough to keep the body creamy.', [
    ['Serving', 'Cool, about 10 to 13 °C. Too cold hides the roast flavours.'],
    ['Bottles', STANDARD_BOTTLES],
    ['Low or high end', 'Go low for a rich, full-bodied stout. Go high for a lighter, drier porter.'],
  ]),

  'american-ale-ipa': guide('Medium and lively. The bubbles carry the hop aroma and keep the finish crisp.', [
    ['Serving', 'Cold, but not ice cold. About 7 to 10 °C.'],
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
    ['Low or high end', 'The default sits near the low end, a safe start. Go higher for more foam, only in bottles rated for it.'],
  ]),

  custom: guide(null, [
    ['Where to start', 'Start from the closest style and adjust its target a little.'],
    ['In the glass', 'Lower feels softer. Higher feels crisper, with a bigger head.'],
    ['Bottles', 'Standard bottles are fine up to about 3.0 volumes. Above that, use bottles rated for high pressure.'],
  ]),
});

/** Thai bottle advice for styles that stay at or under 3.0 volumes. */
const STANDARD_BOTTLES_TH = 'ใช้ขวดธรรมดาได้ สไตล์นี้ไม่เกิน 3.0 วอลุ่ม';

export const STYLE_GUIDES_TH = Object.freeze({
  'british-ales': guide('ซ่าน้อยและนุ่ม สดชื่นแต่ไม่ฟู่ ให้รสมอลต์และฮอปส์เด่นกว่า', [
    ['การเสิร์ฟ', 'เย็นแต่ไม่เย็นจัด ประมาณ 11 ถึง 13 °C อุ่นกว่าลาเกอร์'],
    ['ขวด', STANDARD_BOTTLES_TH],
    ['ค่าต่ำหรือค่าสูง', 'ค่าต่ำได้เบียร์นุ่มแบบเบียร์ถัง ค่าสูงได้หัวฟองแน่นที่อยู่ได้นาน'],
  ]),

  'stout-porter': guide('ซ่าปานกลางและนุ่มนวล พอให้มีหัวฟอง แต่ไม่มากจนเสียเนื้อสัมผัสครีมมี่', [
    ['การเสิร์ฟ', 'เย็นพอประมาณ ราว 10 ถึง 13 °C ถ้าเย็นเกินไปจะกลบรสคั่ว'],
    ['ขวด', STANDARD_BOTTLES_TH],
    ['ค่าต่ำหรือค่าสูง', 'ค่าต่ำเหมาะกับสเตาต์ที่เข้มข้นและบอดี้หนา ค่าสูงเหมาะกับพอร์เตอร์ที่เบาและแห้งกว่า'],
  ]),

  'american-ale-ipa': guide('ซ่าปานกลางและสดชื่น ฟองช่วยพากลิ่นฮอปส์ขึ้นมาและทำให้จบสะอาด', [
    ['การเสิร์ฟ', 'เย็นแต่ไม่ถึงกับเย็นจัด ประมาณ 7 ถึง 10 °C'],
    ['ขวด', STANDARD_BOTTLES_TH],
    ['ค่าต่ำหรือค่าสูง', 'ค่าต่ำเหมาะกับแอมเบอร์ที่เน้นมอลต์หรือสตรองเอล ค่าสูงเหมาะกับ IPA ที่แห้งและเน้นฮอปส์'],
  ]),

  'lager-pilsner': guide('ซ่าสดชื่น ฟองละเอียด หัวฟองแน่น เบียร์ใสเบาๆ ถ้าซ่าไม่พอจะรสจืด', [
    ['การเสิร์ฟ', 'เย็น ประมาณ 4 ถึง 7 °C'],
    ['ขวด', STANDARD_BOTTLES_TH],
    ['ค่าต่ำหรือค่าสูง', 'ช่วงนี้แคบ ค่าต่ำเหมาะกับลาเกอร์สีเข้มที่เน้นมอลต์ ค่าสูงเหมาะกับพิลส์เนอร์สีอ่อนที่แห้ง'],
  ]),

  wheat: guide('ซ่ามากและสดชื่น หัวฟองสูงหนาช่วยพากลิ่นยีสต์', [
    ['การเสิร์ฟ', 'เย็น ในแก้วทรงสูงที่มีที่ว่างให้ฟอง'],
    ['ขวด', 'ขวดธรรมดารับได้แค่ราว 3.0 วอลุ่ม ให้ใช้ขวดที่ทนแรงดันสูง'],
    ['ค่าต่ำหรือค่าสูง', 'ค่าเริ่มต้นอยู่ใกล้ปลายต่ำ เริ่มตรงนี้ปลอดภัย อยากได้ฟองมากขึ้นค่อยเพิ่ม และต้องใช้ขวดที่ทนแรงดันได้เท่านั้น'],
  ]),

  custom: guide(null, [
    ['เริ่มจากตรงไหน', 'เริ่มจากสไตล์ที่ใกล้เคียงที่สุด แล้วปรับค่าเป้าหมายทีละนิด'],
    ['ในแก้ว', 'ค่าต่ำจะนุ่มกว่า ค่าสูงจะซ่าสดชื่นกว่าและหัวฟองใหญ่กว่า'],
    ['ขวด', 'ขวดธรรมดาใช้ได้ถึงราว 3.0 วอลุ่ม ถ้าสูงกว่านั้นให้ใช้ขวดที่ทนแรงดันสูง'],
  ]),
});

/** Guides by language. */
const GUIDES = Object.freeze({ en: STYLE_GUIDES, th: STYLE_GUIDES_TH });

/**
 * The guide data for a style.
 * @param {string} styleId An id from STYLE_PRESETS.
 * @param {'en'|'th'} [lang='en'] Language of the page.
 * @returns {{ feel: string|null, points: ReadonlyArray<{ label: string, text: string }> }|null}
 *   The guide, or null for an unknown id.
 */
export function guideForStyle(styleId, lang = 'en') {
  const guides = lang === 'th' ? GUIDES.th : GUIDES.en;
  return typeof styleId === 'string' && Object.prototype.hasOwnProperty.call(guides, styleId)
    ? guides[styleId]
    : null;
}

function guide(feel, points) {
  return Object.freeze({
    feel,
    points: Object.freeze(points.map(([label, text]) => Object.freeze({ label, text }))),
  });
}
