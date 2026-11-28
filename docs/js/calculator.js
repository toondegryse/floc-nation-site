/**
 * Page wiring for the priming-sugar calculator (docs/calculator.html).
 *
 * Two parts:
 *   1. computeView(rawValues): pure, no DOM. It takes the raw field values
 *      and returns exactly what the page shows. Node can import it for tests.
 *   2. initPage(document): the DOM code. It runs only in a browser.
 *
 * The maths and the input checks live in priming.js, the style guide
 * text in styles.js, and the words this file writes in i18n.js. This file
 * reads the fields, rounds the numbers for display and decides what to show.
 *
 * Languages: the page's <html lang> picks English or Thai. computeView()
 * takes the language as options.lang ('en' when left out). The numbers are
 * the same in both languages; only the words change.
 */

import {
  calculatePriming,
  PrimingInputError,
  STYLE_PRESETS,
  BOTTLE_SIZES_ML,
  DEFAULT_BOTTLE_ML,
  HIGH_PRESSURE_VOLS,
  MAX_BOTTLE_ML,
  MAX_LITRES,
  MAX_TARGET_VOLS,
  TEMP_RANGE_C,
} from './priming.js';
import { guideForStyle } from './styles.js';
import { fill, langOf, textFor } from './i18n.js';

// ---------------------------------------------------------------------------
// Page constants
// ---------------------------------------------------------------------------

/** Value of the "Custom size" option in the bottle size list. */
export const CUSTOM_BOTTLE = 'custom';

/** Beer style picked when the page opens. */
export const DEFAULT_STYLE_ID = 'american-ale-ipa';

/** Safety notes in English, worded exactly as in PROJECT.md. */
export const NOTES = textFor('en').notes;

/**
 * What the fields hold when the page opens. computeView() also uses these
 * for any key it is not given.
 */
export const DEFAULT_VALUES = Object.freeze({
  litres: '',
  bottleSize: String(DEFAULT_BOTTLE_ML),
  customBottleMl: '',
  style: DEFAULT_STYLE_ID,
  targetVols: targetForStyle(DEFAULT_STYLE_ID),
  tempC: '',
  sugar: 'dextrose',
});

/** Fields the brewer types into, in page order. */
const TEXT_FIELDS = Object.freeze(['litres', 'customBottleMl', 'targetVols', 'tempC']);

/** Fields that can carry an error message on the page. */
const ERROR_FIELDS = Object.freeze(['litres', 'bottleSize', 'customBottleMl', 'targetVols', 'tempC', 'sugar']);

/**
 * Stand-in values used while checking the other fields, so each bad field
 * gets its own message. The batch is the largest the calculator takes, so
 * no bottle the calculator takes can be bigger.
 */
const STAND_INS = Object.freeze({
  litres: MAX_LITRES,
  tempC: (TEMP_RANGE_C.min + TEMP_RANGE_C.max) / 2,
  targetVols: 2.4,
  bottleMl: DEFAULT_BOTTLE_ML,
  sugar: 'dextrose',
});

/** The {min} and {max} in each field's Thai range and limit messages. */
const FIELD_LIMITS = Object.freeze({
  tempC: TEMP_RANGE_C,
  litres: Object.freeze({ max: MAX_LITRES }),
  targetVols: Object.freeze({ max: MAX_TARGET_VOLS }),
  bottleMl: Object.freeze({ max: MAX_BOTTLE_ML }),
});

/**
 * toFixed() writes numbers of 1e21 and up in exponent form ("1e+21"), so a
 * figure on the page must be finite and below this. The limits in
 * priming.js keep every figure far below it (under 400,000 g).
 */
const PLAIN_FIGURE_LIMIT = 1e21;

// ---------------------------------------------------------------------------
// Pure part
// ---------------------------------------------------------------------------

/**
 * The target CO2 a style fills in, as text for the target field.
 * @param {string} styleId An id from STYLE_PRESETS.
 * @returns {string|null} e.g. '2.4', or null for Custom or an unknown id.
 */
export function targetForStyle(styleId) {
  const preset = findStyle(styleId);
  return preset && preset.default !== null ? formatVols(preset.default) : null;
}

/** Label of the guide's first line for a style with a range (English). */
export const GUIDE_RANGE_LABEL = textFor('en').guideRangeLabel;

/** Label of the line Custom gets with the usual figures (English). */
export const GUIDE_TYPICAL_LABEL = textFor('en').typicalLabel;

/**
 * The lines of the style guide shown under the style menu.
 *
 * A style with a range leads with "Usual range: <min> to <max> volumes.",
 * built from STYLE_PRESETS, followed on the same line by how it should feel
 * in the glass (styles.js). Its other lines follow. Custom has no range, so
 * it shows its own lines, with a "Typical beers" line after the first one.
 * That line's figures come from STYLE_PRESETS too.
 *
 * @param {string} styleId An id from STYLE_PRESETS.
 * @param {'en'|'th'} [lang='en'] Language of the page.
 * @returns {{ points: ReadonlyArray<{ label: string, text: string }> }|null}
 *   One { label, text } per line, shown as "label: text", or null for an
 *   unknown id.
 */
export function styleGuideView(styleId, lang = 'en') {
  const t = textFor(lang);
  const guide = guideForStyle(styleId, lang);
  const preset = findStyle(styleId);
  if (!guide || !preset) return null;
  if (!hasRange(preset)) {
    const [first, ...rest] = guide.points;
    const typical = { label: t.typicalLabel, text: typicalText(lang) };
    return { points: first ? [first, typical, ...rest] : [typical] };
  }
  const rangeLine = fill(t.guideRangeLine, { range: rangeText(preset, lang) });
  return {
    points: [{ label: t.guideRangeLabel, text: [rangeLine, guide.feel].filter(Boolean).join(' ') }, ...guide.points],
  };
}

/**
 * The words for an input error, in the page's language.
 * @param {PrimingInputError} err From priming.js.
 * @param {'en'|'th'} [lang='en']
 * @returns {string} English: the module's own message. Thai: the Thai
 *   message for the error's field and code, with the field's limits filled in.
 */
export function errorMessage(err, lang = 'en') {
  if (lang !== 'th') return err.message;
  const t = textFor('th');
  const template = ownValue(t.errors, `${err.field}.${err.code}`) ?? t.errorFallback;
  const limits = ownValue(FIELD_LIMITS, err.field) ?? {};
  const values = {};
  for (const key of ['min', 'max']) {
    if (typeof limits[key] === 'number') values[key] = groupThousands(limits[key]);
  }
  return fill(template, values);
}

/**
 * A style's name in the page's language.
 * @param {string} styleId An id from STYLE_PRESETS.
 * @param {'en'|'th'} [lang='en']
 * @returns {string|null} null for an unknown id.
 */
export function styleName(styleId, lang = 'en') {
  const preset = findStyle(styleId);
  if (!preset) return null;
  return (lang === 'th' ? ownValue(textFor('th').styleNames, preset.id) : null) ?? preset.name;
}

/**
 * Everything the page shows for the given field values.
 *
 * @param {object} raw Raw field values, as strings from input.value.
 *   Missing keys take their DEFAULT_VALUES value.
 * @param {string} [raw.litres]         Beer volume in litres.
 * @param {string} [raw.bottleSize]     '330', '500', '620', '640' or 'custom'.
 * @param {string} [raw.customBottleMl] Bottle size in ml, used when bottleSize is 'custom'.
 * @param {string} [raw.style]          A STYLE_PRESETS id. Changes the target hint and the style guide.
 * @param {string} [raw.targetVols]     Target CO2 in volumes.
 * @param {string} [raw.tempC]          Highest temperature after fermentation, in °C.
 * @param {string} [raw.sugar]          'dextrose' or 'table'.
 * @param {object} [options]
 * @param {'en'|'th'} [options.lang='en'] Language of the words in the result.
 * @param {Set<string>|string[]} [options.touched] Text fields the brewer has
 *   typed in or left. An empty field that is not touched yet gets no error
 *   message; the results area asks for it instead. Leave this out to get
 *   every error message.
 * @returns {{
 *   hasResult: boolean,
 *   batchLabel: string,
 *   batchText: string,
 *   perBottleLabel: string,
 *   perBottleText: string,
 *   residualText: string,
 *   notes: string[],
 *   errors: Object<string, string>,
 *   prompt: string,
 *   targetHint: string,
 *   styleGuide: { points: ReadonlyArray<{ label: string, text: string }> }|null,
 *   showCustomBottle: boolean,
 *   result: object|null
 * }}
 *   batchText is grams to 1 decimal and perBottleText grams to 2 decimals,
 *   without the unit. Both are '' when there is no result, and never
 *   Infinity, NaN or in exponent form.
 *   notes holds the safety notes to show, word for word.
 *   errors maps a field (litres, bottleSize, customBottleMl, targetVols,
 *   tempC, sugar) to the message shown next to it.
 *   prompt is the line shown in the results area when there is no result:
 *   fix the marked fields, fill in the missing ones, or (with nothing to
 *   mark) check the numbers.
 *   styleGuide is styleGuideView() for the picked style: the lines shown
 *   under the style menu, or null (no guide shown) for an unknown style id.
 *   result is what calculatePriming() returned, or null.
 */
export function computeView(raw = {}, options = {}) {
  const lang = options.lang === 'th' ? 'th' : 'en';
  const t = textFor(lang);
  const values = { ...DEFAULT_VALUES, ...definedOnly(raw) };
  const isTouched = touchedCheck(options.touched);
  const showCustomBottle = values.bottleSize === CUSTOM_BOTTLE;
  const bottleMl = showCustomBottle ? values.customBottleMl : values.bottleSize;

  const { result, fieldErrors } = runCalculator({
    litres: values.litres,
    tempC: values.tempC,
    targetVols: values.targetVols,
    bottleMl,
    sugar: values.sugar,
  });

  // Put each message on the page field it is about. Hold back "Enter ..."
  // messages for empty fields the brewer hasn't reached yet.
  const errors = {};
  const waiting = [];
  for (const [field, err] of Object.entries(fieldErrors)) {
    const key = field === 'bottleMl' ? (showCustomBottle ? 'customBottleMl' : 'bottleSize') : field;
    if (TEXT_FIELDS.includes(key) && isEmpty(values[key]) && !isTouched(key)) {
      waiting.push(key);
    } else {
      errors[key] = errorMessage(err, lang);
    }
  }

  let prompt = '';
  if (!result) {
    const missing = TEXT_FIELDS.filter((key) => waiting.includes(key));
    if (Object.keys(errors).length > 0) {
      prompt = t.promptFix;
    } else if (missing.length > 0) {
      prompt = fill(t.promptFill, { fields: joinList(missing.map((key) => t.fieldNames[key]), t) });
    } else {
      // No field to mark and none to fill in, yet no result: the module
      // could not work with the numbers (see runCalculator).
      prompt = t.promptCheck;
    }
  }

  const sugarName = ownValue(t.sugarNames, values.sugar) ?? t.sugarFallback;
  const notes = [];
  if (result?.highPressure) notes.push(t.notes.highPressure);
  if (result?.noSugarNeeded) notes.push(t.notes.noSugarNeeded);

  return {
    hasResult: result !== null,
    batchLabel: fill(t.batchLabel, { sugar: sugarName }),
    batchText: result ? fixed(result.batchGrams, 1) : '',
    perBottleLabel: result ? fill(t.perBottleLabel, { sugar: sugarName, ml: plainNumber(Number(bottleMl)) }) : '',
    perBottleText: result ? fixed(result.perBottleGrams, 2) : '',
    residualText: result ? fill(t.residual, { vols: fixed(result.residual, 2) }) : '',
    notes,
    errors,
    prompt,
    targetHint: targetHint(values.style, values.targetVols, !('targetVols' in fieldErrors), lang),
    styleGuide: styleGuideView(values.style, lang),
    showCustomBottle,
    result,
  };
}

/**
 * Runs calculatePriming() and collects one error per bad field. The module
 * stops at the first bad field, so each bad field is swapped for a stand-in
 * and the call is tried again.
 *
 * The result is null unless every field is good and every figure can be
 * shown as plain digits. An input error about a value that is not a page
 * field (the bottle in litres, the batch sugar) ends the run with no result
 * instead of throwing, so the page never keeps old figures.
 */
function runCalculator(inputs) {
  const trial = { ...inputs };
  const fieldErrors = {};
  for (let i = 0; i <= Object.keys(STAND_INS).length; i += 1) {
    try {
      const result = calculatePriming(trial);
      const usable = Object.keys(fieldErrors).length === 0 && hasPlainFigures(result);
      return { result: usable ? result : null, fieldErrors };
    } catch (err) {
      if (!(err instanceof PrimingInputError)) throw err; // a bug, not bad input
      // Not a page field: there is nothing to mark, so stop with no result.
      if (!hasOwn(STAND_INS, err.field)) break;
      // A stand-in clashed with another field (a bottle bigger than a tiny
      // batch). The field already has its own message, so stop here.
      if (hasOwn(fieldErrors, err.field)) break;
      fieldErrors[err.field] = err;
      trial[err.field] = STAND_INS[err.field];
    }
  }
  return { result: null, fieldErrors };
}

/** True when every figure the page shows is finite and below PLAIN_FIGURE_LIMIT. */
function hasPlainFigures(result) {
  return [result.batchGrams, result.perBottleGrams, result.residual].every(
    (n) => Number.isFinite(n) && Math.abs(n) < PLAIN_FIGURE_LIMIT,
  );
}

function targetHint(styleId, targetRaw, targetIsValid, lang) {
  const t = textFor(lang);
  const preset = findStyle(styleId);
  if (!preset || !hasRange(preset)) return t.customTargetHint;
  const range = fill(t.targetHint, { style: styleName(preset.id, lang), range: rangeText(preset, lang) });
  const target = Number(targetRaw);
  const outside = targetIsValid && !isEmpty(targetRaw) && (target < preset.min || target > preset.max);
  return outside ? `${range} ${t.targetOutside}` : range;
}

/**
 * Custom's "Typical beers" line: the range most styles sit in (those that
 * stay at or under the high-pressure limit), and how high the highest goes.
 */
function typicalText(lang) {
  const ranged = STYLE_PRESETS.filter(hasRange);
  const usual = ranged.filter((p) => p.max <= HIGH_PRESSURE_VOLS);
  const highest = ranged.reduce((top, p) => (p.max > top.max ? p : top));
  return fill(textFor(lang).typicalText, {
    min: formatVols(Math.min(...usual.map((p) => p.min))),
    max: formatVols(Math.max(...usual.map((p) => p.max))),
    high: styleName(highest.id, lang),
    highMax: formatVols(highest.max),
  });
}

function findStyle(styleId) {
  return STYLE_PRESETS.find((preset) => preset.id === styleId) ?? null;
}

function hasRange(preset) {
  return preset.min !== null && preset.max !== null;
}

/** A preset's usual range, e.g. '3.3 to 4.5 volumes'. */
function rangeText(preset, lang = 'en') {
  return fill(textFor(lang).range, { min: formatVols(preset.min), max: formatVols(preset.max) });
}

function formatVols(vols) {
  return vols.toFixed(1);
}

/** Rounds for display. Adding 0 turns -0 into 0. */
function fixed(n, digits) {
  return (n + 0).toFixed(digits);
}

/**
 * A number as plain decimal text, never in exponent form. String() writes
 * numbers under 0.000001 as e.g. '1e-7'; this writes '0.0000001'. (String()
 * also uses exponents from 1e21 up, but MAX_BOTTLE_ML keeps bottle sizes far
 * below that.)
 */
function plainNumber(n) {
  const m = /^(\d)(?:\.(\d+))?e-(\d+)$/.exec(String(n));
  return m ? `0.${'0'.repeat(Number(m[3]) - 1)}${m[1]}${m[2] ?? ''}` : String(n);
}

/** A whole number with a comma between each group of three digits: 10000 → '10,000'. */
function groupThousands(n) {
  return String(n).replace(/\B(?=(\d{3})+$)/g, ',');
}

function isEmpty(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function definedOnly(raw) {
  const out = {};
  if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      if (value !== undefined) out[key] = value;
    }
  }
  return out;
}

function touchedCheck(touched) {
  if (touched === undefined || touched === null) return () => true;
  if (typeof touched.has === 'function') return (key) => touched.has(key);
  if (Array.isArray(touched)) return (key) => touched.includes(key);
  return (key) => Boolean(touched[key]);
}

function joinList(items, t) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(t.listSeparator)}${t.listLast}${items[items.length - 1]}`;
}

// The built-in hasOwn check needs iOS 15.4 or Chrome 93; this works on older phones too.
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** obj[key] if obj has key as its own property, otherwise undefined. */
function ownValue(obj, key) {
  return obj && typeof key === 'string' && hasOwn(obj, key) ? obj[key] : undefined;
}

// ---------------------------------------------------------------------------
// DOM part (browser only)
// ---------------------------------------------------------------------------

/** Element ids on calculator.html for each field. */
const FIELD_IDS = Object.freeze({
  litres: 'litres',
  bottleSize: 'bottle-size',
  customBottleMl: 'custom-bottle-ml',
  style: 'style',
  targetVols: 'target-vols',
  tempC: 'temp-c',
  sugar: 'sugar',
});

/** Lines in the style guide panel on calculator.html (#style-guide-1 to -4). */
const GUIDE_SLOTS = 4;

function initPage(doc) {
  const byId = (id) => doc.getElementById(id);
  const field = (key) => byId(FIELD_IDS[key]);
  if (!field('litres')) return; // not the calculator page
  const lang = langOf(doc);
  const t = textFor(lang);

  const sugarRadios = Array.from(doc.querySelectorAll('input[type="radio"][name="sugar"]'));
  const controlsFor = (key) => (key === 'sugar' ? sugarRadios : [field(key)]);
  const out = {
    customBottle: byId('custom-bottle'),
    targetHint: byId('target-vols-hint'),
    prompt: byId('result-prompt'),
    noteHighPressure: byId('note-high-pressure'),
    noteNoSugar: byId('note-no-sugar'),
    values: byId('result-values'),
    batchLabel: byId('batch-label'),
    batchGrams: byId('batch-grams'),
    perBottleLabel: byId('per-bottle-label'),
    perBottleGrams: byId('per-bottle-grams'),
    residual: byId('result-residual'),
    guide: byId('style-guide'),
    guideLines: Array.from({ length: GUIDE_SLOTS }, (_, i) => ({
      line: byId(`style-guide-${i + 1}`),
      label: byId(`style-guide-${i + 1}-label`),
      text: byId(`style-guide-${i + 1}-text`),
    })),
  };

  // Lists come from priming.js, so the page and the maths always agree.
  const bottleSelect = field('bottleSize');
  for (const ml of BOTTLE_SIZES_ML) addOption(bottleSelect, String(ml), fill(t.bottleOption, { ml }));
  addOption(bottleSelect, CUSTOM_BOTTLE, t.customBottleOption);
  const styleSelect = field('style');
  for (const preset of STYLE_PRESETS) addOption(styleSelect, preset.id, styleName(preset.id, lang));

  bottleSelect.value = DEFAULT_VALUES.bottleSize;
  styleSelect.value = DEFAULT_VALUES.style;
  field('targetVols').value = DEFAULT_VALUES.targetVols;
  setText(out.noteHighPressure, t.notes.highPressure);
  setText(out.noteNoSugar, t.notes.noSugarNeeded);

  // Hint ids from the HTML; the error id is added only while there is an error.
  const baseDescribedBy = new Map();
  for (const key of ERROR_FIELDS) {
    for (const control of controlsFor(key)) {
      baseDescribedBy.set(control, control.getAttribute('aria-describedby') ?? '');
    }
  }

  const touched = new Set();

  const readValues = () => ({
    litres: field('litres').value,
    bottleSize: bottleSelect.value,
    customBottleMl: field('customBottleMl').value,
    style: styleSelect.value,
    targetVols: field('targetVols').value,
    tempC: field('tempC').value,
    sugar: sugarRadios.find((radio) => radio.checked)?.value ?? '',
  });

  const paint = (view) => {
    for (const key of ERROR_FIELDS) {
      const message = view.errors[key] ?? '';
      const errorEl = byId(`${FIELD_IDS[key]}-error`);
      setText(errorEl, message);
      setHidden(errorEl, message === '');
      for (const control of controlsFor(key)) {
        setAttr(control, 'aria-invalid', message ? 'true' : null);
        const ids = [baseDescribedBy.get(control), message ? errorEl.id : ''].filter(Boolean).join(' ');
        setAttr(control, 'aria-describedby', ids || null);
      }
    }

    setHidden(out.customBottle, !view.showCustomBottle);
    setText(out.targetHint, view.targetHint);

    // Style guide: not a live region, so a new style doesn't interrupt the
    // results. The style menu's aria-describedby points to it.
    const points = view.styleGuide?.points ?? [];
    setHidden(out.guide, points.length === 0);
    out.guideLines.forEach((slot, i) => {
      const point = points[i];
      setHidden(slot.line, !point);
      setText(slot.label, point ? point.label : '');
      setText(slot.text, point ? point.text : '');
    });

    setText(out.prompt, view.prompt);
    setHidden(out.prompt, view.prompt === '');
    setHidden(out.noteHighPressure, !view.notes.includes(t.notes.highPressure));
    setHidden(out.noteNoSugar, !view.notes.includes(t.notes.noSugarNeeded));
    setHidden(out.values, !view.hasResult);
    if (view.hasResult) {
      setText(out.batchLabel, view.batchLabel);
      setText(out.batchGrams, view.batchText);
      setText(out.perBottleLabel, view.perBottleLabel);
      setText(out.perBottleGrams, view.perBottleText);
      setText(out.residual, view.residualText);
    }
  };

  // Last resort for a bug: hide the figures and notes rather than leave old
  // ones on screen, then let the error through so the browser logs it.
  const render = () => {
    try {
      paint(computeView(readValues(), { touched, lang }));
    } catch (err) {
      setHidden(out.values, true);
      setHidden(out.noteHighPressure, true);
      setHidden(out.noteNoSugar, true);
      setText(out.prompt, t.promptCheck);
      setHidden(out.prompt, false);
      throw err;
    }
  };

  for (const key of TEXT_FIELDS) {
    const markAndRender = () => {
      touched.add(key);
      render();
    };
    field(key).addEventListener('input', markAndRender);
    field(key).addEventListener('blur', markAndRender);
  }

  bottleSelect.addEventListener('change', render);

  // Picking a style fills in its usual target. Custom leaves the target as is.
  styleSelect.addEventListener('change', () => {
    const target = targetForStyle(styleSelect.value);
    if (target !== null) {
      field('targetVols').value = target;
      touched.add('targetVols');
    }
    render();
  });

  for (const radio of sugarRadios) radio.addEventListener('change', render);

  render();
}

function addOption(select, value, text) {
  const option = select.ownerDocument.createElement('option');
  option.value = value;
  option.textContent = text;
  select.append(option);
}

// Only touch the DOM when something changes, so screen readers don't
// re-announce the results on every key press.
function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function setHidden(el, hidden) {
  if (el.hidden !== hidden) el.hidden = hidden;
}

function setAttr(el, name, value) {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initPage(document), { once: true });
  } else {
    initPage(document);
  }
}
