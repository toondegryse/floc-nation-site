import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  BOTTLE_SIZES_ML,
  DEFAULT_BOTTLE_ML,
  HIGH_PRESSURE_VOLS,
  PrimingInputError,
  STYLE_PRESETS,
  SUGAR_FACTORS,
  TEMP_RANGE_C,
  batchSugarGrams,
  calculatePriming,
  celsiusToFahrenheit,
  gramsPerBottle,
  residualCO2,
} from '../docs/js/priming.js';

// Reference cases from PROJECT.md, "Calculator reference" (dextrose).
const REFERENCE_CASES = [
  { litres: 20, tempC: 20, targetVols: 2.4, residual: 0.861, batchGrams: 123.1, per330: 2.03 },
  { litres: 10, tempC: 25, targetVols: 2.6, residual: 0.757, batchGrams: 73.7, per330: 2.43 },
  { litres: 23, tempC: 30, targetVols: 3.5, residual: 0.696, batchGrams: 257.9, per330: 3.7 },
];

const RESIDUAL_TOLERANCE = 0.005; // volumes
const BATCH_TOLERANCE = 0.5; // grams, as in PROJECT.md
const PER_BOTTLE_TOLERANCE = 0.01; // grams; the table gives two decimals

// A valid input set: the first reference case, 330 ml bottles, dextrose.
const BASE = { litres: 20, tempC: 20, targetVols: 2.4, bottleMl: 330, sugar: 'dextrose' };
const calc = (overrides = {}) => calculatePriming({ ...BASE, ...overrides });

function assertNear(actual, expected, tolerance) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${expected} ± ${tolerance}, got ${actual}`,
  );
}

function assertInputError(fn, field, message) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof PrimingInputError, `expected PrimingInputError, got ${err.name}`);
    assert.ok(err instanceof RangeError, 'expected the error to be a RangeError');
    assert.equal(err.field, field);
    assert.equal(err.message, message);
    return true;
  });
}

describe('reference cases (dextrose)', () => {
  for (const c of REFERENCE_CASES) {
    const label = `${c.litres} L, ${c.tempC} °C, ${c.targetVols} vols`;

    test(`residual CO2 at ${c.tempC} °C is ${c.residual} volumes`, () => {
      assertNear(residualCO2(c.tempC), c.residual, RESIDUAL_TOLERANCE);
    });

    test(`batch needs ${c.batchGrams} g dextrose for ${label}`, () => {
      const grams = batchSugarGrams({ litres: c.litres, tempC: c.tempC, targetVols: c.targetVols });
      assertNear(grams, c.batchGrams, BATCH_TOLERANCE);
    });

    test(`a 330 ml bottle needs ${c.per330} g dextrose for ${label}`, () => {
      const batch = batchSugarGrams({ litres: c.litres, tempC: c.tempC, targetVols: c.targetVols });
      assertNear(gramsPerBottle(batch, 0.33, c.litres), c.per330, PER_BOTTLE_TOLERANCE);
    });

    test(`calculatePriming gives the reference numbers for ${label}`, () => {
      const result = calculatePriming({
        litres: c.litres,
        tempC: c.tempC,
        targetVols: c.targetVols,
        bottleMl: 330,
      });
      assertNear(result.residual, c.residual, RESIDUAL_TOLERANCE);
      assertNear(result.batchGrams, c.batchGrams, BATCH_TOLERANCE);
      assertNear(result.perBottleGrams, c.per330, PER_BOTTLE_TOLERANCE);
    });
  }
});

describe('conversions and core maths', () => {
  test('converts °C to °F with F = C × 9/5 + 32', () => {
    assert.equal(celsiusToFahrenheit(0), 32);
    assert.equal(celsiusToFahrenheit(20), 68);
    assert.equal(celsiusToFahrenheit(40), 104);
  });

  test('does not round results', () => {
    // 3.0378 − 0.050062 × 68 + 0.00026555 × 68² = 0.8614872
    assertNear(residualCO2(20), 0.8614872, 1e-9);
  });

  test('accepts temperatures at the 0 and 40 °C edges', () => {
    // 0 °C = 32 °F: 3.0378 − 1.601984 + 0.2719232 = 1.7077392
    assertNear(residualCO2(0), 1.7077392, 1e-6);
    // 40 °C = 104 °F: 3.0378 − 5.206448 + 2.8721888 = 0.7035408
    assertNear(residualCO2(40), 0.7035408, 1e-6);
  });

  test('accepts numeric strings from form fields', () => {
    const fromStrings = calculatePriming({
      litres: '20',
      tempC: ' 20 ',
      targetVols: '2.4',
      bottleMl: '330',
    });
    assert.deepEqual(fromStrings, calc());
  });

  test('batch sugar defaults to dextrose', () => {
    const { sugar, ...noSugar } = BASE;
    assert.equal(batchSugarGrams(noSugar), batchSugarGrams({ ...noSugar, sugar: 'dextrose' }));
  });

  test('bottle size defaults to 330 ml', () => {
    const { bottleMl, ...noBottle } = BASE;
    assert.deepEqual(calculatePriming(noBottle), calc({ bottleMl: 330 }));
  });

  test('grams per bottle scale with bottle size', () => {
    const result = calc({ bottleMl: 500 });
    assertNear(result.perBottleGrams, (result.batchGrams * 0.5) / 20, 1e-9);
  });

  test('a bottle the same size as the batch gets all the batch sugar', () => {
    const result = calc({ litres: 0.33, bottleMl: 330 });
    assertNear(result.perBottleGrams, result.batchGrams, 1e-9);
  });

  test('calculatePriming returns residual, grams and both safety flags', () => {
    assert.deepEqual(Object.keys(calc()).sort(), [
      'batchGrams',
      'highPressure',
      'noSugarNeeded',
      'perBottleGrams',
      'residual',
    ]);
  });
});

describe('table sugar', () => {
  test('table sugar uses a factor of 3.82', () => {
    // (2.4 − 0.8614872) × 20 × 3.82 = 117.542
    const grams = batchSugarGrams({ litres: 20, tempC: 20, targetVols: 2.4, sugar: 'table' });
    assertNear(grams, 117.54, 0.01);
  });

  test('table sugar needs less than dextrose for the same beer', () => {
    const table = calc({ sugar: 'table' });
    const dextrose = calc({ sugar: 'dextrose' });
    assertNear(table.batchGrams, (dextrose.batchGrams * 3.82) / 4.0, 1e-9);
  });

  test('table sugar per 330 ml bottle for 20 L, 20 °C, 2.4 vols is 1.94 g', () => {
    assertNear(calc({ sugar: 'table' }).perBottleGrams, 1.94, PER_BOTTLE_TOLERANCE);
  });
});

describe('safety flags', () => {
  test('flags no sugar needed when the target is below the residual CO2', () => {
    assert.equal(calc({ targetVols: 0.5 }).noSugarNeeded, true);
  });

  test('gives 0 g, never negative, when the target is below the residual CO2', () => {
    const result = calc({ targetVols: 0.5 });
    assert.equal(result.batchGrams, 0);
    assert.equal(result.perBottleGrams, 0);
  });

  test('batchSugarGrams on its own gives 0 g when the target is below the residual CO2', () => {
    assert.equal(batchSugarGrams({ litres: 20, tempC: 20, targetVols: 0.5 }), 0);
  });

  test('flags no sugar needed when the target equals the residual CO2', () => {
    const result = calc({ targetVols: residualCO2(20) });
    assert.equal(result.noSugarNeeded, true);
    assert.equal(result.batchGrams, 0);
  });

  test('flags high pressure when the target is above 3.0 volumes', () => {
    assert.equal(calc({ targetVols: 3.5 }).highPressure, true);
  });

  test('does not flag high pressure at exactly 3.0 volumes', () => {
    assert.equal(calc({ targetVols: 3.0 }).highPressure, false);
  });

  test('raises no flags for a normal target', () => {
    const result = calc({ targetVols: 2.4 });
    assert.equal(result.noSugarNeeded, false);
    assert.equal(result.highPressure, false);
  });
});

describe('exported data', () => {
  test('sugar factors are 4.0 for dextrose and 3.82 for table sugar', () => {
    assert.deepEqual({ ...SUGAR_FACTORS }, { dextrose: 4.0, table: 3.82 });
  });

  test('bottle sizes are 330, 500, 620 and 640 ml, with 330 ml as default', () => {
    assert.deepEqual([...BOTTLE_SIZES_ML], [330, 500, 620, 640]);
    assert.equal(DEFAULT_BOTTLE_ML, 330);
  });

  test('temperature range is 0 to 40 °C and high pressure starts above 3.0', () => {
    assert.deepEqual({ ...TEMP_RANGE_C }, { min: 0, max: 40 });
    assert.equal(HIGH_PRESSURE_VOLS, 3.0);
  });

  test('style presets match the style table in PROJECT.md', () => {
    const rows = STYLE_PRESETS.map((p) => [p.name, p.min, p.max, p.default]);
    assert.deepEqual(rows, [
      ['British ales', 1.5, 2.0, 1.8],
      ['Stout and porter', 1.8, 2.3, 2.0],
      ['American ales and IPA', 2.2, 2.7, 2.4],
      ['Lager and pilsner', 2.4, 2.6, 2.5],
      ['Wheat beer', 3.3, 4.5, 3.5],
      ['Custom', null, null, null],
    ]);
  });

  test('every style default sits inside its range', () => {
    for (const p of STYLE_PRESETS.filter((s) => s.default !== null)) {
      assert.ok(p.default >= p.min && p.default <= p.max, `${p.name} default is out of range`);
    }
  });

  test('style preset ids are unique', () => {
    const ids = STYLE_PRESETS.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('exported data cannot be changed by accident', () => {
    assert.ok(Object.isFrozen(SUGAR_FACTORS));
    assert.ok(Object.isFrozen(BOTTLE_SIZES_ML));
    assert.ok(Object.isFrozen(TEMP_RANGE_C));
    assert.ok(Object.isFrozen(STYLE_PRESETS));
    assert.ok(STYLE_PRESETS.every((p) => Object.isFrozen(p)));
  });
});

describe('invalid input', () => {
  const TEMP_RANGE = 'Temperature must be between 0 and 40 °C.';

  test('rejects a temperature below 0 °C', () => {
    assertInputError(() => calc({ tempC: -1 }), 'tempC', TEMP_RANGE);
  });

  test('rejects a temperature above 40 °C', () => {
    assertInputError(() => calc({ tempC: 41 }), 'tempC', TEMP_RANGE);
  });

  test('residualCO2 on its own rejects a temperature outside 0–40 °C', () => {
    assertInputError(() => residualCO2(45), 'tempC', TEMP_RANGE);
  });

  test('rejects an empty temperature', () => {
    assertInputError(
      () => calc({ tempC: '' }),
      'tempC',
      'Enter the highest temperature the beer reached.',
    );
  });

  test('rejects a NaN temperature', () => {
    assertInputError(() => calc({ tempC: NaN }), 'tempC', 'Temperature must be a number.');
  });

  test('rejects 0 litres', () => {
    assertInputError(() => calc({ litres: 0 }), 'litres', 'Beer volume must be more than 0 litres.');
  });

  test('rejects negative litres', () => {
    assertInputError(() => calc({ litres: -5 }), 'litres', 'Beer volume must be more than 0 litres.');
  });

  test('rejects empty litres', () => {
    assertInputError(() => calc({ litres: '' }), 'litres', 'Enter the beer volume in litres.');
  });

  test('rejects a blank litres field of only spaces', () => {
    assertInputError(() => calc({ litres: '   ' }), 'litres', 'Enter the beer volume in litres.');
  });

  test('rejects missing litres', () => {
    const { litres, ...noLitres } = BASE;
    assertInputError(() => calculatePriming(noLitres), 'litres', 'Enter the beer volume in litres.');
  });

  test('rejects non-numeric litres', () => {
    assertInputError(() => calc({ litres: 'twenty' }), 'litres', 'Beer volume must be a number.');
  });

  test('rejects infinite litres', () => {
    assertInputError(() => calc({ litres: Infinity }), 'litres', 'Beer volume must be a number.');
  });

  test('rejects a value that is neither a number nor a string', () => {
    assertInputError(() => calc({ litres: true }), 'litres', 'Beer volume must be a number.');
  });

  test('rejects a target CO2 of 0', () => {
    assertInputError(
      () => calc({ targetVols: 0 }),
      'targetVols',
      'Target CO2 must be more than 0 volumes.',
    );
  });

  test('rejects a negative target CO2', () => {
    assertInputError(
      () => calc({ targetVols: -2 }),
      'targetVols',
      'Target CO2 must be more than 0 volumes.',
    );
  });

  test('rejects an empty target CO2', () => {
    assertInputError(
      () => calc({ targetVols: '' }),
      'targetVols',
      'Enter a target CO2 level in volumes.',
    );
  });

  test('rejects a bottle size of 0', () => {
    assertInputError(() => calc({ bottleMl: 0 }), 'bottleMl', 'Bottle size must be more than 0 ml.');
  });

  test('rejects a negative bottle size', () => {
    assertInputError(
      () => calc({ bottleMl: -330 }),
      'bottleMl',
      'Bottle size must be more than 0 ml.',
    );
  });

  test('rejects an empty bottle size', () => {
    assertInputError(() => calc({ bottleMl: '' }), 'bottleMl', 'Enter the bottle size in ml.');
  });

  test('rejects a bottle bigger than the batch', () => {
    assertInputError(
      () => calc({ litres: 0.5, bottleMl: 640 }),
      'bottleMl',
      "Bottle size can't be bigger than the whole batch.",
    );
  });

  test('rejects an unknown sugar type', () => {
    assertInputError(
      () => calc({ sugar: 'honey' }),
      'sugar',
      'Sugar type must be dextrose or table sugar.',
    );
  });

  test('gramsPerBottle rejects negative batch grams', () => {
    assertInputError(
      () => gramsPerBottle(-1, 0.33, 20),
      'batchGrams',
      "Batch sugar can't be less than 0 g.",
    );
  });

  test('gramsPerBottle rejects a bottle bigger than the batch', () => {
    assertInputError(
      () => gramsPerBottle(10, 0.64, 0.5),
      'bottleLitres',
      "Bottle size can't be bigger than the whole batch.",
    );
  });

  test('calculatePriming without an inputs object throws a TypeError', () => {
    assert.throws(() => calculatePriming(), TypeError);
    assert.throws(() => calculatePriming(null), TypeError);
  });
});

// ---------------------------------------------------------------------------
// Added by the tester in the T2 review.
// ---------------------------------------------------------------------------

// Table sugar on the PROJECT.md reference cases. Expected values were worked
// out by hand from the PROJECT.md formulas with factor 3.82, not from priming.js.
const TABLE_SUGAR_CASES = [
  { litres: 20, tempC: 20, targetVols: 2.4, batchGrams: 117.5, per330: 1.94 },
  { litres: 10, tempC: 25, targetVols: 2.6, batchGrams: 70.4, per330: 2.32 },
  { litres: 23, tempC: 30, targetVols: 3.5, batchGrams: 246.3, per330: 3.53 },
];

describe('table sugar on the reference cases', () => {
  for (const c of TABLE_SUGAR_CASES) {
    const label = `${c.litres} L, ${c.tempC} °C, ${c.targetVols} vols`;
    const inputs = { litres: c.litres, tempC: c.tempC, targetVols: c.targetVols, sugar: 'table' };

    test(`batch needs ${c.batchGrams} g table sugar for ${label}`, () => {
      assertNear(calculatePriming(inputs).batchGrams, c.batchGrams, BATCH_TOLERANCE);
    });

    test(`a 330 ml bottle needs ${c.per330} g table sugar for ${label}`, () => {
      assertNear(calculatePriming(inputs).perBottleGrams, c.per330, PER_BOTTLE_TOLERANCE);
    });
  }
});

describe('boundaries', () => {
  const TEMP_RANGE = 'Temperature must be between 0 and 40 °C.';

  test('calculatePriming gives a result at exactly 0 °C and 40 °C', () => {
    assert.equal(calc({ tempC: 0 }).noSugarNeeded, false);
    assert.equal(calc({ tempC: 40 }).noSugarNeeded, false);
  });

  test('rejects a temperature just below 0 °C', () => {
    assertInputError(() => calc({ tempC: -0.1 }), 'tempC', TEMP_RANGE);
  });

  test('rejects a temperature just above 40 °C', () => {
    assertInputError(() => calc({ tempC: 40.1 }), 'tempC', TEMP_RANGE);
  });

  test('rejects an out-of-range temperature typed into a form field', () => {
    assertInputError(() => calc({ tempC: '41' }), 'tempC', TEMP_RANGE);
  });

  test('rejects 0 litres typed into a form field', () => {
    assertInputError(() => calc({ litres: '0' }), 'litres', 'Beer volume must be more than 0 litres.');
  });

  test('rejects negative litres typed into a form field', () => {
    assertInputError(() => calc({ litres: '-5' }), 'litres', 'Beer volume must be more than 0 litres.');
  });

  test('a target just above the residual CO2 needs sugar and shows no "no sugar" note', () => {
    const result = calc({ targetVols: residualCO2(20) + 0.01 });
    assert.equal(result.noSugarNeeded, false);
    assert.ok(result.batchGrams > 0, `expected more than 0 g, got ${result.batchGrams}`);
  });

  test('table sugar also gives 0 g when the target is below the residual CO2', () => {
    const result = calc({ targetVols: 0.5, sugar: 'table' });
    assert.equal(result.noSugarNeeded, true);
    assert.equal(result.batchGrams, 0);
    assert.equal(result.perBottleGrams, 0);
  });
});

describe('bottle sizes', () => {
  for (const ml of BOTTLE_SIZES_ML) {
    test(`a ${ml} ml bottle gets batch grams × bottle litres ÷ batch litres`, () => {
      const result = calc({ bottleMl: ml });
      // Worked from PROJECT.md: 123.081024 g × (ml / 1000) ÷ 20 L.
      assertNear(result.perBottleGrams, (123.081024 * (ml / 1000)) / 20, 1e-6);
    });
  }

  test('a custom bottle size is accepted', () => {
    // 750 ml custom bottle: 123.081024 × 0.75 ÷ 20 = 4.6155384 g.
    assertNear(calc({ bottleMl: 750 }).perBottleGrams, 4.6155384, 1e-6);
  });
});

describe('style presets and the high-pressure note', () => {
  test('the wheat beer default target triggers the high-pressure note', () => {
    const wheat = STYLE_PRESETS.find((p) => p.name === 'Wheat beer');
    assert.equal(calc({ targetVols: wheat.default }).highPressure, true);
  });

  test('no other style default triggers the high-pressure note', () => {
    const others = STYLE_PRESETS.filter((p) => p.default !== null && p.name !== 'Wheat beer');
    for (const p of others) {
      assert.equal(calc({ targetVols: p.default }).highPressure, false, `${p.name} was flagged`);
    }
  });

  test('every style default gives a result for the first reference batch', () => {
    for (const p of STYLE_PRESETS.filter((s) => s.default !== null)) {
      const result = calc({ targetVols: p.default });
      assert.ok(result.batchGrams > 0, `${p.name} gave ${result.batchGrams} g`);
    }
  });
});

// ---------------------------------------------------------------------------
// Added in T6a: typed text must be a plain decimal number.
// ---------------------------------------------------------------------------

describe('plain decimal text only', () => {
  const NUMBER_FIELDS = [
    { field: 'litres', name: 'Beer volume', enter: 'Enter the beer volume in litres.' },
    { field: 'tempC', name: 'Temperature', enter: 'Enter the highest temperature the beer reached.' },
    { field: 'targetVols', name: 'Target CO2', enter: 'Enter a target CO2 level in volumes.' },
    { field: 'bottleMl', name: 'Bottle size', enter: 'Enter the bottle size in ml.' },
  ];

  // Every text below is 20 to Number(), and 20 is a valid value in every
  // field (20 L, 20 °C, 20 volumes, a 20 ml bottle). So only the decimal
  // text check can stop them.
  const HEX = ['0x14', '0X14'];
  const BINARY = ['0b10100', '0B10100'];
  const OCTAL = ['0o24', '0O24'];

  function assertNotANumberInEveryField(texts) {
    for (const { field, name } of NUMBER_FIELDS) {
      for (const text of texts) {
        assertInputError(() => calc({ [field]: text }), field, `${name} must be a number.`);
      }
    }
  }

  test('rejects hex text as a number in every field', () => {
    assertNotANumberInEveryField(HEX);
  });

  test('rejects binary text as a number in every field', () => {
    assertNotANumberInEveryField(BINARY);
  });

  test('rejects octal text as a number in every field', () => {
    assertNotANumberInEveryField(OCTAL);
  });

  test('rejects hex, binary and octal text with spaces around it', () => {
    assertNotANumberInEveryField([' 0x14 ', '\t0b10100\n', '  0o24']);
  });

  test('the other exported functions also reject hex text', () => {
    assertInputError(() => celsiusToFahrenheit('0x14'), 'tempC', 'Temperature must be a number.');
    assertInputError(() => residualCO2('0x14'), 'tempC', 'Temperature must be a number.');
    assertInputError(
      () => batchSugarGrams({ litres: '0x14', tempC: 20, targetVols: 2.4 }),
      'litres',
      'Beer volume must be a number.',
    );
    assertInputError(() => gramsPerBottle('0x14', 0.33, 20), 'batchGrams', 'Batch sugar must be a number.');
    assertInputError(() => gramsPerBottle(100, '0x1', 20), 'bottleLitres', 'Bottle size must be a number.');
    assertInputError(() => gramsPerBottle(100, 0.33, '0x14'), 'batchLitres', 'Beer volume must be a number.');
  });

  test('still accepts plain decimal text with spaces, exponent, sign, leading or trailing point', () => {
    const texts = [
      [' 20 ', 20],
      ['2e1', 20],
      ['2E1', 20],
      ['200e-1', 20],
      ['+20', 20],
      ['20.', 20],
      ['020', 20],
      ['.5', 0.5],
    ];
    for (const { field } of NUMBER_FIELDS) {
      for (const [text, n] of texts) {
        assert.deepEqual(calc({ [field]: text }), calc({ [field]: n }), `${field}: "${text}"`);
      }
    }
  });

  test('still gives the "Enter ..." message for empty or blank text in every field', () => {
    for (const { field, enter } of NUMBER_FIELDS) {
      for (const text of ['', '   ', '\t\n']) {
        assertInputError(() => calc({ [field]: text }), field, enter);
      }
    }
  });

  test('still rejects a comma decimal ("20,5") as not a number in every field', () => {
    assertNotANumberInEveryField(['20,5']);
  });

  test('still rejects Infinity, NaN and overflowing text as not a number in every field', () => {
    assertNotANumberInEveryField(['Infinity', '-Infinity', 'NaN', '1e309']);
  });

  test('still rejects the numbers Infinity and NaN as not a number in every field', () => {
    assertNotANumberInEveryField([Infinity, -Infinity, NaN]);
  });

  test('rejects text that is only part of a number (".", "+", "e5", "2e")', () => {
    assertNotANumberInEveryField(['.', '+', 'e5', '2e', '2.0.1']);
  });
});

// ---------------------------------------------------------------------------
// Added by the tester in the T6a review.
// ---------------------------------------------------------------------------

describe('plain decimal text only (T6a review)', () => {
  const FIELDS = [
    {
      field: 'litres',
      notANumber: 'Beer volume must be a number.',
      negative: 'Beer volume must be more than 0 litres.',
    },
    {
      field: 'tempC',
      notANumber: 'Temperature must be a number.',
      negative: 'Temperature must be between 0 and 40 °C.',
    },
    {
      field: 'targetVols',
      notANumber: 'Target CO2 must be a number.',
      negative: 'Target CO2 must be more than 0 volumes.',
    },
    {
      field: 'bottleMl',
      notANumber: 'Bottle size must be a number.',
      negative: 'Bottle size must be more than 0 ml.',
    },
  ];

  function assertNotANumberInEveryField(texts) {
    for (const { field, notANumber } of FIELDS) {
      for (const text of texts) {
        assertInputError(() => calc({ [field]: text }), field, notANumber);
      }
    }
  }

  test('rejects digit-group underscores ("1_000") as not a number in every field', () => {
    assertNotANumberInEveryField(['1_000', '2_0']);
  });

  test('rejects non-ASCII digits (Arabic-Indic "٢٠", full-width "２０") as not a number in every field', () => {
    assertNotANumberInEveryField(['٢٠', '２０']);
  });

  test('rejects a number with letters after it ("20abc") as not a number in every field', () => {
    assertNotANumberInEveryField(['20abc', '20 L', '2.4vols']);
  });

  test('rejects a doubled sign ("--20", "+-20") as not a number in every field', () => {
    assertNotANumberInEveryField(['--20', '+-20', '++20']);
  });

  test('negative text ("-5") gets each field\'s range message, not "must be a number"', () => {
    for (const { field, negative } of FIELDS) {
      assertInputError(() => calc({ [field]: '-5' }), field, negative);
    }
  });

  test('zero text ("0.0") gets the "more than 0" message for volume, target CO2 and bottle size', () => {
    for (const { field, negative } of FIELDS.filter((f) => f.field !== 'tempC')) {
      assertInputError(() => calc({ [field]: '0.0' }), field, negative);
    }
  });

  test('zero text ("0.0") is accepted as 0 °C', () => {
    assert.deepEqual(calc({ tempC: '0.0' }), calc({ tempC: 0 }));
  });

  test('rejects a very long non-number quickly (50,000 characters in under 250 ms)', () => {
    // Digits then one bad character is the slowest shape for a regex with two
    // ways to split a run of digits. A linear check takes well under 1 ms here.
    const text = `${'1'.repeat(50_000)}x`;
    const start = performance.now();
    assertInputError(() => calc({ litres: text }), 'litres', 'Beer volume must be a number.');
    const ms = performance.now() - start;
    assert.ok(ms < 250, `took ${ms.toFixed(0)} ms to reject ${text.length} characters`);
  });
});

// ---------------------------------------------------------------------------
// Added by the tester in the T6a second review (parallel PM run).
// ---------------------------------------------------------------------------

describe('plain decimal text only (T6a second review, signed and hostile text)', () => {
  const FIELDS = [
    { field: 'litres', notANumber: 'Beer volume must be a number.', notPositive: 'Beer volume must be more than 0 litres.' },
    { field: 'tempC', notANumber: 'Temperature must be a number.' },
    { field: 'targetVols', notANumber: 'Target CO2 must be a number.', notPositive: 'Target CO2 must be more than 0 volumes.' },
    { field: 'bottleMl', notANumber: 'Bottle size must be a number.', notPositive: 'Bottle size must be more than 0 ml.' },
  ];

  test('rejects signed hex, binary and octal text ("-0x14", "+0B10100", " -0o24 ") as not a number in every field', () => {
    const texts = ['-0x14', '+0x14', '-0X14', '+0b10100', '-0B10100', '+0o24', '-0O24', ' -0x14 ', '\t+0b10100\n', '  -0o24  '];
    for (const { field, notANumber } of FIELDS) {
      for (const text of texts) {
        assertInputError(() => calc({ [field]: text }), field, notANumber);
      }
    }
  });

  test('still accepts a point and an exponent together ("2.e1", ".2e2", "2.0E+1") in every field', () => {
    for (const { field } of FIELDS) {
      for (const text of ['2.e1', '.2e2', '2.0E+1', '20.0e0', '+2.e+1']) {
        assert.deepEqual(calc({ [field]: text }), calc({ [field]: 20 }), `${field}: "${text}"`);
      }
    }
  });

  test('"-0" text is accepted as 0 °C', () => {
    assert.deepEqual(calc({ tempC: '-0' }), calc({ tempC: 0 }));
  });

  test('"-0" text gets the "more than 0" message for volume, target CO2 and bottle size', () => {
    for (const { field, notPositive } of FIELDS.filter((f) => f.notPositive)) {
      assertInputError(() => calc({ [field]: '-0' }), field, notPositive);
    }
  });

  // Each shape is checked at 20,000 characters first. A quadratic check takes
  // about 1 s there, so a slow regex fails fast instead of hanging the run at
  // 1,000,000 characters. A linear check takes about 10 ms at full size.
  function assertRejectedQuickly(makeText) {
    for (const [size, limitMs] of [[20_000, 50], [1_000_000, 100]]) {
      const text = makeText(size);
      const start = performance.now();
      assertInputError(() => calc({ litres: text }), 'litres', 'Beer volume must be a number.');
      const ms = performance.now() - start;
      assert.ok(ms < limitMs, `took ${ms.toFixed(0)} ms to reject ${text.length} characters (limit ${limitMs} ms)`);
    }
  }

  describe('rejects long hostile text in under 100 ms at 1,000,000 characters', () => {
    const half = (n) => Math.floor(n / 2);

    test('digits then one bad character ("111…1x")', () => {
      assertRejectedQuickly((n) => `${'1'.repeat(n)}x`);
    });

    test('digits, a point, digits, then one bad character ("111.111…x")', () => {
      assertRejectedQuickly((n) => `${'1'.repeat(half(n))}.${'1'.repeat(half(n))}x`);
    });

    test('a long exponent then one bad character ("1e111…x")', () => {
      assertRejectedQuickly((n) => `1e${'1'.repeat(n)}x`);
    });

    test('digits, an exponent, digits, then one bad character ("111e111…x")', () => {
      assertRejectedQuickly((n) => `${'1'.repeat(half(n))}e${'1'.repeat(half(n))}x`);
    });

    test('digits then an exponent with no digits ("111…e+")', () => {
      assertRejectedQuickly((n) => `${'1'.repeat(n)}e+`);
    });

    test('a long run of dots ("……")', () => {
      assertRejectedQuickly((n) => '.'.repeat(n));
    });

    test('a long run of signs then a digit ("+-+-…1")', () => {
      assertRejectedQuickly((n) => `${'+-'.repeat(half(n))}1`);
    });

    test('"1." over and over ("1.1.1.…")', () => {
      assertRejectedQuickly((n) => '1.'.repeat(half(n)));
    });
  });
});

// ---------------------------------------------------------------------------
// Added by the tester in the T6a second review (linear-time decimal check).
// ---------------------------------------------------------------------------

describe('plain decimal text only (T6a second review, linear-time check)', () => {
  const FIELDS = [
    { field: 'litres', notANumber: 'Beer volume must be a number.' },
    { field: 'tempC', notANumber: 'Temperature must be a number.' },
    { field: 'targetVols', notANumber: 'Target CO2 must be a number.' },
    { field: 'bottleMl', notANumber: 'Bottle size must be a number.' },
  ];

  /** Rejects the text as not a number in the field, and returns how long it took in ms. */
  function timeRejection(field, notANumber, text) {
    const start = performance.now();
    assertInputError(() => calc({ [field]: text }), field, notANumber);
    return performance.now() - start;
  }

  // Each shape below took quadratic time with the first T6a regex
  // (about 0.1 to 0.5 s at 20,000 characters). A linear check takes well
  // under 1 ms at 50,000.
  const ones = (n) => '1'.repeat(n);
  const LONG_SHAPES = [
    { name: 'a decimal point in the middle', text: `${ones(25_000)}.${ones(25_000)}x` },
    { name: 'a bare exponent mark ("e")', text: `${ones(50_000)}ex` },
    { name: 'a signed exponent ("e+") and a long exponent', text: `${ones(25_000)}e+${ones(25_000)}x` },
  ];
  for (const { name, text } of LONG_SHAPES) {
    test(`rejects a very long non-number with ${name} quickly (50,000 characters in under 250 ms)`, () => {
      const ms = timeRejection('litres', 'Beer volume must be a number.', text);
      assert.ok(ms < 250, `took ${ms.toFixed(0)} ms to reject ${text.length} characters`);
    });
  }

  test('rejects a very long non-number quickly in temperature, target CO2 and bottle size too', () => {
    const text = `${ones(50_000)}x`;
    for (const { field, notANumber } of FIELDS.filter((f) => f.field !== 'litres')) {
      const ms = timeRejection(field, notANumber, text);
      assert.ok(ms < 250, `${field}: took ${ms.toFixed(0)} ms to reject ${text.length} characters`);
    }
  });

  test('still accepts a very long plain decimal (a point then 50,000 zeros then 5) as a number', () => {
    // Underflows to 0, which is a valid temperature, so the result must match 0 °C.
    const text = `0.${'0'.repeat(50_000)}5`;
    assert.deepEqual(calc({ tempC: text }), calc({ tempC: 0 }));
  });

  test('reads every short text over "01.eE+-x " as a number exactly when it is plain decimal text', () => {
    // Independent of the module's regex: a hand-written check of the plain
    // decimal shape (optional sign, digits with an optional point, at least
    // one digit, optional exponent with at least one digit).
    const isDigit = (ch) => ch !== undefined && ch >= '0' && ch <= '9';
    function isPlainDecimal(s) {
      let i = 0;
      if (s[i] === '+' || s[i] === '-') i += 1;
      let mantissaDigits = 0;
      while (isDigit(s[i])) { i += 1; mantissaDigits += 1; }
      if (s[i] === '.') {
        i += 1;
        while (isDigit(s[i])) { i += 1; mantissaDigits += 1; }
      }
      if (mantissaDigits === 0) return false;
      if (s[i] === 'e' || s[i] === 'E') {
        i += 1;
        if (s[i] === '+' || s[i] === '-') i += 1;
        const expStart = i;
        while (isDigit(s[i])) i += 1;
        if (i === expStart) return false;
      }
      return i === s.length;
    }

    const ALPHABET = ['0', '1', '.', 'e', 'E', '+', '-', 'x', ' '];
    let texts = [''];
    let layer = [''];
    for (let len = 1; len <= 5; len += 1) {
      layer = layer.flatMap((prefix) => ALPHABET.map((ch) => prefix + ch));
      texts = texts.concat(layer);
    }

    const wrong = [];
    for (const text of texts) {
      const t = text.trim();
      const expectNotANumber = t !== '' && !(isPlainDecimal(t) && Number.isFinite(Number(t)));
      let gotNotANumber = false;
      try {
        calc({ litres: text });
      } catch (err) {
        gotNotANumber = err.message === 'Beer volume must be a number.';
      }
      if (gotNotANumber !== expectNotANumber && wrong.length < 10) {
        wrong.push(`${JSON.stringify(text)}: ${gotNotANumber ? 'rejected' : 'read as a number'}`);
      }
    }
    assert.equal(texts.length, 66_430);
    assert.deepEqual(wrong, []);
  });
});


// ---------------------------------------------------------------------------
// Added by the tester in the T6 second run.
// ---------------------------------------------------------------------------

describe('target exactly at the residual CO2 (T6 second run)', () => {
  // The residual CO2 from the PROJECT.md formula, worked out by hand. The
  // coefficients are short decimals, so the true residual is a short decimal
  // too. A brewer who types exactly this target is at the residual, not above it.
  const EXACT_RESIDUALS = [
    // 0 °C = 32 °F: 3.0378 − 0.050062 × 32 + 0.00026555 × 1024 = 1.7077392
    { tempC: 0, residual: '1.7077392' },
    // 20 °C = 68 °F: 3.0378 − 3.404216 + 1.2279032 = 0.8614872
    { tempC: 20, residual: '0.8614872' },
    // 25 °C = 77 °F: 3.0378 − 3.854774 + 1.57444595 = 0.75747195
    { tempC: 25, residual: '0.75747195' },
    // 30 °C = 86 °F: 3.0378 − 4.305332 + 1.9640078 = 0.6964758
    { tempC: 30, residual: '0.6964758' },
    // 40 °C = 104 °F: 3.0378 − 5.206448 + 2.8721888 = 0.7035408
    { tempC: 40, residual: '0.7035408' },
  ];

  // Parked under "Needs you" (T6 failed review twice). Drop the todo once the
  // module counts a target at the residual as "no sugar needed".
  test('a target typed as the exact PROJECT.md residual flags no sugar needed and gives 0 g (0, 20, 25, 30, 40 °C)', { todo: 'T6 parked: target exactly at the residual misses the no-sugar note (floating-point); waiting on Toon' }, () => {
    const wrong = [];
    for (const { tempC, residual } of EXACT_RESIDUALS) {
      const result = calc({ tempC, targetVols: residual });
      if (!result.noSugarNeeded || result.batchGrams !== 0 || result.perBottleGrams !== 0) {
        wrong.push(
          `${tempC} °C, target "${residual}": noSugarNeeded ${result.noSugarNeeded}, ` +
            `batchGrams ${result.batchGrams}, perBottleGrams ${result.perBottleGrams}`,
        );
      }
    }
    assert.deepEqual(wrong, [], `expected no sugar at the residual:\n${wrong.join('\n')}`);
  });
});

describe('module purity', () => {
  // Source with comments removed, so the doc comments don't trigger matches.
  const source = readFileSync(new URL('../docs/js/priming.js', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  test('priming.js imports nothing', () => {
    assert.doesNotMatch(source, /\bimport\b|\brequire\s*\(/);
  });

  test('priming.js uses no DOM, browser storage or Node globals', () => {
    assert.doesNotMatch(
      source,
      /\b(window|document|navigator|localStorage|sessionStorage|process|Buffer|globalThis|fetch|console)\b/,
    );
  });

  test('calculatePriming does not change the inputs object', () => {
    const inputs = { litres: '20', tempC: '20', targetVols: '2.4', bottleMl: '330', sugar: 'table' };
    const copy = { ...inputs };
    calculatePriming(inputs);
    assert.deepEqual(inputs, copy);
  });
});
