// Tests for the beer style guide (T12): docs/js/styles.js, styleGuideView()
// in docs/js/calculator.js, and the guide panel on docs/calculator.html.
//
// One behaviour per test. The DOM wiring for the guide is tested in
// calculator.test.js ("style guide on the page (stand-in DOM, T12)"), which
// has the stand-in DOM. Node's built-in runner only, no packages.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { STYLE_GUIDES, guideForStyle } from '../docs/js/styles.js';
import {
  DEFAULT_STYLE_ID,
  GUIDE_RANGE_LABEL,
  NOTES,
  computeView,
  styleGuideView,
} from '../docs/js/calculator.js';
import { HIGH_PRESSURE_VOLS, STYLE_PRESETS } from '../docs/js/priming.js';

const PROJECT_MD = readFileSync(new URL('../PROJECT.md', import.meta.url), 'utf8');
const CALCULATOR_HTML = readFileSync(new URL('../docs/calculator.html', import.meta.url), 'utf8');

// ==========================================================================
// Helpers
// ==========================================================================

const PRESETS = STYLE_PRESETS.filter((p) => p.min !== null && p.max !== null);
const CUSTOM = STYLE_PRESETS.find((p) => p.id === 'custom');
const vols = (n) => n.toFixed(1);

/** A guide's lines as the page shows them: "label: text". */
const shownLines = (id) => styleGuideView(id).points.map((p) => `${p.label}: ${p.text}`);
const shownText = (id) => shownLines(id).join('\n');

/** Every piece of guide text the page can show, with the style it belongs to. */
const ALL_SHOWN = STYLE_PRESETS.map((p) => ({ id: p.id, text: shownText(p.id) }));

/** The "Bottles" line of a guide, or ''. */
const bottlesText = (id) => styleGuideView(id).points.find((p) => p.label === 'Bottles')?.text ?? '';

/** The style table in PROJECT.md: name -> { min, max } as text. */
function projectStyleTable() {
  const rows = {};
  for (const [, name, min, max] of PROJECT_MD.matchAll(/^\|\s*([^|]+?)\s*\|\s*(\d\.\d)[–-](\d\.\d)\s*\|\s*\d\.\d\s*\|$/gm)) {
    rows[name] = { min, max };
  }
  return rows;
}

// Hype, sales, price and legal words the brand voice rules out (CLAUDE.md).
const HYPE_WORDS = [
  'amazing', 'awesome', 'best', 'perfect', 'perfectly', 'ultimate', 'incredible', 'epic', 'insane',
  'legendary', 'stunning', 'unbeatable', 'revolutionary', 'world-class', 'must-have', 'game-changer',
  'fantastic', 'brilliant', 'superb', 'exceptional', 'magic', 'magical', 'secret', 'guaranteed',
  'killer', 'crazy', 'mind-blowing', 'next-level', 'unmatched', 'premium', 'delicious',
];
const SALES_WORDS = [
  'buy', 'sell', 'sells', 'sale', 'sales', 'shop', 'store', 'order', 'price', 'prices', 'cost', 'costs',
  'cheap', 'discount', 'offer', 'deal', 'free', 'baht', 'dollar', 'dollars', 'euro', 'euros', 'thb', 'usd', 'eur',
];
const LEGAL_WORDS = ['law', 'laws', 'legal', 'illegal', 'licence', 'license', 'permit', 'tax', 'excise', 'regulation'];
const CURRENCY = /[$€£¥฿]/u;
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}]/u;

/** Words in a text, lower case. */
const words = (text) => text.toLowerCase().match(/[a-z][a-z-]*/g) ?? [];

// ==========================================================================
// Ids and order
// ==========================================================================

describe('style guide ids (T12)', () => {
  test('every STYLE_PRESETS id has a guide, with no extra ids, in the same order', () => {
    assert.deepEqual(Object.keys(STYLE_GUIDES), STYLE_PRESETS.map((p) => p.id));
  });

  test('every STYLE_PRESETS id gives a guide view on the page', () => {
    for (const p of STYLE_PRESETS) {
      assert.ok(styleGuideView(p.id), `${p.id} has a guide view`);
    }
  });
});

// ==========================================================================
// First line: the usual range, built from STYLE_PRESETS
// ==========================================================================

describe('style guide range line (T12)', () => {
  test('each preset guide starts "Usual range: {min} to {max} volumes. {feel}" from STYLE_PRESETS', () => {
    assert.equal(GUIDE_RANGE_LABEL, 'Usual range');
    for (const p of PRESETS) {
      const feel = STYLE_GUIDES[p.id].feel;
      assert.ok(typeof feel === 'string' && feel.trim() !== '', `${p.id} has a feel line`);
      assert.deepEqual(
        styleGuideView(p.id).points[0],
        { label: 'Usual range', text: `${vols(p.min)} to ${vols(p.max)} volumes. ${feel}` },
        p.id,
      );
    }
  });

  test('each preset range line matches the PROJECT.md style table', () => {
    const table = projectStyleTable();
    assert.equal(Object.keys(table).length, PRESETS.length, `PROJECT.md rows: ${JSON.stringify(table)}`);
    for (const p of PRESETS) {
      const row = table[p.name];
      assert.ok(row, `PROJECT.md has a row for ${p.name}`);
      assert.ok(
        styleGuideView(p.id).points[0].text.startsWith(`${row.min} to ${row.max} volumes.`),
        `${p.name}: ${styleGuideView(p.id).points[0].text}`,
      );
    }
  });

  test('the range line follows STYLE_PRESETS, so the guide text never repeats a preset range', () => {
    // Ranges live in STYLE_PRESETS only: no guide line after the first gives a "x to y volumes" range.
    for (const p of STYLE_PRESETS) {
      const rest = styleGuideView(p.id).points.slice(p.min === null ? 0 : 1);
      for (const point of rest) {
        assert.doesNotMatch(point.text, /\d\.\d to \d\.\d volumes/, `${p.id}: ${point.label}: ${point.text}`);
      }
    }
  });

  test('each preset guide has the serving, bottles and low-or-high-end lines, in that order', () => {
    for (const p of PRESETS) {
      assert.deepEqual(
        styleGuideView(p.id).points.map((x) => x.label),
        ['Usual range', 'Serving', 'Bottles', 'Low or high end'],
        p.id,
      );
    }
  });
});

// ==========================================================================
// Custom
// ==========================================================================

describe('style guide for Custom (T12)', () => {
  test('Custom has no feel and no range line from STYLE_PRESETS', () => {
    assert.equal(CUSTOM.min, null);
    assert.equal(STYLE_GUIDES.custom.feel, null);
    const first = styleGuideView('custom').points[0];
    assert.notEqual(first.label, GUIDE_RANGE_LABEL, 'Custom does not open with the preset range line');
    for (const point of styleGuideView('custom').points) {
      assert.doesNotMatch(point.text, /\d\.\d to \d\.\d volumes/, `${point.label}: ${point.text}`);
    }
  });

  test('Custom explains how to choose a target: start from a style, what higher and lower feel like, and bottles', () => {
    const text = shownText('custom');
    assert.match(text, /closest style/i, 'says to start from the closest style');
    assert.match(text, /lower/i, 'says what a lower target does');
    assert.match(text, /higher/i, 'says what a higher target does');
    assert.match(text, /high pressure/i, 'says when to use high-pressure bottles');
  });

  test('the figures in the Custom guide match STYLE_PRESETS and the high-pressure limit', () => {
    const lowest = Math.min(...PRESETS.map((p) => p.min));
    const highest = Math.max(...PRESETS.map((p) => p.max));
    const usualTop = Math.max(...PRESETS.filter((p) => p.max <= HIGH_PRESSURE_VOLS).map((p) => p.max));
    const expected = new Set([vols(lowest), vols(usualTop), vols(highest), vols(HIGH_PRESSURE_VOLS)]);
    const figures = shownText('custom').match(/\d+\.\d+/g) ?? [];
    assert.ok(figures.length > 0, 'Custom guide gives figures');
    for (const f of figures) {
      assert.ok(expected.has(f), `${f} in the Custom guide is not ${[...expected].join(', ')}`);
    }
    assert.ok(figures.includes(vols(lowest)), `mentions the lowest preset min ${vols(lowest)}`);
    assert.ok(figures.includes(vols(highest)), `mentions the highest preset max ${vols(highest)}`);
  });

  test('Custom has a "Typical beers" line built from STYLE_PRESETS, second (T14)', () => {
    const points = styleGuideView('custom').points;
    assert.equal(points[1].label, 'Typical beers');
    assert.notEqual(points[1].label, GUIDE_RANGE_LABEL, 'not called "Usual range"');
    const usual = PRESETS.filter((p) => p.max <= HIGH_PRESSURE_VOLS);
    const top = PRESETS.reduce((a, p) => (p.max > a.max ? p : a));
    assert.equal(
      points[1].text,
      `Most styles sit between ${vols(Math.min(...usual.map((p) => p.min)))} and ` +
        `${vols(Math.max(...usual.map((p) => p.max)))} volumes. ${top.name} goes up to ${vols(top.max)}.`,
    );
  });

  test('no guide line holds a second colon after its label (T14)', () => {
    for (const p of STYLE_PRESETS) {
      for (const point of styleGuideView(p.id).points) {
        assert.doesNotMatch(point.text, /:/, `${p.id}: ${point.label}: ${point.text}`);
      }
    }
  });

  test('the wheat beer low-or-high line matches its default near the low end (T14)', () => {
    const wheat = PRESETS.find((p) => p.id === 'wheat');
    const line = styleGuideView('wheat').points.find((p) => p.label === 'Low or high end').text;
    assert.doesNotMatch(line, /^Start at the low end/);
    assert.ok(wheat.default - wheat.min < wheat.max - wheat.default, 'default is nearer the low end');
    assert.match(line, /near the low end/);
  });
});

// ==========================================================================
// Bottle advice
// ==========================================================================

describe('style guide bottle advice (T12)', () => {
  test('the wheat beer guide tells people to use bottles rated for high pressure', () => {
    assert.ok(bottlesText('wheat').includes(NOTES.highPressure), bottlesText('wheat'));
  });

  test('every guide whose range goes above 3.0 volumes tells people to use high-pressure bottles', () => {
    const high = PRESETS.filter((p) => p.max > HIGH_PRESSURE_VOLS);
    assert.ok(high.some((p) => p.id === 'wheat'), 'wheat beer goes above 3.0');
    for (const p of high) {
      assert.match(bottlesText(p.id), /rated for high pressure/i, p.id);
    }
  });

  test('guides whose range stays at or under 3.0 volumes do not tell people they need high-pressure bottles', () => {
    for (const p of PRESETS.filter((x) => x.max <= HIGH_PRESSURE_VOLS)) {
      assert.doesNotMatch(shownText(p.id), /high[- ]pressure|rated for/i, p.id);
    }
  });

  test('a guide that says the style stays under 3.0 volumes has a STYLE_PRESETS max at or under 3.0', () => {
    for (const p of PRESETS) {
      const m = bottlesText(p.id).match(/stays under (\d\.\d) volumes/);
      if (m) assert.ok(p.max <= Number(m[1]), `${p.id}: max ${p.max} but the guide says it stays under ${m[1]}`);
    }
  });

  test('every volume limit in the bottle advice is the page high-pressure limit (3.0)', () => {
    for (const p of STYLE_PRESETS) {
      for (const f of bottlesText(p.id).match(/\d+\.\d+/g) ?? []) {
        assert.equal(f, vols(HIGH_PRESSURE_VOLS), `${p.id}: ${bottlesText(p.id)}`);
      }
    }
  });
});

// ==========================================================================
// Serving temperatures (content check against well-known serving ranges)
// ==========================================================================

describe('style guide serving notes (T12)', () => {
  // Reference serving ranges in °C; wheat beer just needs to be served cold.
  const SERVING = {
    'british-ales': [11, 13],
    'stout-porter': [10, 13],
    'american-ale-ipa': [7, 10],
    'lager-pilsner': [4, 7],
  };

  test('each serving temperature sits inside the usual serving range for the style', () => {
    for (const [id, [lo, hi]] of Object.entries(SERVING)) {
      const serving = styleGuideView(id).points.find((p) => p.label === 'Serving').text;
      const m = serving.match(/(\d+) to (\d+) °C/);
      assert.ok(m, `${id} gives a temperature: ${serving}`);
      assert.ok(Number(m[1]) >= lo && Number(m[2]) <= hi, `${id}: ${m[1]} to ${m[2]} °C, expected within ${lo} to ${hi} °C`);
    }
  });

  test('wheat beer is served cold', () => {
    const serving = styleGuideView('wheat').points.find((p) => p.label === 'Serving').text;
    assert.match(serving, /^Cold\b/, serving);
  });
});

// ==========================================================================
// Brand voice
// ==========================================================================

describe('style guide brand voice (T12)', () => {
  test('no guide text has an exclamation mark', () => {
    for (const { id, text } of ALL_SHOWN) assert.ok(!text.includes('!'), `${id}: ${text}`);
  });

  test('no guide text has emoji', () => {
    for (const { id, text } of ALL_SHOWN) assert.doesNotMatch(text, EMOJI, id);
  });

  test('no guide text has prices, currency or sales words', () => {
    for (const { id, text } of ALL_SHOWN) {
      assert.doesNotMatch(text, CURRENCY, `${id}: currency sign`);
      const found = words(text).filter((w) => SALES_WORDS.includes(w));
      assert.deepEqual(found, [], id);
    }
  });

  test('no guide text has hype words', () => {
    for (const { id, text } of ALL_SHOWN) {
      const found = words(text).filter((w) => HYPE_WORDS.includes(w));
      assert.deepEqual(found, [], id);
    }
  });

  test('no guide text touches legal topics', () => {
    for (const { id, text } of ALL_SHOWN) {
      const found = words(text).filter((w) => LEGAL_WORDS.includes(w));
      assert.deepEqual(found, [], id);
    }
  });

  test('no guide text has names: no capitalised word inside a sentence except IPA and CO2', () => {
    const allowed = new Set(['IPA', 'CO2']);
    for (const p of STYLE_PRESETS) {
      for (const point of styleGuideView(p.id).points) {
        const plain = `${point.label}. ${point.text}`.replace(/°C\b/g, 'degrees');
        for (const sentence of plain.split(/(?<=[.:])\s+/)) {
          const inner = sentence.split(/\s+/).slice(1).map((w) => w.replace(/[^\w-]/g, ''));
          const caps = inner.filter((w) => /^[A-Z]/.test(w) && !allowed.has(w));
          assert.deepEqual(caps, [], `${p.id}: ${sentence}`);
        }
      }
    }
  });

  test('no guide text has an email address, handle or link', () => {
    for (const { id, text } of ALL_SHOWN) assert.doesNotMatch(text, /@|https?:|www\./i, id);
  });

  test('every guide is short: 70 words or fewer as shown, and no sentence over 15 words', () => {
    for (const { id, text } of ALL_SHOWN) {
      const count = text.split(/\s+/).filter(Boolean).length;
      assert.ok(count <= 70, `${id}: ${count} words`);
      for (const sentence of text.split(/(?<=\.)\s+|\n/)) {
        const n = sentence.split(/\s+/).filter(Boolean).length;
        assert.ok(n <= 15, `${id}: ${n} words in "${sentence}"`);
      }
    }
  });
});

// ==========================================================================
// Unknown and prototype ids
// ==========================================================================

describe('style guide lookups with unknown ids (T12)', () => {
  const ODD_IDS = [
    'toString', '__proto__', 'constructor', 'hasOwnProperty', 'valueOf', 'isPrototypeOf',
    'not-a-style', '', 'Wheat', ' wheat', undefined, null, 0, 1, {}, [], ['wheat'],
  ];
  const show = (x) => (typeof x === 'string' ? JSON.stringify(x) : String(x));

  test('guideForStyle returns null for unknown, prototype and non-string ids', () => {
    for (const id of ODD_IDS) assert.equal(guideForStyle(id), null, show(id));
  });

  test('styleGuideView returns null for unknown, prototype and non-string ids', () => {
    for (const id of ODD_IDS) assert.equal(styleGuideView(id), null, show(id));
  });

  test('computeView with a prototype style id shows no guide and the custom target hint', () => {
    for (const style of ['toString', '__proto__', 'constructor']) {
      const v = computeView({ style });
      assert.equal(v.styleGuide, null, style);
      assert.equal(v.targetHint, 'Type the CO2 level you want, in volumes.', style);
    }
  });

  test('guideForStyle returns the STYLE_GUIDES entry for every known id', () => {
    for (const p of STYLE_PRESETS) assert.equal(guideForStyle(p.id), STYLE_GUIDES[p.id], p.id);
  });
});

// ==========================================================================
// computeView
// ==========================================================================

describe('computeView style guide (T12)', () => {
  test('computeView().styleGuide equals styleGuideView() for every style', () => {
    for (const p of STYLE_PRESETS) {
      assert.deepEqual(computeView({ style: p.id }).styleGuide, styleGuideView(p.id), p.id);
    }
  });

  test('computeView().styleGuide is null for an unknown style id', () => {
    assert.equal(computeView({ style: 'not-a-style' }).styleGuide, null);
  });

  test('computeView with no style gives the default style guide', () => {
    assert.deepEqual(computeView({}).styleGuide, styleGuideView(DEFAULT_STYLE_ID));
  });

  test('the style guide does not change with the other fields or with errors', () => {
    const expected = styleGuideView('wheat');
    const states = [
      { litres: '20', tempC: '20', targetVols: '2.4' },
      { litres: '0', tempC: '50', targetVols: '-1' },
      { litres: '', tempC: '', targetVols: '' },
      { litres: '20', tempC: '20', targetVols: '0.5', sugar: 'table' },
    ];
    for (const s of states) assert.deepEqual(computeView({ ...s, style: 'wheat' }).styleGuide, expected, JSON.stringify(s));
  });
});

// ==========================================================================
// Frozen data
// ==========================================================================

describe('style guide data is frozen (T12)', () => {
  test('STYLE_GUIDES, each guide, each points list and each point are frozen', () => {
    assert.ok(Object.isFrozen(STYLE_GUIDES), 'STYLE_GUIDES');
    for (const [id, guide] of Object.entries(STYLE_GUIDES)) {
      assert.ok(Object.isFrozen(guide), `${id} guide`);
      assert.ok(Object.isFrozen(guide.points), `${id} points`);
      for (const point of guide.points) assert.ok(Object.isFrozen(point), `${id} point ${point.label}`);
    }
  });

  test('changing a styleGuideView result does not change the next one', () => {
    const before = structuredClone(styleGuideView('wheat'));
    const v = styleGuideView('wheat');
    v.points.push({ label: 'Extra', text: 'Extra line.' });
    v.points[0] = { label: 'Changed', text: 'Changed.' };
    assert.deepEqual(styleGuideView('wheat'), before);
  });
});

// ==========================================================================
// The guide panel on calculator.html (static HTML)
// ==========================================================================

describe('style guide panel on calculator.html (T12)', () => {
  const tagOf = (id) => CALCULATOR_HTML.match(new RegExp(`<[a-z]+\\b[^>]*\\sid="${id}"[^>]*>`, 'i'))?.[0] ?? '';

  test('every guide fits the panel line slots on the page', () => {
    const slots = [...CALCULATOR_HTML.matchAll(/\sid="style-guide-(\d+)"/g)].length;
    assert.ok(slots > 0, 'panel has line slots');
    for (const p of STYLE_PRESETS) {
      const n = styleGuideView(p.id).points.length;
      assert.ok(n <= slots, `${p.id} has ${n} lines but the page has ${slots} slots`);
    }
  });

  test('the style menu is described by the hint and the guide panel', () => {
    const select = tagOf('style');
    const ids = (select.match(/aria-describedby="([^"]*)"/)?.[1] ?? '').split(/\s+/);
    assert.deepEqual(ids, ['style-hint', 'style-guide']);
  });

  test('the guide panel is not a live region and sits outside the results live region', () => {
    const panel = tagOf('style-guide');
    assert.ok(panel, '#style-guide is on the page');
    assert.doesNotMatch(panel, /aria-live|role="(status|alert|log)"/);
    const resultStart = CALCULATOR_HTML.indexOf(tagOf('result'));
    const panelStart = CALCULATOR_HTML.indexOf(panel);
    assert.ok(resultStart > 0 && panelStart > 0);
    assert.ok(panelStart < resultStart, 'the guide panel comes before, not inside, the results region');
  });

  test('the guide panel comes right after the style menu, before the target field', () => {
    const at = (id) => CALCULATOR_HTML.indexOf(tagOf(id));
    assert.ok(at('style') < at('style-guide') && at('style-guide') < at('target-vols'));
  });
});
