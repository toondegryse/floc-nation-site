import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

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
