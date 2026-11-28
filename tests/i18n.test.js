// Tests for the Thai and English text (T15): docs/js/i18n.js, the Thai style
// guides in docs/js/styles.js, computeView() with lang 'th', and THAI.md.
// The Thai page itself is tested in pages.test.js (static HTML) and
// calculator.test.js (stand-in DOM). Node's built-in runner only.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { LANGS, TEXT, fill, langOf, textFor } from '../docs/js/i18n.js';
import { STYLE_GUIDES, STYLE_GUIDES_TH, guideForStyle } from '../docs/js/styles.js';
import { computeView, errorMessage, styleGuideView, styleName } from '../docs/js/calculator.js';
import { ERROR_CODES, PrimingInputError, STYLE_PRESETS } from '../docs/js/priming.js';

const THAI = /[฀-๿]/;
const THAI_MD = readFileSync(new URL('../THAI.md', import.meta.url), 'utf8');
const TH_DIR = new URL('../docs/th/', import.meta.url);

const slots = (template) => [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/** Every string in a nested object, with its path. */
function strings(obj, path = []) {
  const out = [];
  for (const [key, value] of Object.entries(obj ?? {})) {
    if (typeof value === 'string') out.push({ path: [...path, key].join('.'), value });
    else if (value && typeof value === 'object') out.push(...strings(value, [...path, key]));
  }
  return out;
}

// Reference cases from PROJECT.md, plus table sugar and the two safety notes.
const CASES = [
  { litres: '20', tempC: '20', targetVols: '2.4' },
  { litres: '10', tempC: '25', targetVols: '2.6' },
  { litres: '23', tempC: '30', targetVols: '3.5' },
  { litres: '20', tempC: '20', targetVols: '2.4', sugar: 'table' },
  { litres: '20', tempC: '20', targetVols: '0.5' },
  { litres: '20', tempC: '4', targetVols: '2.4', bottleSize: '640' },
];

// Input that reaches each error the page can meet.
const BAD_INPUT = [
  { litres: '' },
  { litres: 'abc' },
  { litres: '0' },
  { litres: '-2' },
  { tempC: '' },
  { tempC: 'warm' },
  { tempC: '45' },
  { tempC: '-1' },
  { targetVols: '' },
  { targetVols: 'x' },
  { targetVols: '0' },
  { bottleSize: 'custom', customBottleMl: '' },
  { bottleSize: 'custom', customBottleMl: 'big' },
  { bottleSize: 'custom', customBottleMl: '0' },
  { bottleSize: 'custom', customBottleMl: '30000' },
  { sugar: 'honey' },
  // Upper limits (T21)
  { litres: '10000.01' },
  { targetVols: '10.01' },
  { litres: '100', bottleSize: 'custom', customBottleMl: '20000.01' },
];

// Input just over each upper limit (T21), and the field it marks.
const OVER_LIMIT = [
  { input: { litres: '10000.01' }, field: 'litres', figure: '10,000' },
  { input: { litres: '100', bottleSize: 'custom', customBottleMl: '20000.01' }, field: 'customBottleMl', figure: '20,000' },
  { input: { targetVols: '10.01' }, field: 'targetVols', figure: '10' },
];
const GOOD = { litres: '20', tempC: '20', targetVols: '2.4' };

// ==========================================================================
// The dictionary
// ==========================================================================

describe('i18n.js dictionary (T15)', () => {
  test('there are two languages, English and Thai', () => {
    assert.deepEqual([...LANGS], ['en', 'th']);
  });

  test('Thai has every key English has', () => {
    assert.deepEqual(Object.keys(TEXT.th).sort(), Object.keys(TEXT.en).sort());
  });

  test('each Thai template has the same {slots} as its English one', () => {
    for (const { path, value } of strings(TEXT.en)) {
      const th = path.split('.').reduce((o, k) => o?.[k], TEXT.th);
      assert.equal(typeof th, 'string', `th.${path} is missing`);
      assert.deepEqual(slots(th), slots(value), path);
    }
  });

  test('every Thai string has Thai letters in it', () => {
    for (const { path, value } of strings(TEXT.th)) {
      // Skip separators and templates that are only slots, like '{range}'.
      if (!/\p{L}/u.test(value.replace(/\{\w+\}/g, ''))) continue;
      assert.match(value, THAI, path);
    }
  });

  test('Thai has a name for every beer style', () => {
    assert.deepEqual(Object.keys(TEXT.th.styleNames).sort(), STYLE_PRESETS.map((p) => p.id).sort());
    for (const p of STYLE_PRESETS) assert.match(styleName(p.id, 'th'), THAI, p.id);
  });

  test('English style names stay the STYLE_PRESETS names', () => {
    for (const p of STYLE_PRESETS) assert.equal(styleName(p.id, 'en'), p.name);
    assert.equal(styleName('no-such-style', 'th'), null);
  });

  test('textFor gives English for anything that is not "th"', () => {
    assert.equal(textFor('th'), TEXT.th);
    for (const lang of ['en', 'EN', 'fr', '', undefined, null, '__proto__']) assert.equal(textFor(lang), TEXT.en);
  });

  test('fill puts values in the slots and leaves unknown slots as they are', () => {
    assert.equal(fill('{a} and {b}', { a: 1, b: 'two' }), '1 and two');
    assert.equal(fill('{a} {missing}', { a: 'x' }), 'x {missing}');
    assert.equal(fill('{toString}', {}), '{toString}');
  });
});

describe('langOf reads the page language from <html lang> (T15)', () => {
  const docWith = (lang) => ({ documentElement: { getAttribute: (n) => (n === 'lang' ? lang : null) } });

  test('lang="th" and lang="th-TH" give Thai', () => {
    assert.equal(langOf(docWith('th')), 'th');
    assert.equal(langOf(docWith('th-TH')), 'th');
    assert.equal(langOf(docWith('TH')), 'th');
  });

  test('English, other languages, no lang and no document give English', () => {
    for (const lang of ['en', 'en-GB', 'thx', 'fr', '', null]) assert.equal(langOf(docWith(lang)), 'en', String(lang));
    assert.equal(langOf(undefined), 'en');
    assert.equal(langOf({}), 'en');
  });
});

// ==========================================================================
// computeView in Thai
// ==========================================================================

describe('computeView in Thai gives the English numbers with Thai words (T15)', () => {
  for (const c of CASES) {
    test(`same figures and notes for ${JSON.stringify(c)}`, () => {
      const en = computeView(c);
      const th = computeView(c, { lang: 'th' });
      assert.equal(th.hasResult, en.hasResult);
      assert.equal(th.batchText, en.batchText);
      assert.equal(th.perBottleText, en.perBottleText);
      assert.deepEqual(th.result, en.result);
      assert.equal(th.notes.length, en.notes.length);
      assert.deepEqual(
        th.notes.map((n) => (n === TEXT.th.notes.highPressure ? 'high' : n === TEXT.th.notes.noSugarNeeded ? 'none' : n)),
        en.notes.map((n) => (n === TEXT.en.notes.highPressure ? 'high' : n === TEXT.en.notes.noSugarNeeded ? 'none' : n)),
      );
    });
  }

  test('the Thai labels, hint and residual line are Thai, with every slot filled', () => {
    const v = computeView({ ...GOOD, bottleSize: '500' }, { lang: 'th' });
    for (const [key, value] of Object.entries({
      batchLabel: v.batchLabel,
      perBottleLabel: v.perBottleLabel,
      residualText: v.residualText,
      targetHint: v.targetHint,
    })) {
      assert.match(value, THAI, key);
      assert.doesNotMatch(value, /[{}]/, key);
    }
    assert.equal(v.perBottleLabel, 'เดกซ์โทรสต่อขวด 500 มล.');
  });

  test('a target outside the style range says so in Thai', () => {
    const v = computeView({ ...GOOD, targetVols: '3.0' }, { lang: 'th' });
    assert.equal(v.targetHint, 'เอลอเมริกันและ IPA: ปกติ 2.2 ถึง 2.7 วอลุ่ม ค่าเป้าหมายของคุณอยู่นอกช่วงนี้');
  });

  test('the prompt names the missing fields in Thai', () => {
    const v = computeView({ litres: '', tempC: '' }, { lang: 'th', touched: new Set() });
    assert.equal(v.prompt, 'กรอกปริมาณเบียร์ และอุณหภูมิสูงสุด เพื่อดูว่าต้องใส่น้ำตาลเท่าไร');
  });

  test('a lang other than "th" gives the English view', () => {
    assert.deepEqual(computeView(GOOD, { lang: 'fr' }), computeView(GOOD));
    assert.deepEqual(computeView(GOOD, { lang: 'en' }), computeView(GOOD));
  });
});

describe('every input error has its own Thai message (T15)', () => {
  for (const bad of BAD_INPUT) {
    test(`Thai message for ${JSON.stringify(bad)}`, () => {
      const en = computeView({ ...GOOD, ...bad });
      const th = computeView({ ...GOOD, ...bad }, { lang: 'th' });
      assert.ok(Object.keys(en.errors).length > 0, 'English shows an error');
      assert.deepEqual(Object.keys(th.errors).sort(), Object.keys(en.errors).sort(), 'same fields marked');
      for (const message of Object.values(th.errors)) {
        assert.match(message, THAI);
        assert.notEqual(message, TEXT.th.errorFallback, 'not the catch-all message');
        assert.doesNotMatch(message, /[{}]/);
      }
    });
  }

  test('each Thai error key names a real field and error code', () => {
    const fields = new Set(['litres', 'tempC', 'targetVols', 'bottleMl', 'sugar']);
    for (const key of Object.keys(TEXT.th.errors)) {
      const [field, code] = key.split('.');
      assert.ok(fields.has(field), key);
      assert.ok(ERROR_CODES.includes(code), key);
    }
  });

  for (const { input, field, figure } of OVER_LIMIT) {
    test(`over the limit (${field}): the Thai message gives the same limit, ${figure}, as the English one (T21)`, () => {
      const en = computeView({ ...GOOD, ...input }).errors[field];
      const th = computeView({ ...GOOD, ...input }, { lang: 'th' }).errors[field];
      assert.ok(en.includes(` ${figure} `), en);
      assert.ok(th.includes(` ${figure} `), th);
      assert.deepEqual(th.match(/[\d,.]+\d/g), en.match(/[\d,.]+\d/g), 'same figures');
    });
  }

  test('the Thai over-limit messages come from i18n.js with {max} filled in (T21)', () => {
    const cases = [
      ['litres', 'ปริมาณเบียร์ต้องไม่เกิน 10,000 ลิตร'],
      ['bottleMl', 'ขนาดขวดต้องไม่เกิน 20,000 มล.'],
      ['targetVols', 'CO2 เป้าหมายต้องไม่เกิน 10 วอลุ่ม'],
    ];
    for (const [field, message] of cases) {
      assert.match(TEXT.th.errors[`${field}.over-limit`], /\{max\}/, field);
      assert.equal(errorMessage(new PrimingInputError('', field, 'over-limit'), 'th'), message);
    }
  });

  test('the Thai temperature message still gets 0 and 40 °C (T21 changed how {min} and {max} are filled)', () => {
    const err = new PrimingInputError('', 'tempC', 'out-of-range');
    assert.equal(errorMessage(err, 'th'), 'อุณหภูมิต้องอยู่ระหว่าง 0 ถึง 40 °C');
  });

  test('the "check the numbers" prompt is Thai on the Thai page (T21)', () => {
    const v = computeView({ ...GOOD, bottleSize: 'custom', customBottleMl: '1e-322' }, { lang: 'th' });
    assert.equal(v.prompt, TEXT.th.promptCheck);
    assert.match(v.prompt, THAI);
  });

  test('an error with no Thai message gets the Thai catch-all, and English keeps the module message', () => {
    const err = new PrimingInputError('Batch sugar must be a number.', 'batchGrams', 'not-number');
    assert.equal(errorMessage(err, 'th'), TEXT.th.errorFallback);
    assert.equal(errorMessage(err, 'en'), 'Batch sugar must be a number.');
    assert.equal(errorMessage(err), 'Batch sugar must be a number.');
  });
});

// ==========================================================================
// Thai style guides
// ==========================================================================

describe('Thai style guides (T15)', () => {
  test('STYLE_GUIDES_TH has the same styles as STYLE_GUIDES', () => {
    assert.deepEqual(Object.keys(STYLE_GUIDES_TH).sort(), Object.keys(STYLE_GUIDES).sort());
  });

  test('each Thai guide has the same number of lines, and a feel exactly where English has one', () => {
    for (const id of Object.keys(STYLE_GUIDES)) {
      assert.equal(STYLE_GUIDES_TH[id].points.length, STYLE_GUIDES[id].points.length, id);
      assert.equal(STYLE_GUIDES_TH[id].feel === null, STYLE_GUIDES[id].feel === null, id);
    }
  });

  test('every Thai guide line is Thai', () => {
    for (const p of STYLE_PRESETS) {
      for (const point of styleGuideView(p.id, 'th').points) {
        assert.match(point.label, THAI, p.id);
        assert.match(point.text, THAI, `${p.id}: ${point.label}`);
      }
    }
  });

  test('the Thai guide has as many lines as the English one for every style', () => {
    for (const p of STYLE_PRESETS) {
      assert.equal(styleGuideView(p.id, 'th').points.length, styleGuideView(p.id).points.length, p.id);
    }
  });

  test('the Thai guide gives the same figures as the English one', () => {
    const figures = (pts) => pts.flatMap((x) => x.text.match(/\d+(\.\d+)?/g) ?? []).sort();
    for (const p of STYLE_PRESETS) {
      assert.deepEqual(figures(styleGuideView(p.id, 'th').points), figures(styleGuideView(p.id).points), p.id);
    }
  });

  test('guideForStyle picks the language, and English stays the default', () => {
    assert.equal(guideForStyle('wheat'), STYLE_GUIDES.wheat);
    assert.equal(guideForStyle('wheat', 'th'), STYLE_GUIDES_TH.wheat);
    assert.equal(guideForStyle('toString', 'th'), null);
  });
});

// ==========================================================================
// THAI.md, the list for the native-speaker check
// ==========================================================================

describe('THAI.md lists every Thai string (T15)', () => {
  test('every Thai string in i18n.js is in THAI.md', () => {
    for (const { path, value } of strings(TEXT.th)) {
      if (!THAI.test(value)) continue;
      assert.ok(THAI_MD.includes(value), `${path}: ${value}`);
    }
  });

  test('every Thai style guide line is in THAI.md', () => {
    for (const [id, g] of Object.entries(STYLE_GUIDES_TH)) {
      for (const s of [g.feel, ...g.points.flatMap((p) => [p.label, p.text])].filter(Boolean)) {
        assert.ok(THAI_MD.includes(s), `${id}: ${s}`);
      }
    }
  });

  test('every piece of Thai text on the Thai pages is in THAI.md', () => {
    for (const file of readdirSync(TH_DIR).filter((f) => f.endsWith('.html'))) {
      const html = readFileSync(new URL(file, TH_DIR), 'utf8');
      const pieces = [
        ...html.replace(/<script\b[\s\S]*?<\/script>/gi, '').split(/<[^>]*>/),
        ...[...html.matchAll(/\s(?:content|aria-label)="([^"]*)"/g)].map((m) => m[1]),
      ]
        .map((s) => s.replace(/\s+/g, ' ').trim())
        .filter((s) => THAI.test(s));
      for (const piece of pieces) assert.ok(THAI_MD.includes(piece), `${file}: ${piece}`);
    }
  });
});
