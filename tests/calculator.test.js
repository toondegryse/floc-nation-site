// Tests for the calculator page wiring (docs/js/calculator.js).
//
// Part 1 checks computeView(), the pure function that decides what the page
// shows. Part 2 runs the real DOM wiring (initPage) against a small stand-in
// DOM built from docs/calculator.html, so the figures painted into the page
// are checked too. Node's built-in runner only, no packages.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CUSTOM_BOTTLE,
  DEFAULT_STYLE_ID,
  DEFAULT_VALUES,
  NOTES,
  computeView,
  styleGuideView,
  targetForStyle,
} from '../docs/js/calculator.js';
import { BOTTLE_SIZES_ML, STYLE_PRESETS, calculatePriming, residualCO2 } from '../docs/js/priming.js';
import { TEXT } from '../docs/js/i18n.js';

const PROJECT_MD = readFileSync(new URL('../PROJECT.md', import.meta.url), 'utf8');
const CALCULATOR_HTML = readFileSync(new URL('../docs/calculator.html', import.meta.url), 'utf8');
const CALCULATOR_TH_HTML = readFileSync(new URL('../docs/th/calculator.html', import.meta.url), 'utf8');

// ==========================================================================
// Expected values, copied from PROJECT.md ("Calculator reference")
// ==========================================================================

// Reference cases (dextrose, 330 ml bottles).
const REFERENCE_CASES = [
  { litres: '20', tempC: '20', targetVols: '2.4', batchGrams: 123.1, per330: 2.03 },
  { litres: '10', tempC: '25', targetVols: '2.6', batchGrams: 73.7, per330: 2.43 },
  { litres: '23', tempC: '30', targetVols: '3.5', batchGrams: 257.9, per330: 3.7 },
];
const BATCH_TOLERANCE = 0.5; // grams, as in PROJECT.md
const PER_BOTTLE_TOLERANCE = 0.01; // grams; the table and the page both give two decimals

// Style presets: id, name, default, range.
const STYLES = [
  { id: 'british-ales', name: 'British ales', target: '1.8', min: '1.5', max: '2.0' },
  { id: 'stout-porter', name: 'Stout and porter', target: '2.0', min: '1.8', max: '2.3' },
  { id: 'american-ale-ipa', name: 'American ales and IPA', target: '2.4', min: '2.2', max: '2.7' },
  { id: 'lager-pilsner', name: 'Lager and pilsner', target: '2.5', min: '2.4', max: '2.6' },
  { id: 'wheat', name: 'Wheat beer', target: '3.5', min: '3.3', max: '4.5' },
];

const PAGE_BOTTLE_SIZES = ['330', '500', '620', '640'];

// Safety notes, word for word.
const HIGH_PRESSURE_TEXT = 'Use bottles rated for high pressure.';
const NO_SUGAR_TEXT = 'No sugar needed: the beer already holds this much CO2.';

// Messages shown next to the fields.
const MSG = {
  litresEnter: 'Enter the beer volume in litres.',
  litresNumber: 'Beer volume must be a number.',
  litresPositive: 'Beer volume must be more than 0 litres.',
  tempEnter: 'Enter the highest temperature the beer reached.',
  tempNumber: 'Temperature must be a number.',
  tempRange: 'Temperature must be between 0 and 40 °C.',
  targetEnter: 'Enter a target CO2 level in volumes.',
  targetNumber: 'Target CO2 must be a number.',
  targetPositive: 'Target CO2 must be more than 0 volumes.',
  bottleEnter: 'Enter the bottle size in ml.',
  bottleNumber: 'Bottle size must be a number.',
  bottlePositive: 'Bottle size must be more than 0 ml.',
  bottleTooBig: "Bottle size can't be bigger than the whole batch.",
  sugar: 'Sugar type must be dextrose or table sugar.',
  // Upper limits (T21)
  litresMax: 'Beer volume must be 10,000 litres or less.',
  bottleMax: 'Bottle size must be 20,000 ml or less.',
  targetMax: 'Target CO2 must be 10 volumes or less.',
};
const PROMPT_FIX = 'Fix the marked fields to see the result.';
const PROMPT_CHECK = "The calculator can't work with these numbers. Check each field.";

// ==========================================================================
// Helpers
// ==========================================================================

// A valid page state: the first reference case, 330 ml bottles, dextrose.
const BASE = {
  litres: '20',
  bottleSize: '330',
  customBottleMl: '',
  style: 'american-ale-ipa',
  targetVols: '2.4',
  tempC: '20',
  sugar: 'dextrose',
};
const view = (overrides = {}, options) => computeView({ ...BASE, ...overrides }, options);

/** What priming.js gives for the same inputs, passed as numbers. */
function moduleResult({ litres, tempC, targetVols, bottleMl = 330, sugar = 'dextrose' }) {
  return calculatePriming({
    litres: Number(litres),
    tempC: Number(tempC),
    targetVols: Number(targetVols),
    bottleMl: Number(bottleMl),
    sugar,
  });
}

function assertNear(actual, expected, tolerance) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected} ± ${tolerance}, got ${actual}`);
}

/** The page shows the module's figures, rounded the page's way. */
function assertShowsModule(v, expected) {
  assert.equal(v.hasResult, true, `expected a result, got errors ${JSON.stringify(v.errors)}`);
  assert.equal(v.batchText, expected.batchGrams.toFixed(1), 'batch figure');
  assert.equal(v.perBottleText, expected.perBottleGrams.toFixed(2), 'per-bottle figure');
}

function assertNoResult(v) {
  assert.equal(v.hasResult, false, 'hasResult');
  assert.equal(v.result, null, 'result');
  assert.equal(v.batchText, '', 'batchText');
  assert.equal(v.perBottleText, '', 'perBottleText');
  assert.equal(v.perBottleLabel, '', 'perBottleLabel');
  assert.equal(v.residualText, '', 'residualText');
  assert.deepEqual(v.notes, [], 'no safety notes without a result');
}

/** Exactly one error, on the given field, and no result. */
function assertFieldError(v, field, message) {
  assert.deepEqual(v.errors, { [field]: message });
  assertNoResult(v);
  assert.equal(v.prompt, PROMPT_FIX);
}

const label = (c) => `${c.litres} L, ${c.tempC} °C, ${c.targetVols} vols`;

// ==========================================================================
// Part 1: computeView
// ==========================================================================

describe('reference cases on the page (dextrose, 330 ml)', () => {
  for (const c of REFERENCE_CASES) {
    test(`${label(c)}: page figures equal calculatePriming rounded to 1 and 2 decimals`, () => {
      assertShowsModule(view(c), moduleResult(c));
    });

    test(`${label(c)}: page figures are within tolerance of the PROJECT.md table (${c.batchGrams} g, ${c.per330} g)`, () => {
      const v = view(c);
      assertNear(Number(v.batchText), c.batchGrams, BATCH_TOLERANCE);
      assertNear(Number(v.perBottleText), c.per330, PER_BOTTLE_TOLERANCE);
    });

    test(`${label(c)}: residual CO2 line shows the module's residual to 2 decimals`, () => {
      const expected = moduleResult(c).residual.toFixed(2);
      assert.equal(view(c).residualText, `The beer already holds about ${expected} volumes of CO2.`);
    });
  }

  test('dextrose labels name dextrose and the 330 ml bottle', () => {
    const v = view();
    assert.equal(v.batchLabel, 'Dextrose for the whole batch');
    assert.equal(v.perBottleLabel, 'Dextrose per 330 ml bottle');
  });
});

describe('table sugar', () => {
  for (const c of REFERENCE_CASES) {
    test(`${label(c)}: table sugar figures equal calculatePriming with table sugar`, () => {
      assertShowsModule(view({ ...c, sugar: 'table' }), moduleResult({ ...c, sugar: 'table' }));
    });
  }

  test('table sugar needs 3.82/4.0 of the dextrose amount', () => {
    const dextrose = view({ sugar: 'dextrose' }).result.batchGrams;
    const table = view({ sugar: 'table' }).result.batchGrams;
    assertNear(table / dextrose, 3.82 / 4.0, 1e-12);
  });

  test('table sugar labels say "Table sugar"', () => {
    const v = view({ sugar: 'table' });
    assert.equal(v.batchLabel, 'Table sugar for the whole batch');
    assert.equal(v.perBottleLabel, 'Table sugar per 330 ml bottle');
  });
});

describe('bottle sizes', () => {
  test('the page offers the PROJECT.md bottle sizes (330, 500, 620, 640 ml)', () => {
    assert.deepEqual(BOTTLE_SIZES_ML.map(String), PAGE_BOTTLE_SIZES);
  });

  for (const ml of PAGE_BOTTLE_SIZES) {
    test(`${ml} ml bottle: per-bottle figure and label match calculatePriming`, () => {
      const v = view({ bottleSize: ml });
      assertShowsModule(v, moduleResult({ ...BASE, bottleMl: ml }));
      assert.equal(v.perBottleLabel, `Dextrose per ${ml} ml bottle`);
      assert.equal(v.showCustomBottle, false);
    });
  }

  test('a custom 750 ml bottle: per-bottle figure and label match calculatePriming', () => {
    const v = view({ bottleSize: CUSTOM_BOTTLE, customBottleMl: '750' });
    assertShowsModule(v, moduleResult({ ...BASE, bottleMl: 750 }));
    assert.equal(v.perBottleLabel, 'Dextrose per 750 ml bottle');
  });

  test('the custom size field shows only when Custom size is picked', () => {
    assert.equal(CUSTOM_BOTTLE, 'custom');
    assert.equal(view({ bottleSize: CUSTOM_BOTTLE, customBottleMl: '750' }).showCustomBottle, true);
    assert.equal(view({ bottleSize: '330' }).showCustomBottle, false);
  });

  test('a leftover custom size is ignored when a listed size is picked', () => {
    const v = view({ bottleSize: '500', customBottleMl: '0' });
    assert.deepEqual(v.errors, {});
    assertShowsModule(v, moduleResult({ ...BASE, bottleMl: 500 }));
  });

  test('bottle size does not change the batch figure', () => {
    const batches = PAGE_BOTTLE_SIZES.map((ml) => view({ bottleSize: ml }).batchText);
    assert.deepEqual(new Set(batches).size, 1, `batch figures: ${batches.join(', ')}`);
  });

  test('a bottle exactly the size of the batch is allowed and gets all the sugar', () => {
    const v = view({ litres: '0.33', bottleSize: '330' });
    assert.deepEqual(v.errors, {});
    assert.equal(v.perBottleText, v.result.batchGrams.toFixed(2));
  });

  test('330 ml is the bottle size when none is given', () => {
    const { bottleSize, ...rest } = BASE;
    assert.equal(computeView(rest).perBottleLabel, 'Dextrose per 330 ml bottle');
  });
});

describe('style presets', () => {
  test('the module has exactly the PROJECT.md styles plus Custom', () => {
    assert.deepEqual(
      STYLE_PRESETS.map((p) => p.id),
      [...STYLES.map((s) => s.id), 'custom'],
    );
  });

  for (const s of STYLES) {
    test(`${s.name} fills in its default target of ${s.target} volumes`, () => {
      assert.equal(targetForStyle(s.id), s.target);
    });

    test(`${s.name} hint gives the PROJECT.md range ${s.min} to ${s.max} volumes`, () => {
      const v = view({ style: s.id, targetVols: s.target });
      assert.equal(v.targetHint, `${s.name}: usually ${s.min} to ${s.max} volumes.`);
    });

    test(`${s.name} default target gives the calculatePriming figures`, () => {
      const v = view({ style: s.id, targetVols: targetForStyle(s.id) });
      assertShowsModule(v, moduleResult({ ...BASE, targetVols: s.target }));
    });
  }

  test('Custom style fills in no target (null)', () => {
    assert.equal(targetForStyle('custom'), null);
  });

  test('an unknown style id fills in no target (null)', () => {
    assert.equal(targetForStyle('not-a-style'), null);
  });

  test('Custom style shows the "type the CO2 level" hint', () => {
    assert.equal(view({ style: 'custom', targetVols: '2.4' }).targetHint, 'Type the CO2 level you want, in volumes.');
  });

  test('a target outside the style range adds a warning to the hint', () => {
    assert.equal(
      view({ style: 'american-ale-ipa', targetVols: '3.5' }).targetHint,
      'American ales and IPA: usually 2.2 to 2.7 volumes. Your target is outside this range.',
    );
  });

  test('the page opens on American ales and IPA at 2.4 volumes', () => {
    assert.equal(DEFAULT_STYLE_ID, 'american-ale-ipa');
    assert.equal(DEFAULT_VALUES.style, 'american-ale-ipa');
    assert.equal(DEFAULT_VALUES.targetVols, '2.4');
  });
});

describe('safety notes', () => {
  test('both notes are worded exactly as in PROJECT.md', () => {
    assert.equal(NOTES.highPressure, HIGH_PRESSURE_TEXT);
    assert.equal(NOTES.noSugarNeeded, NO_SUGAR_TEXT);
    assert.ok(PROJECT_MD.includes(`"${HIGH_PRESSURE_TEXT}"`), 'high-pressure wording is in PROJECT.md');
    assert.ok(PROJECT_MD.includes(`"${NO_SUGAR_TEXT}"`), 'no-sugar wording is in PROJECT.md');
  });

  test('a target below the residual CO2 shows the no-sugar note', () => {
    const v = view({ targetVols: '0.5' }); // residual at 20 °C is about 0.86
    assert.equal(v.hasResult, true);
    assert.deepEqual(v.notes, [NO_SUGAR_TEXT]);
  });

  test('a target below the residual CO2 shows 0.0 g and 0.00 g with no minus sign', () => {
    for (const targetVols of ['0.1', '0.5', '0.86']) {
      for (const sugar of ['dextrose', 'table']) {
        const v = view({ targetVols, sugar });
        assert.equal(v.batchText, '0.0', `batch for ${targetVols} vols, ${sugar}`);
        assert.equal(v.perBottleText, '0.00', `per bottle for ${targetVols} vols, ${sugar}`);
      }
    }
  });

  test('a target exactly at the residual CO2 shows the no-sugar note and 0.0 g', () => {
    const atResidual = String(residualCO2(20)); // round-trips to the exact same number
    const v = view({ targetVols: atResidual });
    assert.deepEqual(v.notes, [NO_SUGAR_TEXT]);
    assert.equal(v.batchText, '0.0');
    assert.equal(v.perBottleText, '0.00');
  });

  test('a target just above the residual CO2 needs sugar and shows no note', () => {
    const v = view({ targetVols: String(residualCO2(20) + 0.01) });
    assert.deepEqual(v.notes, []);
    assert.ok(v.result.batchGrams > 0);
  });

  test('a target of exactly 3.0 volumes shows no high-pressure note', () => {
    for (const targetVols of ['3', '3.0']) {
      assert.deepEqual(view({ targetVols }).notes, [], targetVols);
    }
  });

  test('a target just above 3.0 volumes (3.01) shows the high-pressure note', () => {
    assert.deepEqual(view({ targetVols: '3.01' }).notes, [HIGH_PRESSURE_TEXT]);
  });

  test('a high-pressure target still shows the sugar figures', () => {
    const v = view({ targetVols: '3.5' });
    assert.deepEqual(v.notes, [HIGH_PRESSURE_TEXT]);
    assertShowsModule(v, moduleResult({ ...BASE, targetVols: 3.5 }));
  });

  test('a normal target shows no safety notes', () => {
    assert.deepEqual(view({ targetVols: '2.4' }).notes, []);
  });
});

describe('bad input: one message on the right field, no result, no notes', () => {
  const cases = [
    ['litres', '0', MSG.litresPositive],
    ['litres', '-5', MSG.litresPositive],
    ['litres', 'abc', MSG.litresNumber],
    ['litres', '', MSG.litresEnter],
    ['litres', '   ', MSG.litresEnter],
    ['tempC', '-1', MSG.tempRange],
    ['tempC', '45', MSG.tempRange],
    ['tempC', '-0.01', MSG.tempRange],
    ['tempC', '40.01', MSG.tempRange],
    ['tempC', 'warm', MSG.tempNumber],
    ['tempC', '', MSG.tempEnter],
    ['targetVols', '0', MSG.targetPositive],
    ['targetVols', '-1', MSG.targetPositive],
    ['targetVols', 'fizzy', MSG.targetNumber],
    ['targetVols', '', MSG.targetEnter],
  ];
  for (const [field, value, message] of cases) {
    test(`${field} "${value}" gives "${message}"`, () => {
      // A target of 3.5 or 0.5 would add a note if a result slipped through.
      const v = view({ [field]: value, ...(field === 'targetVols' ? {} : { targetVols: '3.5' }) });
      assertFieldError(v, field, message);
    });
  }

  for (const [value, message] of [['0', MSG.bottlePositive], ['-330', MSG.bottlePositive], ['', MSG.bottleEnter], ['big', MSG.bottleNumber]]) {
    test(`custom bottle "${value}" gives "${message}" on the custom size field`, () => {
      assertFieldError(view({ bottleSize: CUSTOM_BOTTLE, customBottleMl: value }), 'customBottleMl', message);
    });
  }

  test('a listed bottle bigger than the batch gives an error on the bottle size field', () => {
    assertFieldError(view({ litres: '0.2', bottleSize: '330' }), 'bottleSize', MSG.bottleTooBig);
  });

  test('a custom bottle bigger than the batch gives an error on the custom size field', () => {
    assertFieldError(view({ litres: '0.5', bottleSize: CUSTOM_BOTTLE, customBottleMl: '750' }), 'customBottleMl', MSG.bottleTooBig);
  });

  for (const sugar of ['honey', '']) {
    test(`unknown sugar "${sugar}" gives an error on the sugar field`, () => {
      const v = view({ sugar });
      assertFieldError(v, 'sugar', MSG.sugar);
      assert.equal(v.batchLabel, 'Sugar for the whole batch');
    });
  }
});

describe('several bad fields at once', () => {
  test('four bad fields each get their own message', () => {
    const v = view({ litres: '0', tempC: '45', targetVols: '-1', sugar: 'honey' });
    assert.deepEqual(v.errors, {
      litres: MSG.litresPositive,
      tempC: MSG.tempRange,
      targetVols: MSG.targetPositive,
      sugar: MSG.sugar,
    });
    assertNoResult(v);
  });

  test('four empty text fields each get their own "Enter" message', () => {
    const v = view({ litres: '', tempC: '', targetVols: '', bottleSize: CUSTOM_BOTTLE, customBottleMl: '' });
    assert.deepEqual(v.errors, {
      litres: MSG.litresEnter,
      tempC: MSG.tempEnter,
      targetVols: MSG.targetEnter,
      customBottleMl: MSG.bottleEnter,
    });
    assertNoResult(v);
  });

  test('a bad temperature and a bottle bigger than the batch each get their own message', () => {
    const v = view({ litres: '0.2', tempC: '45' });
    assert.deepEqual(v.errors, { tempC: MSG.tempRange, bottleSize: MSG.bottleTooBig });
    assertNoResult(v);
  });

  test('a bad custom bottle and a bad sugar each get their own message', () => {
    const v = view({ bottleSize: CUSTOM_BOTTLE, customBottleMl: '0', sugar: 'honey' });
    assert.deepEqual(v.errors, { customBottleMl: MSG.bottlePositive, sugar: MSG.sugar });
    assertNoResult(v);
  });

  // Known gap, not reachable on the page (the sugar radios always have one
  // checked). The bottle stand-in (330 ml) is still bigger than a tiny batch,
  // so runCalculator stops before it reaches the sugar check.
  test(
    'a bottle bigger than the batch and an unknown sugar each get their own message',
    { todo: 'sugar message is lost when the batch is smaller than 330 ml; not reachable from the page' },
    () => {
      const v = view({ litres: '0.2', sugar: 'honey' });
      assert.deepEqual(v.errors, { bottleSize: MSG.bottleTooBig, sugar: MSG.sugar });
    },
  );
});

describe('touched fields', () => {
  test('untouched empty fields give a prompt, not an error', () => {
    const v = computeView({ litres: '', tempC: '' }, { touched: new Set() });
    assert.deepEqual(v.errors, {});
    assertNoResult(v);
    assert.equal(v.prompt, 'Fill in the beer volume and highest temperature to see how much sugar to add.');
  });

  test('the prompt names every untouched empty field in page order', () => {
    const v = computeView(
      { litres: '', bottleSize: CUSTOM_BOTTLE, customBottleMl: '', targetVols: '', tempC: '' },
      { touched: new Set() },
    );
    assert.deepEqual(v.errors, {});
    assert.equal(
      v.prompt,
      'Fill in the beer volume, bottle size, target CO2 and highest temperature to see how much sugar to add.',
    );
  });

  test('a touched empty field gives its error', () => {
    const v = view({ litres: '' }, { touched: new Set(['litres']) });
    assertFieldError(v, 'litres', MSG.litresEnter);
  });

  test('an untouched field with a bad value still gives its error', () => {
    const v = view({ litres: '0' }, { touched: new Set() });
    assertFieldError(v, 'litres', MSG.litresPositive);
  });

  test('an untouched empty field next to a real error gives the "fix the marked fields" prompt', () => {
    const v = view({ litres: '', tempC: '45' }, { touched: new Set() });
    assert.deepEqual(v.errors, { tempC: MSG.tempRange });
    assert.equal(v.prompt, PROMPT_FIX);
  });

  test('touched works as an array as well as a Set', () => {
    const raw = { ...BASE, litres: '', tempC: '' };
    assert.deepEqual(computeView(raw, { touched: ['litres'] }), computeView(raw, { touched: new Set(['litres']) }));
    assert.deepEqual(computeView(raw, { touched: ['litres'] }).errors, { litres: MSG.litresEnter });
  });

  test('without touched, every message is returned', () => {
    const v = computeView({ litres: '', tempC: '' });
    assert.deepEqual(v.errors, { litres: MSG.litresEnter, tempC: MSG.tempEnter });
    assert.equal(v.prompt, PROMPT_FIX);
  });

  test('a valid result has an empty prompt', () => {
    assert.equal(view({}, { touched: new Set() }).prompt, '');
  });
});

describe('computeView purity and defaults', () => {
  test('computeView does not change its input object', () => {
    const raw = Object.freeze({ ...BASE, litres: '', tempC: '45' });
    const touched = new Set(['litres']);
    const before = JSON.stringify(raw);
    computeView(raw, { touched }); // a frozen object would throw in strict mode if written to
    assert.equal(JSON.stringify(raw), before);
    assert.deepEqual([...touched], ['litres']);
  });

  test('computeView gives the same output twice', () => {
    for (const raw of [BASE, { ...BASE, targetVols: '0.5' }, { ...BASE, litres: '0', tempC: '45' }]) {
      assert.deepEqual(computeView(raw), computeView(raw));
    }
  });

  test('missing fields take the values the page opens with', () => {
    assert.deepEqual(computeView({}), computeView({ ...DEFAULT_VALUES }));
    assert.deepEqual(computeView(), computeView({ ...DEFAULT_VALUES }));
    assert.deepEqual(
      computeView({ litres: '20', tempC: '20' }),
      computeView({ ...DEFAULT_VALUES, litres: '20', tempC: '20' }),
    );
  });

  test('a field given as undefined takes its opening value', () => {
    assert.deepEqual(computeView({ ...BASE, targetVols: undefined }), computeView({ ...BASE, targetVols: '2.4' }));
  });
});

describe('edge cases in typed text', () => {
  test('spaces around a number are ignored (" 20 " reads as 20 litres)', () => {
    assert.deepEqual(view({ litres: ' 20 ' }).result, view({ litres: '20' }).result);
  });

  test('exponent notation reads as the same number ("2e1" reads as 20 litres)', () => {
    assert.deepEqual(view({ litres: '2e1' }).result, view({ litres: '20' }).result);
  });

  test('a comma decimal ("20,5") gives a "must be a number" error, not a wrong figure', () => {
    assertFieldError(view({ litres: '20,5' }), 'litres', MSG.litresNumber);
  });

  test('"Infinity" and an overflowing number ("1e309") give a "must be a number" error', () => {
    for (const litres of ['Infinity', '1e309']) {
      assertFieldError(view({ litres }), 'litres', MSG.litresNumber);
    }
  });

  // Hex, binary and octal text is not a decimal number. A brewer who types
  // it has made a typo; the page must not read it as a volume or temperature.
  const nonDecimal = [
    { field: 'litres', texts: ['0x14', '0b10100', '0o24'], message: MSG.litresNumber, extra: {} },
    { field: 'tempC', texts: ['0x14', '0b10100', '0o24'], message: MSG.tempNumber, extra: {} },
    { field: 'targetVols', texts: ['0x2', '0b10', '0o2'], message: MSG.targetNumber, extra: {} },
    {
      field: 'customBottleMl',
      texts: ['0x14A', '0b101001010', '0o512'],
      message: MSG.bottleNumber,
      extra: { bottleSize: CUSTOM_BOTTLE },
    },
  ];
  for (const { field, texts, message, extra } of nonDecimal) {
    test(`${field}: hex, binary and octal text (${texts.join(', ')}) gives "${message}"`, () => {
      for (const text of texts) {
        const v = view({ ...extra, [field]: text });
        assert.deepEqual(v.errors, { [field]: message }, `"${text}" was read as ${Number(text)}`);
        assertNoResult(v);
      }
    });
  }

  // Was 1,000,000 litres until T21 set the largest batch at 10,000 litres.
  test('the largest batch (10,000 litres) gives the calculatePriming figures', () => {
    const v = view({ litres: '10000' });
    assertShowsModule(v, moduleResult({ ...BASE, litres: 1e4 }));
    // (2.4 − 0.8614872) × 10,000 × 4.0 = 61,540.512 g
    assert.equal(v.batchText, '61540.5');
  });

  test('0 °C is accepted and gives the calculatePriming figures', () => {
    assertShowsModule(view({ tempC: '0' }), moduleResult({ ...BASE, tempC: 0 }));
  });

  test('40 °C is accepted and gives the calculatePriming figures', () => {
    assertShowsModule(view({ tempC: '40' }), moduleResult({ ...BASE, tempC: 40 }));
  });
});

// Added by the tester in the T6a second review.
describe('typed text in every text field (T6a second review)', () => {
  const FIELDS = [
    {
      field: 'litres', extra: {}, number: MSG.litresNumber, enter: MSG.litresEnter,
      upper: ['0X14', '0B10100', '0O24'], plus: ['+20', '20'], leading: ['.5', '0.5'], trailing: ['20.', '20'], comma: '20,5',
    },
    {
      field: 'tempC', extra: {}, number: MSG.tempNumber, enter: MSG.tempEnter,
      upper: ['0X14', '0B10100', '0O24'], plus: ['+20', '20'], leading: ['.5', '0.5'], trailing: ['20.', '20'], comma: '20,5',
    },
    {
      field: 'targetVols', extra: {}, number: MSG.targetNumber, enter: MSG.targetEnter,
      upper: ['0X2', '0B10', '0O2'], plus: ['+2.4', '2.4'], leading: ['.5', '0.5'], trailing: ['3.', '3'], comma: '2,4',
    },
    {
      field: 'customBottleMl', extra: { bottleSize: CUSTOM_BOTTLE }, number: MSG.bottleNumber, enter: MSG.bottleEnter,
      upper: ['0X14A', '0B101001010', '0O512'], plus: ['+330', '330'], leading: ['.5', '0.5'], trailing: ['330.', '330'], comma: '330,5',
    },
  ];

  for (const { field, extra, number, upper } of FIELDS) {
    test(`${field}: upper-case hex, binary and octal text (${upper.join(', ')}) gives "${number}"`, () => {
      for (const text of upper) {
        const v = view({ ...extra, [field]: text });
        assert.deepEqual(v.errors, { [field]: number }, `"${text}" was read as ${Number(text)}`);
        assertNoResult(v);
      }
    });
  }

  const ACCEPTED = [
    { key: 'plus', what: 'a leading plus sign' },
    { key: 'leading', what: 'a leading point' },
    { key: 'trailing', what: 'a trailing point' },
  ];
  for (const { key, what } of ACCEPTED) {
    test(`${what} shows the same as the plain number in every text field`, () => {
      for (const f of FIELDS) {
        const [text, plain] = f[key];
        const v = view({ ...f.extra, [f.field]: text });
        assert.equal(v.hasResult, true, `${f.field} "${text}": ${JSON.stringify(v.errors)}`);
        assert.deepEqual(v, view({ ...f.extra, [f.field]: plain }), `${f.field} "${text}" vs "${plain}"`);
      }
    });
  }

  test('blank text (spaces, a tab, a newline) gives the "Enter" message in every text field', () => {
    for (const { field, extra, enter } of FIELDS) {
      for (const text of ['   ', '\t', ' \n ']) {
        assertFieldError(view({ ...extra, [field]: text }), field, enter);
      }
    }
  });

  test('a comma decimal gives "must be a number" in every text field', () => {
    for (const { field, extra, number, comma } of FIELDS) {
      assertFieldError(view({ ...extra, [field]: comma }), field, number);
    }
  });

  for (const { field, extra, number } of FIELDS) {
    test(`${field}: a very long non-number (50,000 digits then "x") gives "${number}" in under 250 ms`, () => {
      const text = `${'1'.repeat(50_000)}x`;
      const start = performance.now();
      const v = view({ ...extra, [field]: text });
      const ms = performance.now() - start;
      assert.deepEqual(v.errors, { [field]: number });
      assertNoResult(v);
      assert.ok(ms < 250, `took ${ms.toFixed(0)} ms to reject ${text.length} characters`);
    });
  }
});

// Added by the tester in the T6 second run.
describe('safety notes: more edge cases (T6 second run)', () => {
  // Was parked as a todo (T6 failed review twice). Toon approved the fix on
  // 28 Nov: a target within 1e-9 volumes of the residual counts as at it.
  test('a target typed as the exact PROJECT.md residual (0.8614872 at 20 °C) shows the no-sugar note and 0.0 g', () => {
    // 20 °C = 68 °F: 3.0378 − 0.050062 × 68 + 0.00026555 × 68² = 0.8614872 exactly.
    const v = view({ tempC: '20', targetVols: '0.8614872' });
    assert.deepEqual(v.notes, [NO_SUGAR_TEXT], `notes: ${JSON.stringify(v.notes)}, batch ${v.result?.batchGrams} g`);
    assert.equal(v.result.batchGrams, 0);
    assert.equal(v.batchText, '0.0');
    assert.equal(v.perBottleText, '0.00');
  });

  test('a target 0.001 vols above the exact residual (0.8624872 at 20 °C) needs sugar and shows no note', () => {
    // 0.001 vols × 20 L × 4.0 g = 0.08 g, shown as 0.1 g for the batch.
    const v = view({ tempC: '20', targetVols: '0.8624872' });
    assert.deepEqual(v.notes, [], `notes: ${JSON.stringify(v.notes)}`);
    assert.ok(Math.abs(v.result.batchGrams - 0.08) <= 1e-9, `batch ${v.result.batchGrams} g`);
    assert.equal(v.batchText, '0.1');
  });

  test('table sugar shows the same safety notes as dextrose', () => {
    for (const targetVols of ['0.5', '2.4', '3.0', '3.01', '3.5']) {
      assert.deepEqual(
        view({ targetVols, sugar: 'table' }).notes,
        view({ targetVols, sugar: 'dextrose' }).notes,
        `target ${targetVols}`,
      );
    }
    assert.deepEqual(view({ targetVols: '3.5', sugar: 'table' }).notes, [HIGH_PRESSURE_TEXT]);
    assert.deepEqual(view({ targetVols: '0.5', sugar: 'table' }).notes, [NO_SUGAR_TEXT]);
  });
});

// ==========================================================================
// Part 2: the DOM wiring, run against a stand-in DOM
// ==========================================================================
//
// Just enough DOM for initPage(): elements from calculator.html with their
// ids and attributes, value/hidden/textContent, attributes, events, and
// <select> elements that only take a value one of their options has.

class FakeElement {
  constructor(doc, tagName, attrs = {}) {
    this.ownerDocument = doc;
    this.tagName = tagName.toUpperCase();
    this.attrs = new Map(Object.entries(attrs));
    this.id = attrs.id ?? '';
    this.hidden = 'hidden' in attrs;
    this.checked = 'checked' in attrs;
    if (this.tagName !== 'SELECT') this.value = attrs.value ?? '';
    this.textContent = '';
    this.children = [];
    this.listeners = new Map();
  }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  hasAttribute(name) { return this.attrs.has(name); }
  removeAttribute(name) { this.attrs.delete(name); }
  append(child) { this.children.push(child); }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  fire(type) {
    for (const fn of this.listeners.get(type) ?? []) fn({ type, target: this });
  }
}

class FakeSelect extends FakeElement {
  selected = '';
  get value() { return this.selected; }
  set value(v) { this.selected = this.children.some((o) => o.value === String(v)) ? String(v) : ''; }
  append(child) {
    super.append(child);
    if (this.children.length === 1) this.selected = child.value; // first option starts selected
  }
}

function matchesSelector(el, selector) {
  const m = selector.match(/^([a-z]*)((?:\[[^\]]+\])*)$/i);
  if (!m) throw new Error(`stand-in DOM can't read the selector ${selector}`);
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  for (const [, name, value] of m[2].matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)) {
    if (value === undefined ? !el.hasAttribute(name) : el.getAttribute(name) !== value) return false;
  }
  return true;
}

function makeElement(doc, tag, attrs = {}) {
  const lower = tag.toLowerCase();
  return lower === 'select' ? new FakeSelect(doc, lower, attrs) : new FakeElement(doc, lower, attrs);
}

function buildDocument(html) {
  const all = [];
  const byId = new Map();
  const doc = {
    readyState: 'complete',
    getElementById: (id) => byId.get(id) ?? null,
    querySelectorAll: (selector) => all.filter((el) => matchesSelector(el, selector)),
    createElement: (tag) => makeElement(doc, tag),
    addEventListener() {},
  };
  for (const [, tag, attrText = ''] of html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g)) {
    const attrs = {};
    for (const [, name, value] of attrText.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*"([^"]*)")?/g)) {
      attrs[name] = value ?? '';
    }
    const el = makeElement(doc, tag, attrs);
    all.push(el);
    if (attrs.id) byId.set(attrs.id, el);
  }
  // The <html> element, so the page can read its lang attribute.
  doc.documentElement = all.find((el) => el.tagName === 'HTML') ?? null;
  return doc;
}

let pageCount = 0;

/** Loads a fresh copy of calculator.js with a stand-in document, so initPage() runs. */
async function openPage(html = CALCULATOR_HTML) {
  const doc = buildDocument(html);
  globalThis.document = doc;
  try {
    pageCount += 1;
    await import(`../docs/js/calculator.js?page=${pageCount}`);
  } finally {
    delete globalThis.document;
  }
  const el = (id) => {
    const found = doc.getElementById(id);
    assert.ok(found, `#${id} is on calculator.html`);
    return found;
  };
  return {
    el,
    type(id, value) { el(id).value = value; el(id).fire('input'); },
    leave(id) { el(id).fire('blur'); },
    pick(id, value) { el(id).value = value; assert.equal(el(id).value, value, `#${id} has an option ${value}`); el(id).fire('change'); },
    pickSugar(value) {
      const radios = doc.querySelectorAll('input[type="radio"][name="sugar"]');
      for (const r of radios) r.checked = r.value === value;
      radios.find((r) => r.value === value).fire('change');
    },
    shown: (id) => !el(id).hidden,
    text: (id) => el(id).textContent,
  };
}

async function openWithCase(c) {
  const page = await openPage();
  page.type('litres', c.litres);
  page.type('temp-c', c.tempC);
  page.type('target-vols', c.targetVols);
  return page;
}

describe('page wiring (stand-in DOM)', () => {
  test('the page opens on 330 ml, American ales and IPA at 2.4, with a prompt and no errors', async () => {
    const page = await openPage();
    assert.equal(page.el('bottle-size').value, '330');
    assert.equal(page.el('style').value, 'american-ale-ipa');
    assert.equal(page.el('target-vols').value, '2.4');
    assert.ok(page.shown('result-prompt'));
    assert.equal(page.text('result-prompt'), 'Fill in the beer volume and highest temperature to see how much sugar to add.');
    assert.ok(!page.shown('result-values'), 'no figures yet');
    for (const id of ['litres-error', 'bottle-size-error', 'custom-bottle-ml-error', 'target-vols-error', 'temp-c-error', 'sugar-error']) {
      assert.ok(!page.shown(id), `#${id} is hidden`);
    }
  });

  test('the bottle and style lists hold the PROJECT.md sizes and styles', async () => {
    const page = await openPage();
    assert.deepEqual(page.el('bottle-size').children.map((o) => o.value), [...PAGE_BOTTLE_SIZES, 'custom']);
    assert.deepEqual(page.el('style').children.map((o) => o.textContent), [...STYLES.map((s) => s.name), 'Custom']);
  });

  for (const c of REFERENCE_CASES) {
    test(`typing ${label(c)} shows the calculatePriming figures, within tolerance of the table`, async () => {
      const page = await openWithCase(c);
      const expected = moduleResult(c);
      assert.ok(page.shown('result-values'), 'figures are shown');
      assert.ok(!page.shown('result-prompt'), 'prompt is hidden');
      assert.equal(page.text('batch-grams'), expected.batchGrams.toFixed(1));
      assert.equal(page.text('per-bottle-grams'), expected.perBottleGrams.toFixed(2));
      assertNear(Number(page.text('batch-grams')), c.batchGrams, BATCH_TOLERANCE);
      assertNear(Number(page.text('per-bottle-grams')), c.per330, PER_BOTTLE_TOLERANCE);
      assert.equal(page.text('per-bottle-label'), 'Dextrose per 330 ml bottle');
    });
  }

  test('picking table sugar updates the figures and labels', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    page.pickSugar('table');
    const expected = moduleResult({ ...REFERENCE_CASES[0], sugar: 'table' });
    assert.equal(page.text('batch-grams'), expected.batchGrams.toFixed(1));
    assert.equal(page.text('per-bottle-grams'), expected.perBottleGrams.toFixed(2));
    assert.equal(page.text('batch-label'), 'Table sugar for the whole batch');
  });

  test('picking Wheat beer fills in 3.5 and shows the high-pressure note', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    assert.ok(!page.shown('note-high-pressure'));
    page.pick('style', 'wheat');
    assert.equal(page.el('target-vols').value, '3.5');
    assert.ok(page.shown('note-high-pressure'));
    assert.equal(page.text('note-high-pressure'), HIGH_PRESSURE_TEXT);
  });

  test('picking Custom style keeps the typed target', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    page.type('target-vols', '2.2');
    page.pick('style', 'custom');
    assert.equal(page.el('target-vols').value, '2.2');
  });

  test('a target below the residual shows the no-sugar note and 0.0 g', async () => {
    const page = await openWithCase({ ...REFERENCE_CASES[0], targetVols: '0.5' });
    assert.ok(page.shown('note-no-sugar'));
    assert.equal(page.text('note-no-sugar'), NO_SUGAR_TEXT);
    assert.equal(page.text('batch-grams'), '0.0');
    assert.equal(page.text('per-bottle-grams'), '0.00');
  });

  test('leaving the volume empty shows its error, marks it invalid and links the message', async () => {
    const page = await openPage();
    page.leave('litres');
    assert.ok(page.shown('litres-error'));
    assert.equal(page.text('litres-error'), MSG.litresEnter);
    assert.equal(page.el('litres').getAttribute('aria-invalid'), 'true');
    assert.equal(page.el('litres').getAttribute('aria-describedby'), 'litres-hint litres-error');
  });

  test('fixing a field clears its error and its aria-invalid', async () => {
    const page = await openPage();
    page.type('litres', '0');
    assert.ok(page.shown('litres-error'));
    page.type('litres', '20');
    assert.ok(!page.shown('litres-error'));
    assert.equal(page.el('litres').getAttribute('aria-invalid'), null);
    assert.equal(page.el('litres').getAttribute('aria-describedby'), 'litres-hint');
  });

  test('a temperature of 45 °C hides the figures and shows the range error', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    assert.ok(page.shown('result-values'));
    page.type('temp-c', '45');
    assert.ok(!page.shown('result-values'), 'figures are hidden');
    assert.ok(page.shown('temp-c-error'));
    assert.equal(page.text('temp-c-error'), MSG.tempRange);
    assert.ok(!page.shown('note-high-pressure') && !page.shown('note-no-sugar'), 'no notes');
  });

  test('picking Custom size shows the custom bottle field and uses it', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    assert.ok(!page.shown('custom-bottle'));
    page.pick('bottle-size', 'custom');
    assert.ok(page.shown('custom-bottle'));
    page.type('custom-bottle-ml', '750');
    assert.equal(page.text('per-bottle-label'), 'Dextrose per 750 ml bottle');
    assert.equal(page.text('per-bottle-grams'), moduleResult({ ...BASE, bottleMl: 750 }).perBottleGrams.toFixed(2));
  });
});

// Added by the tester in the T6 second run.
describe('page wiring: more edge cases (stand-in DOM, T6 second run)', () => {
  test('picking each style fills in its default target and shows the calculatePriming figures', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    for (const s of STYLES) {
      page.pick('style', s.id);
      assert.equal(page.el('target-vols').value, s.target, `${s.name} target`);
      const expected = moduleResult({ ...BASE, targetVols: s.target });
      assert.equal(page.text('batch-grams'), expected.batchGrams.toFixed(1), `${s.name} batch`);
      assert.equal(page.text('per-bottle-grams'), expected.perBottleGrams.toFixed(2), `${s.name} per bottle`);
    }
  });

  test('after picking a style the target stays editable and the figures follow the typed target', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    page.pick('style', 'lager-pilsner');
    assert.equal(page.el('target-vols').value, '2.5');
    page.type('target-vols', '2.7');
    assert.equal(page.el('style').value, 'lager-pilsner', 'style is kept');
    assert.equal(page.el('target-vols').value, '2.7', 'typed target is kept');
    assert.equal(page.text('batch-grams'), moduleResult({ ...BASE, targetVols: '2.7' }).batchGrams.toFixed(1));
  });

  test('picking each listed bottle size updates the per-bottle label and figure', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    for (const ml of PAGE_BOTTLE_SIZES) {
      page.pick('bottle-size', ml);
      assert.equal(page.text('per-bottle-label'), `Dextrose per ${ml} ml bottle`);
      assert.equal(page.text('per-bottle-grams'), moduleResult({ ...BASE, bottleMl: ml }).perBottleGrams.toFixed(2), `${ml} ml`);
      assert.ok(!page.shown('custom-bottle'), `custom field hidden for ${ml} ml`);
    }
  });

  test('a volume of 0 or less hides the figures and shows the volume error', async () => {
    for (const litres of ['0', '-5']) {
      const page = await openWithCase(REFERENCE_CASES[0]);
      assert.ok(page.shown('result-values'), 'figures shown before');
      page.type('litres', litres);
      assert.ok(!page.shown('result-values'), `figures hidden for ${litres} L`);
      assert.ok(page.shown('litres-error'));
      assert.equal(page.text('litres-error'), MSG.litresPositive);
      assert.ok(!page.shown('note-high-pressure') && !page.shown('note-no-sugar'), 'no notes');
    }
  });

  test('the high-pressure note hides again when the target goes back to 3.0 or below', async () => {
    const page = await openWithCase({ ...REFERENCE_CASES[0], targetVols: '3.5' });
    assert.ok(page.shown('note-high-pressure'));
    page.type('target-vols', '3.0');
    assert.ok(!page.shown('note-high-pressure'), 'hidden at exactly 3.0');
    page.type('target-vols', '3.01');
    assert.ok(page.shown('note-high-pressure'), 'shown at 3.01');
    page.type('target-vols', '2.4');
    assert.ok(!page.shown('note-high-pressure'), 'hidden at 2.4');
    assert.ok(page.shown('result-values'), 'figures still shown');
  });

  test('emptying a field after a result hides the figures and shows its "Enter" message', async () => {
    const fields = [
      ['litres', 'litres-error', MSG.litresEnter],
      ['temp-c', 'temp-c-error', MSG.tempEnter],
      ['target-vols', 'target-vols-error', MSG.targetEnter],
    ];
    for (const [id, errorId, message] of fields) {
      const page = await openWithCase(REFERENCE_CASES[0]);
      page.type(id, '');
      assert.ok(!page.shown('result-values'), `figures hidden when #${id} is empty`);
      assert.ok(page.shown(errorId));
      assert.equal(page.text(errorId), message);
    }
  });
});

// Added by the tester for T12 (beer style guide).
describe('style guide on the page (stand-in DOM, T12)', () => {
  const GUIDE_SLOTS = [1, 2, 3, 4];

  /** The guide lines painted into the panel, as { label, text }, visible slots only. */
  const paintedGuide = (page) =>
    GUIDE_SLOTS.filter((n) => page.shown(`style-guide-${n}`)).map((n) => ({
      label: page.text(`style-guide-${n}-label`),
      text: page.text(`style-guide-${n}-text`),
    }));

  test('the style menu options are plain style names with no figures', async () => {
    const page = await openPage();
    const names = page.el('style').children.map((o) => o.textContent);
    assert.deepEqual(names, STYLE_PRESETS.map((p) => p.name));
    for (const name of names) assert.doesNotMatch(name, /\d|volume|–|\(/, name);
  });

  test('the page opens with the default style guide shown under the style menu', async () => {
    const page = await openPage();
    assert.ok(page.shown('style-guide'), 'panel shown');
    assert.deepEqual(paintedGuide(page), styleGuideView(DEFAULT_STYLE_ID).points);
  });

  test('picking each style paints its guide lines into the panel, in order', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    for (const p of STYLE_PRESETS) {
      page.pick('style', p.id);
      assert.ok(page.shown('style-guide'), `${p.id}: panel shown`);
      assert.deepEqual(paintedGuide(page), styleGuideView(p.id).points, p.id);
    }
  });

  test('picking a style updates the guide and the target together', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    page.pick('style', 'wheat');
    assert.equal(page.el('target-vols').value, '3.5');
    assert.equal(page.text('style-guide-1-text'), styleGuideView('wheat').points[0].text);
    page.pick('style', 'british-ales');
    assert.equal(page.el('target-vols').value, '1.8');
    assert.equal(page.text('style-guide-1-text'), styleGuideView('british-ales').points[0].text);
  });

  test('typing in other fields leaves the guide for the picked style in place', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    page.pick('style', 'stout-porter');
    page.type('litres', '0');
    page.type('temp-c', '45');
    page.type('target-vols', '9');
    assert.deepEqual(paintedGuide(page), styleGuideView('stout-porter').points);
  });

  test('a style value with no guide hides the guide panel', async () => {
    const page = await openPage();
    page.el('style').value = 'not-a-style'; // the stand-in select keeps only listed values, so this clears it
    page.el('style').fire('change');
    assert.ok(!page.shown('style-guide'), 'panel hidden');
  });

  test('the style menu keeps aria-describedby "style-hint style-guide" while other fields show errors', async () => {
    const page = await openPage();
    page.leave('litres');
    page.type('temp-c', '45');
    page.pick('style', 'custom');
    assert.equal(page.el('style').getAttribute('aria-describedby'), 'style-hint style-guide');
  });
});


// ==========================================================================
// Thai page (stand-in DOM, T15): same wiring, Thai words, same numbers
// ==========================================================================

describe('Thai calculator page, th/calculator.html (stand-in DOM, T15)', () => {
  const openThai = () => openPage(CALCULATOR_TH_HTML);
  const THAI = /[\u0E00-\u0E7F]/;

  test('opens on 330 ml and American ales and IPA at 2.4, with a Thai prompt', async () => {
    const page = await openThai();
    assert.equal(page.el('bottle-size').value, '330');
    assert.equal(page.el('style').value, 'american-ale-ipa');
    assert.equal(page.el('target-vols').value, '2.4');
    assert.equal(page.text('result-prompt'), 'กรอกปริมาณเบียร์ และอุณหภูมิสูงสุด เพื่อดูว่าต้องใส่น้ำตาลเท่าไร');
  });

  test('the bottle and style menus are in Thai, with the same values as the English page', async () => {
    const page = await openThai();
    assert.deepEqual(page.el('bottle-size').children.map((o) => o.value), [...PAGE_BOTTLE_SIZES, 'custom']);
    assert.deepEqual(
      page.el('bottle-size').children.map((o) => o.textContent),
      [...PAGE_BOTTLE_SIZES.map((ml) => `${ml} มล.`), 'กำหนดขนาดเอง'],
    );
    assert.deepEqual(page.el('style').children.map((o) => o.value), STYLE_PRESETS.map((p) => p.id));
    for (const o of page.el('style').children) assert.match(o.textContent, THAI, o.value);
  });

  test('the safety notes are written in Thai', async () => {
    const page = await openThai();
    assert.equal(page.text('note-high-pressure'), 'ใช้ขวดที่ทนแรงดันสูง');
    assert.equal(page.text('note-no-sugar'), 'ไม่ต้องใส่น้ำตาล เบียร์มี CO2 ถึงระดับนี้อยู่แล้ว');
  });

  for (const c of REFERENCE_CASES) {
    test(`typing ${label(c)} shows the same figures as the English page, with Thai labels`, async () => {
      const en = await openWithCase(c);
      const th = await openPage(CALCULATOR_TH_HTML);
      th.type('litres', String(c.litres));
      th.type('temp-c', String(c.tempC));
      th.type('target-vols', String(c.targetVols));
      assert.ok(th.shown('result-values'));
      assert.equal(th.text('batch-grams'), en.text('batch-grams'));
      assert.equal(th.text('per-bottle-grams'), en.text('per-bottle-grams'));
      assert.equal(th.text('batch-label'), 'เดกซ์โทรสสำหรับทั้งแบตช์');
      assert.equal(th.text('per-bottle-label'), 'เดกซ์โทรสต่อขวด 330 มล.');
      assert.match(th.text('result-residual'), /^เบียร์มี CO2 อยู่แล้วประมาณ \d\.\d\d วอลุ่ม$/);
    });
  }

  test('table sugar gives the English figures and Thai labels', async () => {
    const page = await openThai();
    page.type('litres', '20');
    page.type('temp-c', '20');
    page.pickSugar('table');
    const expected = calculatePriming({ litres: 20, tempC: 20, targetVols: 2.4, sugar: 'table' });
    assert.equal(page.text('batch-grams'), expected.batchGrams.toFixed(1));
    assert.equal(page.text('batch-label'), 'น้ำตาลทรายสำหรับทั้งแบตช์');
  });

  test('picking Wheat beer shows the Thai high-pressure note and a Thai style guide', async () => {
    const page = await openThai();
    page.type('litres', '20');
    page.type('temp-c', '20');
    page.pick('style', 'wheat');
    assert.equal(page.el('target-vols').value, '3.5');
    assert.ok(page.shown('note-high-pressure'));
    assert.equal(page.text('style-guide-1-label'), 'ช่วงที่นิยม');
    assert.match(page.text('style-guide-1-text'), /^3\.3 ถึง 4\.5 วอลุ่ม /);
    assert.equal(page.text('target-vols-hint'), 'เบียร์ข้าวสาลี: ปกติ 3.3 ถึง 4.5 วอลุ่ม');
  });

  test('a temperature of 45 °C shows the Thai range error', async () => {
    const page = await openThai();
    page.type('litres', '20');
    page.type('temp-c', '45');
    assert.ok(page.shown('temp-c-error'));
    assert.equal(page.text('temp-c-error'), 'อุณหภูมิต้องอยู่ระหว่าง 0 ถึง 40 °C');
    assert.equal(page.text('result-prompt'), 'แก้ช่องที่ทำเครื่องหมายไว้ เพื่อดูผลลัพธ์');
  });

  test('the English page still opens in English', async () => {
    const page = await openPage();
    assert.equal(page.el('bottle-size').children[0].textContent, '330 ml');
    assert.equal(page.text('note-high-pressure'), NOTES.highPressure);
  });
});

// ==========================================================================
// Added by the tester in the T6 final run (Sat 28 Nov)
// ==========================================================================

/**
 * The PROJECT.md residual CO2 as exact decimal text, worked in whole numbers
 * (BigInt), not with priming.js. tenthsC is the temperature in tenths of a
 * degree; offsetPico moves the text in steps of 0.000000000001 volumes.
 */
function exactResidualText(tenthsC, offsetPico = 0n) {
  const f100 = 18n * BigInt(tenthsC) + 3200n; // °F × 100
  const pico = 3037800000000n - 50062n * f100 * 10000n + 26555n * f100 * f100 + offsetPico;
  const digits = pico.toString().padStart(13, '0');
  return `${digits.slice(0, -12)}.${digits.slice(-12)}`.replace(/0+$/, '').replace(/\.$/, '');
}

const TH_NO_SUGAR = TEXT.th.notes.noSugarNeeded;
const TH_HIGH_PRESSURE = TEXT.th.notes.highPressure;

describe('target at the residual CO2 on the page, every 0.1 °C (T6 final run)', () => {
  const expectedNote = { en: NO_SUGAR_TEXT, th: TH_NO_SUGAR };
  for (const lang of ['en', 'th']) {
    test(`${lang === 'en' ? 'English' : 'Thai'} view: a target typed as the exact residual at every 0.1 °C from 0 to 40 °C shows the no-sugar note and 0.0 g / 0.00 g (both sugars)`, () => {
      const wrong = [];
      for (let tenthsC = 0; tenthsC <= 400; tenthsC += 1) {
        for (const sugar of ['dextrose', 'table']) {
          const raw = { tempC: String(tenthsC / 10), targetVols: exactResidualText(tenthsC), sugar };
          const v = view(raw, { lang });
          if (JSON.stringify(v.notes) !== JSON.stringify([expectedNote[lang]]) || v.batchText !== '0.0' || v.perBottleText !== '0.00') {
            wrong.push(`${JSON.stringify(raw)}: notes ${JSON.stringify(v.notes)}, ${v.batchText} g, ${v.perBottleText} g`);
          }
        }
      }
      assert.deepEqual(wrong, []);
    });
  }

  test('at 1,000 litres a target 0.0001 vols above the exact residual shows 0.4 g and no note', () => {
    // 0.0001 vols × 1,000 L × 4.0 g = 0.4 g: the tolerance must not hide it.
    const v = view({ litres: '1000', tempC: '20', targetVols: exactResidualText(200, 100000000n) });
    assert.deepEqual(v.notes, []);
    assert.equal(v.batchText, '0.4');
  });
});

describe('Thai view: same numbers and notes as English (T6 final run)', () => {
  for (const sugar of ['dextrose', 'table']) {
    test(`Thai view: the three reference cases with ${sugar} give the English figures`, () => {
      for (const c of REFERENCE_CASES) {
        const raw = { litres: c.litres, tempC: c.tempC, targetVols: c.targetVols, sugar };
        const en = view(raw);
        const th = view(raw, { lang: 'th' });
        assert.equal(th.batchText, en.batchText, `${label(c)} batch`);
        assert.equal(th.perBottleText, en.perBottleText, `${label(c)} per bottle`);
        assertShowsModule(th, moduleResult({ ...c, sugar }));
      }
    });
  }

  test('Thai view: the high-pressure note shows above 3.0 vols (3.01) and not at exactly 3.0', () => {
    assert.deepEqual(view({ targetVols: '3.01' }, { lang: 'th' }).notes, [TH_HIGH_PRESSURE]);
    assert.deepEqual(view({ targetVols: '3.0' }, { lang: 'th' }).notes, []);
  });

  test('Thai view: 0 litres, negative values, temperatures outside 0–40 °C and empty fields give no figures and no notes', () => {
    const bad = [
      { litres: '0' }, { litres: '-5' }, { litres: '' },
      { tempC: '-1' }, { tempC: '-0.01' }, { tempC: '40.01' }, { tempC: '45' }, { tempC: '' },
      { targetVols: '0' }, { targetVols: '-1' }, { targetVols: '' },
      { bottleSize: CUSTOM_BOTTLE, customBottleMl: '-330' }, { bottleSize: CUSTOM_BOTTLE, customBottleMl: '' },
    ];
    for (const overrides of bad) {
      // A 3.5 target would add a note if a result slipped through.
      const v = view({ targetVols: '3.5', ...overrides }, { lang: 'th' });
      assert.equal(Object.keys(v.errors).length, 1, `${JSON.stringify(overrides)}: ${JSON.stringify(v.errors)}`);
      assertNoResult(v);
    }
  });
});

describe('figures never show a minus sign (T6 final run)', () => {
  test('the batch and per-bottle figures never show a minus sign (0–40 °C, targets 0.01–3.00 vols, both sugars)', () => {
    const wrong = [];
    for (let tempC = 0; tempC <= 40; tempC += 1) {
      for (let hundredths = 1; hundredths <= 300; hundredths += 1) {
        for (const sugar of ['dextrose', 'table']) {
          const v = view({ tempC: String(tempC), targetVols: String(hundredths / 100), sugar });
          if (v.batchText.startsWith('-') || v.perBottleText.startsWith('-')) wrong.push(`${tempC} °C, ${hundredths / 100} vols, ${sugar}: ${v.batchText} / ${v.perBottleText}`);
        }
      }
    }
    assert.deepEqual(wrong, []);
  });
});

describe('numbers too big to work out (T6 final run)', () => {
  // Parked as todos until T21 added the upper limits. Each now expects the
  // field's limit message.
  test('a batch sugar too big to work out (1e308 litres, or a 1e307 vols target) gives a field message and no figures instead of throwing', () => {
    const cases = [
      { overrides: { litres: '1e308' }, errors: { litres: MSG.litresMax } },
      { overrides: { targetVols: '1e307' }, errors: { targetVols: MSG.targetMax } },
    ];
    for (const { overrides, errors } of cases) {
      let v;
      assert.doesNotThrow(() => { v = view(overrides); }, `computeView threw for ${JSON.stringify(overrides)}`);
      assertNoResult(v);
      assert.deepEqual(v.errors, errors, `${JSON.stringify(overrides)}: field message`);
    }
  });

  test('a per-bottle figure too big to work out (1e160 litres, 1e162 ml custom bottle) is never shown as "Infinity"', () => {
    const v = view({ litres: '1e160', bottleSize: CUSTOM_BOTTLE, customBottleMl: '1e162' });
    assert.ok(!/Infinity/.test(v.perBottleText) && !/Infinity/.test(v.batchText), `shows ${v.batchText} g and ${v.perBottleText} g`);
    assert.deepEqual(v.errors, { litres: MSG.litresMax, customBottleMl: MSG.bottleMax });
    assertNoResult(v);
  });
});

describe('page wiring: target at the residual, Thai page and big numbers (stand-in DOM, T6 final run)', () => {
  const openThaiWithCase = async (c) => {
    const page = await openPage(CALCULATOR_TH_HTML);
    page.type('litres', c.litres);
    page.type('temp-c', c.tempC);
    page.type('target-vols', c.targetVols);
    return page;
  };

  test('English page: typing the exact residual (0.8614872 at 20 °C) shows the no-sugar note and 0.0 g', async () => {
    const page = await openWithCase({ ...REFERENCE_CASES[0], targetVols: '0.8614872' });
    assert.ok(page.shown('note-no-sugar'), 'no-sugar note shown');
    assert.equal(page.text('note-no-sugar'), NO_SUGAR_TEXT);
    assert.ok(!page.shown('note-high-pressure'));
    assert.equal(page.text('batch-grams'), '0.0');
    assert.equal(page.text('per-bottle-grams'), '0.00');
  });

  test('English page: moving the target from the exact residual to 0.001 vols above it hides the no-sugar note and shows 0.1 g', async () => {
    const page = await openWithCase({ ...REFERENCE_CASES[0], targetVols: '0.8614872' });
    assert.ok(page.shown('note-no-sugar'));
    page.type('target-vols', '0.8624872');
    assert.ok(!page.shown('note-no-sugar'), 'no-sugar note hidden');
    assert.equal(page.text('batch-grams'), '0.1');
  });

  test('Thai page: typing the exact residual (0.8614872 at 20 °C) shows the Thai no-sugar note and 0.0 g', async () => {
    const page = await openThaiWithCase({ ...REFERENCE_CASES[0], targetVols: '0.8614872' });
    assert.ok(page.shown('note-no-sugar'), 'no-sugar note shown');
    assert.equal(page.text('note-no-sugar'), TH_NO_SUGAR);
    assert.equal(page.text('batch-grams'), '0.0');
    assert.equal(page.text('per-bottle-grams'), '0.00');
  });

  test('Thai page: a volume of 0 or less hides the figures and shows the Thai volume error', async () => {
    for (const litres of ['0', '-5']) {
      const page = await openThaiWithCase(REFERENCE_CASES[0]);
      assert.ok(page.shown('result-values'), 'figures shown before');
      page.type('litres', litres);
      assert.ok(!page.shown('result-values'), `figures hidden for ${litres} L`);
      assert.ok(page.shown('litres-error'));
      assert.equal(page.text('litres-error'), TEXT.th.errors['litres.not-positive']);
    }
  });

  // Parked as a todo until T21. It started from 1e30 litres, which is now
  // over the limit and shows no figures, so it starts from the largest batch
  // the calculator takes (10,000 litres), which does.
  test('typing a batch too big to work out (10,000 L, then 1e30 and 1e308 litres) does not leave the old figures on screen', async () => {
    const page = await openWithCase({ ...REFERENCE_CASES[0], litres: '10000' });
    assert.ok(page.shown('result-values'), 'figures shown for 10,000 litres');
    const before = page.text('batch-grams');
    for (const litres of ['1e30', '1e308']) {
      let thrown = null;
      // A browser logs an error thrown in an input handler and carries on, so
      // catch it here and look at what the page is left showing.
      try { page.type('litres', litres); } catch (err) { thrown = err; }
      const stale = page.shown('result-values') && page.text('batch-grams') === before;
      assert.equal(
        stale,
        false,
        `the page still shows ${before} g (the 10,000 litres figure) while the field says ${litres}` +
          (thrown ? `; the input handler threw ${thrown.name}: ${thrown.message}` : ''),
      );
      assert.equal(thrown, null, `the input handler threw for ${litres}`);
      assert.ok(page.shown('litres-error'), `volume error shown for ${litres}`);
      assert.equal(page.text('litres-error'), MSG.litresMax);
    }
  });
});

// ==========================================================================
// Upper limits (T21): 10,000 litres, a 20,000 ml bottle, 10 volumes
// ==========================================================================

// The Thai limit messages, with the figures filled in.
const TH_MAX = {
  litres: 'ปริมาณเบียร์ต้องไม่เกิน 10,000 ลิตร',
  bottle: 'ขนาดขวดต้องไม่เกิน 20,000 มล.',
  target: 'CO2 เป้าหมายต้องไม่เกิน 10 วอลุ่ม',
};
const TH_PROMPT_FIX = 'แก้ช่องที่ทำเครื่องหมายไว้ เพื่อดูผลลัพธ์';

/** Infinity, NaN or a number in exponent form ("1e+21", "6.15e30", "1e-7"). */
const NOT_PLAIN = /Infinity|NaN|\d[eE][+-]?\d/;

/** Element id on calculator.html for each text field. */
const INPUT_IDS = { litres: 'litres', customBottleMl: 'custom-bottle-ml', targetVols: 'target-vols', tempC: 'temp-c' };

// Each limit: the page field, the overrides at and just over the limit, and
// the message in each language. The bottle checks use a 100 L batch, so a
// 20 L keg is not also bigger than the batch.
const LIMITS = [
  {
    name: 'beer volume',
    field: 'litres',
    at: { litres: '10000' },
    over: [{ litres: '10000.01' }, { litres: '10000.000000001' }, { litres: '1.0000001e4' }],
    en: MSG.litresMax,
    th: TH_MAX.litres,
  },
  {
    name: 'custom bottle size',
    field: 'customBottleMl',
    at: { litres: '100', bottleSize: CUSTOM_BOTTLE, customBottleMl: '20000' },
    over: [
      { litres: '100', bottleSize: CUSTOM_BOTTLE, customBottleMl: '20000.01' },
      { litres: '100', bottleSize: CUSTOM_BOTTLE, customBottleMl: '20000.000000001' },
      { litres: '100', bottleSize: CUSTOM_BOTTLE, customBottleMl: '2.0000001e4' },
    ],
    en: MSG.bottleMax,
    th: TH_MAX.bottle,
  },
  {
    name: 'target CO2',
    field: 'targetVols',
    at: { targetVols: '10' },
    over: [{ targetVols: '10.01' }, { targetVols: '10.000000001' }, { targetVols: '1.0000001e1' }],
    en: MSG.targetMax,
    th: TH_MAX.target,
  },
];

describe('upper limits on the page (T21)', () => {
  for (const limit of LIMITS) {
    test(`${limit.name}: just at the limit gives the calculatePriming figures, in plain digits`, () => {
      const v = view(limit.at);
      const raw = { ...BASE, ...limit.at };
      const bottleMl = raw.bottleSize === CUSTOM_BOTTLE ? raw.customBottleMl : raw.bottleSize;
      assertShowsModule(v, moduleResult({ ...raw, bottleMl }));
      for (const text of [v.batchText, v.perBottleText, v.residualText, v.perBottleLabel]) {
        assert.doesNotMatch(text, NOT_PLAIN);
      }
    });

    test(`${limit.name}: just at the limit gives the same figures in Thai`, () => {
      const en = view(limit.at);
      const th = view(limit.at, { lang: 'th' });
      assert.deepEqual(th.errors, {});
      assert.equal(th.batchText, en.batchText);
      assert.equal(th.perBottleText, en.perBottleText);
    });

    test(`${limit.name}: just over the limit gives "${limit.en}" on the field and no figures`, () => {
      for (const overrides of limit.over) {
        assertFieldError(view(overrides), limit.field, limit.en);
      }
    });

    test(`${limit.name}: just over the limit gives the Thai limit message on the field and no figures`, () => {
      for (const overrides of limit.over) {
        const v = view(overrides, { lang: 'th' });
        assert.deepEqual(v.errors, { [limit.field]: limit.th }, JSON.stringify(overrides));
        assertNoResult(v);
        assert.equal(v.prompt, TH_PROMPT_FIX);
      }
    });

    test(`${limit.name}: an over-limit value is marked even before the field is touched`, () => {
      const v = view(limit.over[0], { touched: new Set() });
      assert.deepEqual(v.errors, { [limit.field]: limit.en });
    });
  }

  test('a 10 volumes target shows the high-pressure note with its figures', () => {
    const v = view({ targetVols: '10' });
    assert.deepEqual(v.notes, [HIGH_PRESSURE_TEXT]);
    assert.equal(v.hasResult, true);
  });

  test('a 20,000 ml bottle for a 20 litre batch is allowed and gets all the sugar', () => {
    const v = view({ litres: '20', bottleSize: CUSTOM_BOTTLE, customBottleMl: '20000' });
    assert.deepEqual(v.errors, {});
    assert.equal(v.perBottleText, v.result.batchGrams.toFixed(2));
    assert.equal(v.perBottleLabel, 'Dextrose per 20000 ml bottle');
  });

  test('a bottle over the limit and bigger than the batch gets the limit message', () => {
    assertFieldError(view({ litres: '20', bottleSize: CUSTOM_BOTTLE, customBottleMl: '25000' }), 'customBottleMl', MSG.bottleMax);
  });

  test('all three over the limit at once: each field gets its own message, in English and Thai', () => {
    const overrides = { litres: '20000', bottleSize: CUSTOM_BOTTLE, customBottleMl: '30000', targetVols: '12' };
    const en = view(overrides);
    assert.deepEqual(en.errors, { litres: MSG.litresMax, customBottleMl: MSG.bottleMax, targetVols: MSG.targetMax });
    assertNoResult(en);
    const th = view(overrides, { lang: 'th' });
    assert.deepEqual(th.errors, { litres: TH_MAX.litres, customBottleMl: TH_MAX.bottle, targetVols: TH_MAX.target });
    assertNoResult(th);
  });

  test('an over-limit volume next to a bad temperature: both get their own message', () => {
    const v = view({ litres: '1e6', tempC: '45' });
    assert.deepEqual(v.errors, { litres: MSG.litresMax, tempC: MSG.tempRange });
  });

  test('the largest figures the limits allow are plain digits (10,000 L, 10 vols, 20,000 ml, every °C, both sugars)', () => {
    const wrong = [];
    for (let tempC = 0; tempC <= 40; tempC += 1) {
      for (const sugar of ['dextrose', 'table']) {
        const raw = { litres: '10000', targetVols: '10', tempC: String(tempC), sugar, bottleSize: CUSTOM_BOTTLE, customBottleMl: '20000' };
        const v = view(raw);
        if (!v.hasResult || [v.batchText, v.perBottleText, v.residualText].some((s) => NOT_PLAIN.test(s))) {
          wrong.push(`${tempC} °C, ${sugar}: ${v.batchText} / ${v.perBottleText} ${JSON.stringify(v.errors)}`);
        }
      }
    }
    assert.deepEqual(wrong, []);
  });
});

describe('no figure is ever Infinity, NaN or in exponent form (T21)', () => {
  const VALUES = {
    litres: ['1e-300', '0.000001', '0.33', '20', '9999.999', '10000', '10000.000001', '1e21', '1e160', '1e300', '1.7976931348623157e308'],
    customBottleMl: ['1e-322', '1e-300', '0.0000001', '0.5', '330', '19999.99', '20000', '20000.01', '1e21', '1e162', '1e308'],
    targetVols: ['1e-300', '0.5', '2.4', '9.99', '10', '10.01', '1e21', '1e307'],
    tempC: ['0', '20', '34.6', '40'],
  };

  for (const lang of ['en', 'th']) {
    test(`${lang === 'en' ? 'English' : 'Thai'} view: huge, tiny and edge values in every field never throw or show Infinity, NaN or an exponent`, () => {
      const wrong = [];
      for (const litres of VALUES.litres) {
        for (const customBottleMl of VALUES.customBottleMl) {
          for (const targetVols of VALUES.targetVols) {
            for (const tempC of VALUES.tempC) {
              const raw = { litres, bottleSize: CUSTOM_BOTTLE, customBottleMl, targetVols, tempC };
              let v;
              try {
                v = view(raw, { lang });
              } catch (err) {
                wrong.push(`${JSON.stringify(raw)}: threw ${err.name}: ${err.message}`);
                continue;
              }
              const shown = [v.batchText, v.perBottleText, v.residualText, v.perBottleLabel, v.prompt, ...Object.values(v.errors)];
              if (shown.some((s) => NOT_PLAIN.test(s))) wrong.push(`${JSON.stringify(raw)}: ${JSON.stringify(shown)}`);
              if (!v.hasResult && v.prompt === '') wrong.push(`${JSON.stringify(raw)}: no result and no prompt`);
            }
          }
        }
      }
      assert.deepEqual(wrong.slice(0, 10), []);
    });
  }

  test('a tiny custom bottle (0.0000001 ml, or typed as 1e-7) is named in plain digits in the per-bottle label', () => {
    for (const customBottleMl of ['0.0000001', '1e-7']) {
      const v = view({ bottleSize: CUSTOM_BOTTLE, customBottleMl });
      assert.equal(v.perBottleLabel, 'Dextrose per 0.0000001 ml bottle', customBottleMl);
      assert.equal(v.perBottleText, '0.00');
    }
    const th = view({ bottleSize: CUSTOM_BOTTLE, customBottleMl: '2.5e-10' }, { lang: 'th' });
    assert.equal(th.perBottleLabel, 'เดกซ์โทรสต่อขวด 0.00000000025 มล.');
  });

  test('listed and ordinary custom bottle sizes keep their labels as before', () => {
    for (const [overrides, label] of [
      [{ bottleSize: '330' }, 'Dextrose per 330 ml bottle'],
      [{ bottleSize: CUSTOM_BOTTLE, customBottleMl: '750' }, 'Dextrose per 750 ml bottle'],
      [{ bottleSize: CUSTOM_BOTTLE, customBottleMl: '1e3' }, 'Dextrose per 1000 ml bottle'],
      [{ bottleSize: CUSTOM_BOTTLE, customBottleMl: '.5' }, 'Dextrose per 0.5 ml bottle'],
      [{ bottleSize: CUSTOM_BOTTLE, customBottleMl: '0.000001' }, 'Dextrose per 0.000001 ml bottle'],
    ]) {
      assert.equal(view(overrides).perBottleLabel, label, JSON.stringify(overrides));
    }
  });

  // A bottle so small (1e-322 ml) that it is 0 once worked out in litres. The
  // module then throws about bottleLitres, which is not a field on the page.
  // Before T21 that error escaped computeView and crashed the input handler.
  for (const lang of ['en', 'th']) {
    test(`${lang === 'en' ? 'English' : 'Thai'} view: an error about a value that is not a page field (a 1e-322 ml bottle) gives no figures and the "check the numbers" prompt, without throwing`, () => {
      let v;
      assert.doesNotThrow(() => { v = view({ bottleSize: CUSTOM_BOTTLE, customBottleMl: '1e-322' }, { lang }); });
      assertNoResult(v);
      assert.deepEqual(v.errors, {});
      assert.equal(v.prompt, lang === 'en' ? PROMPT_CHECK : TEXT.th.promptCheck);
    });
  }

  test('an error that is not a page field next to a field error: the field gets its message, no figures', () => {
    const v = view({ litres: '0', bottleSize: CUSTOM_BOTTLE, customBottleMl: '1e-322' });
    assert.deepEqual(v.errors, { litres: MSG.litresPositive });
    assertNoResult(v);
    assert.equal(v.prompt, PROMPT_FIX);
  });

  test('the "check the numbers" prompt is in i18n.js in both languages', () => {
    assert.equal(TEXT.en.promptCheck, PROMPT_CHECK);
    assert.match(TEXT.th.promptCheck, /[฀-๿]/);
  });
});

describe('page wiring: upper limits and errors that are not page fields (stand-in DOM, T21)', () => {
  test('English page: typing each over-limit value hides the figures and shows the field\'s limit message', async () => {
    for (const limit of LIMITS) {
      const page = await openWithCase(REFERENCE_CASES[0]);
      if (limit.at.bottleSize) page.pick('bottle-size', limit.at.bottleSize);
      for (const [key, value] of Object.entries(limit.at)) {
        if (INPUT_IDS[key]) page.type(INPUT_IDS[key], value);
      }
      assert.ok(page.shown('result-values'), `${limit.name}: figures shown at the limit`);
      const id = INPUT_IDS[limit.field];
      page.type(id, limit.over[0][limit.field]);
      assert.ok(!page.shown('result-values'), `${limit.name}: figures hidden just over the limit`);
      assert.ok(page.shown(`${id}-error`));
      assert.equal(page.text(`${id}-error`), limit.en);
      assert.equal(page.el(id).getAttribute('aria-invalid'), 'true');
      assert.equal(page.text('result-prompt'), PROMPT_FIX);
      assert.ok(!page.shown('note-high-pressure') && !page.shown('note-no-sugar'), `${limit.name}: no notes`);
    }
  });

  test('Thai page: an over-limit volume shows the Thai limit message', async () => {
    const page = await openPage(CALCULATOR_TH_HTML);
    page.type('litres', '20');
    page.type('temp-c', '20');
    assert.ok(page.shown('result-values'));
    page.type('litres', '10000.01');
    assert.ok(!page.shown('result-values'));
    assert.equal(page.text('litres-error'), TH_MAX.litres);
  });

  test('a 1e-322 ml custom bottle after a result hides the figures and shows the "check the numbers" prompt, without throwing', async () => {
    const page = await openWithCase(REFERENCE_CASES[0]);
    page.pick('bottle-size', 'custom');
    page.type('custom-bottle-ml', '750');
    assert.ok(page.shown('result-values'), 'figures shown for 750 ml');
    assert.doesNotThrow(() => page.type('custom-bottle-ml', '1e-322'));
    assert.ok(!page.shown('result-values'), 'figures hidden');
    assert.ok(page.shown('result-prompt'));
    assert.equal(page.text('result-prompt'), PROMPT_CHECK);
    page.type('custom-bottle-ml', '750');
    assert.ok(page.shown('result-values'), 'figures back for 750 ml');
    assert.ok(!page.shown('result-prompt'));
  });

  test('if working out the view fails, the old figures and notes are hidden before the error goes on', async () => {
    const page = await openWithCase({ ...REFERENCE_CASES[0], targetVols: '3.5' });
    assert.ok(page.shown('result-values') && page.shown('note-high-pressure'), 'figures and note shown before');
    // A field the page can't read stands in for a bug anywhere in the wiring.
    Object.defineProperty(page.el('temp-c'), 'value', { get() { throw new Error('test: field unreadable'); }, configurable: true });
    assert.throws(() => page.el('litres').fire('input'), /field unreadable/);
    assert.ok(!page.shown('result-values'), 'figures hidden');
    assert.ok(!page.shown('note-high-pressure'), 'high-pressure note hidden');
    assert.ok(page.shown('result-prompt'));
    assert.equal(page.text('result-prompt'), PROMPT_CHECK);
  });
});
