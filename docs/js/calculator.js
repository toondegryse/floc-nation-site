/**
 * Page wiring for the priming-sugar calculator (docs/calculator.html).
 *
 * Two parts:
 *   1. computeView(rawValues): pure, no DOM. It takes the raw field values
 *      and returns exactly what the page shows. Node can import it for tests.
 *   2. initPage(document): the DOM code. It runs only in a browser.
 *
 * The maths and the input checks live in priming.js, and the style guide
 * text in styles.js. This file reads the fields, rounds the numbers for
 * display and decides what to show.
 */

import {
  calculatePriming,
  PrimingInputError,
  STYLE_PRESETS,
  BOTTLE_SIZES_ML,
  DEFAULT_BOTTLE_ML,
  TEMP_RANGE_C,
} from './priming.js';
import { guideForStyle } from './styles.js';

// ---------------------------------------------------------------------------
// Page constants
// ---------------------------------------------------------------------------

/** Value of the "Custom size" option in the bottle size list. */
export const CUSTOM_BOTTLE = 'custom';

/** Beer style picked when the page opens. */
export const DEFAULT_STYLE_ID = 'american-ale-ipa';

/** Safety notes, worded exactly as in PROJECT.md. */
export const NOTES = Object.freeze({
  highPressure: 'Use bottles rated for high pressure.',
  noSugarNeeded: 'No sugar needed: the beer already holds this much CO2.',
});

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

/** Display names for the sugar types (same keys as SUGAR_FACTORS). */
const SUGAR_NAMES = Object.freeze({ dextrose: 'Dextrose', table: 'Table sugar' });

/** Fields the brewer types into, in page order. */
const TEXT_FIELDS = Object.freeze(['litres', 'customBottleMl', 'targetVols', 'tempC']);

/** How the results area names an empty text field. */
const FIELD_NAMES = Object.freeze({
  litres: 'beer volume',
  customBottleMl: 'bottle size',
  targetVols: 'target CO2',
  tempC: 'highest temperature',
});

/** Fields that can carry an error message on the page. */
const ERROR_FIELDS = Object.freeze(['litres', 'bottleSize', 'customBottleMl', 'targetVols', 'tempC', 'sugar']);

const PROMPT_FIX = 'Fix the marked fields to see the result.';
const CUSTOM_TARGET_HINT = 'Type the CO2 level you want, in volumes.';

/**
 * Stand-in values used while checking the other fields, so each bad field
 * gets its own message. The batch is huge so no bottle can be bigger.
 */
const STAND_INS = Object.freeze({
  litres: 1e6,
  tempC: (TEMP_RANGE_C.min + TEMP_RANGE_C.max) / 2,
  targetVols: 2.4,
  bottleMl: DEFAULT_BOTTLE_ML,
  sugar: 'dextrose',
});

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

/** Label of the guide's first line for a style with a range. */
export const GUIDE_RANGE_LABEL = 'Usual range';

/**
 * The lines of the style guide shown under the style menu.
 *
 * A style with a range leads with "Usual range: <min> to <max> volumes.",
 * built from STYLE_PRESETS, followed on the same line by how it should feel
 * in the glass (styles.js). Its other lines follow. Custom has no range, so
 * it shows its own lines only.
 *
 * @param {string} styleId An id from STYLE_PRESETS.
 * @returns {{ points: ReadonlyArray<{ label: string, text: string }> }|null}
 *   One { label, text } per line, shown as "label: text", or null for an
 *   unknown id.
 */
export function styleGuideView(styleId) {
  const guide = guideForStyle(styleId);
  const preset = findStyle(styleId);
  if (!guide || !preset) return null;
  const lines = hasRange(preset)
    ? [{ label: GUIDE_RANGE_LABEL, text: [`${rangeText(preset)}.`, guide.feel].filter(Boolean).join(' ') }]
    : [];
  return { points: [...lines, ...guide.points] };
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
 *   without the unit. Both are '' when there is no result.
 *   notes holds the safety notes to show, word for word.
 *   errors maps a field (litres, bottleSize, customBottleMl, targetVols,
 *   tempC, sugar) to the message shown next to it.
 *   prompt is the line shown in the results area when there is no result.
 *   styleGuide is styleGuideView() for the picked style: the lines shown
 *   under the style menu, or null (no guide shown) for an unknown style id.
 *   result is what calculatePriming() returned, or null.
 */
export function computeView(raw = {}, options = {}) {
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
  for (const [field, message] of Object.entries(fieldErrors)) {
    const key = field === 'bottleMl' ? (showCustomBottle ? 'customBottleMl' : 'bottleSize') : field;
    if (TEXT_FIELDS.includes(key) && isEmpty(values[key]) && !isTouched(key)) {
      waiting.push(key);
    } else {
      errors[key] = message;
    }
  }

  let prompt = '';
  if (!result) {
    const missing = TEXT_FIELDS.filter((key) => waiting.includes(key));
    prompt =
      Object.keys(errors).length === 0 && missing.length > 0
        ? `Fill in the ${joinList(missing.map((key) => FIELD_NAMES[key]))} to see how much sugar to add.`
        : PROMPT_FIX;
  }

  const sugarName = SUGAR_NAMES[values.sugar] ?? 'Sugar';
  const notes = [];
  if (result?.highPressure) notes.push(NOTES.highPressure);
  if (result?.noSugarNeeded) notes.push(NOTES.noSugarNeeded);

  return {
    hasResult: result !== null,
    batchLabel: `${sugarName} for the whole batch`,
    batchText: result ? fixed(result.batchGrams, 1) : '',
    perBottleLabel: result ? `${sugarName} per ${String(Number(bottleMl))} ml bottle` : '',
    perBottleText: result ? fixed(result.perBottleGrams, 2) : '',
    residualText: result
      ? `The beer already holds about ${fixed(result.residual, 2)} volumes of CO2.`
      : '',
    notes,
    errors,
    prompt,
    targetHint: targetHint(values.style, values.targetVols, !('targetVols' in fieldErrors)),
    styleGuide: styleGuideView(values.style),
    showCustomBottle,
    result,
  };
}

/**
 * Runs calculatePriming() and collects one message per bad field. The module
 * stops at the first bad field, so each bad field is swapped for a stand-in
 * and the call is tried again.
 */
function runCalculator(inputs) {
  const trial = { ...inputs };
  const fieldErrors = {};
  for (let i = 0; i <= Object.keys(STAND_INS).length; i += 1) {
    try {
      const result = calculatePriming(trial);
      return { result: Object.keys(fieldErrors).length === 0 ? result : null, fieldErrors };
    } catch (err) {
      if (!(err instanceof PrimingInputError) || !Object.hasOwn(STAND_INS, err.field)) throw err;
      // A stand-in clashed with another field (a bottle bigger than a tiny
      // batch). The field already has its own message, so stop here.
      if (Object.hasOwn(fieldErrors, err.field)) break;
      fieldErrors[err.field] = err.message;
      trial[err.field] = STAND_INS[err.field];
    }
  }
  return { result: null, fieldErrors };
}

function targetHint(styleId, targetRaw, targetIsValid) {
  const preset = findStyle(styleId);
  if (!preset || !hasRange(preset)) return CUSTOM_TARGET_HINT;
  const range = `${preset.name}: usually ${rangeText(preset)}.`;
  const target = Number(targetRaw);
  const outside = targetIsValid && !isEmpty(targetRaw) && (target < preset.min || target > preset.max);
  return outside ? `${range} Your target is outside this range.` : range;
}

function findStyle(styleId) {
  return STYLE_PRESETS.find((preset) => preset.id === styleId) ?? null;
}

function hasRange(preset) {
  return preset.min !== null && preset.max !== null;
}

/** A preset's usual range, e.g. '3.3 to 4.5 volumes'. */
function rangeText(preset) {
  return `${formatVols(preset.min)} to ${formatVols(preset.max)} volumes`;
}

function formatVols(vols) {
  return vols.toFixed(1);
}

/** Rounds for display. Adding 0 turns -0 into 0. */
function fixed(n, digits) {
  return (n + 0).toFixed(digits);
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

function joinList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
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
  for (const ml of BOTTLE_SIZES_ML) addOption(bottleSelect, String(ml), `${ml} ml`);
  addOption(bottleSelect, CUSTOM_BOTTLE, 'Custom size');
  const styleSelect = field('style');
  for (const preset of STYLE_PRESETS) addOption(styleSelect, preset.id, preset.name);

  bottleSelect.value = DEFAULT_VALUES.bottleSize;
  styleSelect.value = DEFAULT_VALUES.style;
  field('targetVols').value = DEFAULT_VALUES.targetVols;
  setText(out.noteHighPressure, NOTES.highPressure);
  setText(out.noteNoSugar, NOTES.noSugarNeeded);

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
    setHidden(out.noteHighPressure, !view.notes.includes(NOTES.highPressure));
    setHidden(out.noteNoSugar, !view.notes.includes(NOTES.noSugarNeeded));
    setHidden(out.values, !view.hasResult);
    if (view.hasResult) {
      setText(out.batchLabel, view.batchLabel);
      setText(out.batchGrams, view.batchText);
      setText(out.perBottleLabel, view.perBottleLabel);
      setText(out.perBottleGrams, view.perBottleText);
      setText(out.residual, view.residualText);
    }
  };

  const render = () => paint(computeView(readValues(), { touched }));

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
