/**
 * Priming-sugar maths for the Floc Nation calculator.
 *
 * Pure functions only: no DOM code, no dependencies.
 * The formulas follow "Calculator reference" in PROJECT.md.
 * Nothing is rounded here. The page rounds for display.
 *
 * Bad input throws a PrimingInputError (a RangeError). Its message is
 * plain English and can be shown next to the field as is. Its `field`
 * names the input it is about, e.g. 'tempC', and its `code` says what is
 * wrong (see ERROR_CODES), so a page in another language can word it.
 *
 * Number inputs accept a number or the raw string from a form field.
 * Pass the raw string (input.value) so an empty field gets an
 * "Enter ..." message rather than "... must be a number."
 * Text must be a plain decimal number, such as "20", "2.4" or "2e1".
 * Hex, binary and octal text ("0x14", "0b10100", "0o24") is a typo, not
 * a number, so it gets "... must be a number."
 */

/** Grams of sugar per litre of beer for each volume of CO2. */
export const SUGAR_FACTORS = Object.freeze({
  dextrose: 4.0,
  table: 3.82,
});

/** Bottle sizes the page offers, in ml. */
export const BOTTLE_SIZES_ML = Object.freeze([330, 500, 620, 640]);

/** Bottle size used when none is given, in ml. */
export const DEFAULT_BOTTLE_ML = 330;

/** Temperatures the residual CO2 formula accepts, in °C (inclusive). */
export const TEMP_RANGE_C = Object.freeze({ min: 0, max: 40 });

/** Targets above this many volumes need bottles rated for high pressure. */
export const HIGH_PRESSURE_VOLS = 3.0;

/**
 * Beer style presets for the target CO2, in volumes.
 * Custom has no range and no default: the brewer types a target.
 */
export const STYLE_PRESETS = Object.freeze([
  stylePreset('british-ales', 'British ales', 1.5, 2.0, 1.8),
  stylePreset('stout-porter', 'Stout and porter', 1.8, 2.3, 2.0),
  stylePreset('american-ale-ipa', 'American ales and IPA', 2.2, 2.7, 2.4),
  stylePreset('lager-pilsner', 'Lager and pilsner', 2.4, 2.6, 2.5),
  stylePreset('wheat', 'Wheat beer', 3.3, 4.5, 3.5),
  stylePreset('custom', 'Custom', null, null, null),
]);

/**
 * What can be wrong with an input, as PrimingInputError.code:
 *   empty         nothing typed
 *   not-number    not a plain decimal number
 *   not-positive  0 or less where more than 0 is needed
 *   out-of-range  temperature outside TEMP_RANGE_C
 *   too-big       bottle bigger than the whole batch
 *   negative      batch sugar below 0 g
 *   unknown       sugar type that isn't in SUGAR_FACTORS
 */
export const ERROR_CODES = Object.freeze([
  'empty', 'not-number', 'not-positive', 'out-of-range', 'too-big', 'negative', 'unknown',
]);

/** Error for input the calculator can't use. */
export class PrimingInputError extends RangeError {
  /**
   * @param {string} message Plain-English message, fine to show on the page.
   * @param {string} field   The input it is about, e.g. 'tempC'.
   * @param {string} [code]  What is wrong, one of ERROR_CODES.
   */
  constructor(message, field, code = 'unknown') {
    super(message);
    this.name = 'PrimingInputError';
    this.field = field;
    this.code = code;
  }
}

/**
 * Converts °C to °F: F = C × 9/5 + 32.
 * @param {number|string} c Temperature in °C.
 * @returns {number} Temperature in °F.
 */
export function celsiusToFahrenheit(c) {
  return (readNumber(c, 'tempC') * 9) / 5 + 32;
}

/**
 * Volumes of CO2 already in the beer, from the highest temperature it
 * reached after fermentation.
 * @param {number|string} tempC Highest temperature in °C, 0 to 40.
 * @returns {number} Residual CO2 in volumes.
 */
export function residualCO2(tempC) {
  const f = celsiusToFahrenheit(readTempC(tempC));
  return 3.0378 - 0.050062 * f + 0.00026555 * f * f;
}

/**
 * Grams of priming sugar for the whole batch.
 * Returns 0, never a negative number, when the target is at or below
 * the residual CO2.
 * @param {object} inputs
 * @param {number|string} inputs.litres     Beer volume in litres, more than 0.
 * @param {number|string} inputs.tempC      Highest temperature in °C, 0 to 40.
 * @param {number|string} inputs.targetVols Target CO2 in volumes, more than 0.
 * @param {'dextrose'|'table'} [inputs.sugar='dextrose']
 * @returns {number} Grams of sugar for the batch.
 */
export function batchSugarGrams(inputs) {
  const { litres, tempC, targetVols, sugar = 'dextrose' } = readInputs(inputs);
  const batchLitres = readPositive(litres, 'litres');
  const residual = residualCO2(tempC);
  const target = readPositive(targetVols, 'targetVols');
  const factor = readSugarFactor(sugar);
  return Math.max(0, (target - residual) * batchLitres * factor);
}

/**
 * Grams of priming sugar for one bottle.
 * @param {number|string} batchGrams   Grams for the whole batch, 0 or more.
 * @param {number|string} bottleLitres Bottle size in litres, more than 0.
 * @param {number|string} batchLitres  Beer volume in litres, at least one bottle.
 * @returns {number} Grams of sugar per bottle.
 */
export function gramsPerBottle(batchGrams, bottleLitres, batchLitres) {
  const grams = readNumber(batchGrams, 'batchGrams');
  if (grams < 0) {
    throw new PrimingInputError("Batch sugar can't be less than 0 g.", 'batchGrams', 'negative');
  }
  const bottle = readPositive(bottleLitres, 'bottleLitres');
  const batch = readPositive(batchLitres, 'batchLitres');
  if (bottle > batch) {
    throw new PrimingInputError(BOTTLE_TOO_BIG, 'bottleLitres', 'too-big');
  }
  return (grams * bottle) / batch;
}

/**
 * Everything the calculator page shows, in one call.
 * @param {object} inputs
 * @param {number|string} inputs.litres     Beer volume in litres, more than 0.
 * @param {number|string} inputs.tempC      Highest temperature in °C, 0 to 40.
 * @param {number|string} inputs.targetVols Target CO2 in volumes, more than 0.
 * @param {number|string} [inputs.bottleMl=330] Bottle size in ml, no bigger than the batch.
 * @param {'dextrose'|'table'} [inputs.sugar='dextrose']
 * @returns {{
 *   residual: number,
 *   batchGrams: number,
 *   perBottleGrams: number,
 *   noSugarNeeded: boolean,
 *   highPressure: boolean
 * }} residual is in volumes. Grams are 0 when noSugarNeeded is true.
 *    highPressure is true when the target is above 3.0 volumes.
 */
export function calculatePriming(inputs) {
  const {
    litres,
    tempC,
    targetVols,
    bottleMl = DEFAULT_BOTTLE_ML,
    sugar = 'dextrose',
  } = readInputs(inputs);

  const batchLitres = readPositive(litres, 'litres');
  const residual = residualCO2(tempC);
  const target = readPositive(targetVols, 'targetVols');
  const bottleLitres = readPositive(bottleMl, 'bottleMl') / 1000;
  if (bottleLitres > batchLitres) {
    throw new PrimingInputError(BOTTLE_TOO_BIG, 'bottleMl', 'too-big');
  }

  const batchGrams = batchSugarGrams({ litres: batchLitres, tempC, targetVols: target, sugar });
  const perBottleGrams = gramsPerBottle(batchGrams, bottleLitres, batchLitres);

  return {
    residual,
    batchGrams,
    perBottleGrams,
    noSugarNeeded: target <= residual,
    highPressure: target > HIGH_PRESSURE_VOLS,
  };
}

// ---------------------------------------------------------------------------
// Input checks (not exported)
// ---------------------------------------------------------------------------

const BOTTLE_TOO_BIG = "Bottle size can't be bigger than the whole batch.";

const INPUTS = {
  litres: { name: 'Beer volume', unit: 'litres', enter: 'Enter the beer volume in litres.' },
  batchLitres: { name: 'Beer volume', unit: 'litres', enter: 'Enter the beer volume in litres.' },
  tempC: { name: 'Temperature', unit: '°C', enter: 'Enter the highest temperature the beer reached.' },
  targetVols: { name: 'Target CO2', unit: 'volumes', enter: 'Enter a target CO2 level in volumes.' },
  bottleMl: { name: 'Bottle size', unit: 'ml', enter: 'Enter the bottle size in ml.' },
  bottleLitres: { name: 'Bottle size', unit: 'litres', enter: 'Enter the bottle size in litres.' },
  batchGrams: { name: 'Batch sugar', unit: 'g', enter: 'Enter the batch sugar in grams.' },
};

function stylePreset(id, name, min, max, defaultVols) {
  return Object.freeze({ id, name, min, max, default: defaultVols });
}

function readInputs(inputs) {
  if (inputs === null || typeof inputs !== 'object') {
    throw new TypeError('Pass the calculator inputs as an object.');
  }
  return inputs;
}

function readNumber(value, field) {
  const { name, enter } = INPUTS[field];
  const isEmpty =
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  if (isEmpty) {
    throw new PrimingInputError(enter, field, 'empty');
  }
  const n = toNumber(value);
  if (!Number.isFinite(n)) {
    throw new PrimingInputError(`${name} must be a number.`, field, 'not-number');
  }
  return n;
}

// Plain decimal text: optional sign, digits with an optional point, optional
// exponent. Number() alone would also read "0x14", "0b10100" and "0o24" as 20.
// Digits after the point only count when the point is there, so a long run of
// digits has one way to match and a failed check stays linear in its length.
const DECIMAL_TEXT = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;

/** A number as is, plain decimal text as its value, anything else as NaN. */
function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && DECIMAL_TEXT.test(value.trim())) return Number(value);
  return NaN;
}

function readPositive(value, field) {
  const n = readNumber(value, field);
  if (n <= 0) {
    const { name, unit } = INPUTS[field];
    throw new PrimingInputError(`${name} must be more than 0 ${unit}.`, field, 'not-positive');
  }
  return n;
}

function readTempC(value) {
  const c = readNumber(value, 'tempC');
  if (c < TEMP_RANGE_C.min || c > TEMP_RANGE_C.max) {
    throw new PrimingInputError(
      `Temperature must be between ${TEMP_RANGE_C.min} and ${TEMP_RANGE_C.max} °C.`,
      'tempC',
      'out-of-range',
    );
  }
  return c;
}

// Same as the built-in hasOwn check, which needs iOS 15.4 or Chrome 93.
// This also works on older phones.
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function readSugarFactor(sugar) {
  if (typeof sugar !== 'string' || !hasOwn(SUGAR_FACTORS, sugar)) {
    throw new PrimingInputError('Sugar type must be dextrose or table sugar.', 'sugar', 'unknown');
  }
  return SUGAR_FACTORS[sugar];
}
