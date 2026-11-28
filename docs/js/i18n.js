/**
 * Words the calculator shows from code, in English (en) and Thai (th).
 *
 * Plain data and two small helpers: no DOM code and no imports. The page's
 * own HTML holds its fixed text (labels, hints, headings); this file holds
 * the text calculator.js writes while the brewer types. The style guides
 * live in styles.js.
 *
 * Templates use {name} slots, filled by fill(). Thai sentences don't end
 * with a full stop, so the Thai templates have none.
 *
 * Every Thai string here is listed next to its English one in THAI.md, for a
 * native speaker to check. Change both together.
 */

export const LANGS = Object.freeze(['en', 'th']);

export const TEXT = Object.freeze({
  en: Object.freeze({
    notes: Object.freeze({
      highPressure: 'Use bottles rated for high pressure.',
      noSugarNeeded: 'No sugar needed: the beer already holds this much CO2.',
    }),
    sugarNames: Object.freeze({ dextrose: 'Dextrose', table: 'Table sugar' }),
    sugarFallback: 'Sugar',
    fieldNames: Object.freeze({
      litres: 'beer volume',
      customBottleMl: 'bottle size',
      targetVols: 'target CO2',
      tempC: 'highest temperature',
    }),
    promptFill: 'Fill in the {fields} to see how much sugar to add.',
    promptFix: 'Fix the marked fields to see the result.',
    promptCheck: "The calculator can't work with these numbers. Check each field.",
    listSeparator: ', ',
    listLast: ' and ',
    batchLabel: '{sugar} for the whole batch',
    perBottleLabel: '{sugar} per {ml} ml bottle',
    residual: 'The beer already holds about {vols} volumes of CO2.',
    customTargetHint: 'Type the CO2 level you want, in volumes.',
    targetHint: '{style}: usually {range}.',
    targetOutside: 'Your target is outside this range.',
    range: '{min} to {max} volumes',
    guideRangeLabel: 'Usual range',
    guideRangeLine: '{range}.',
    typicalLabel: 'Typical beers',
    typicalText: 'Most styles sit between {min} and {max} volumes. {high} goes up to {highMax}.',
    bottleOption: '{ml} ml',
    customBottleOption: 'Custom size',
    // English style names come from STYLE_PRESETS in priming.js.
    styleNames: null,
    // English error messages come from priming.js as they are.
    errors: null,
    errorFallback: null,
  }),

  th: Object.freeze({
    notes: Object.freeze({
      highPressure: 'ใช้ขวดที่ทนแรงดันสูง',
      noSugarNeeded: 'ไม่ต้องใส่น้ำตาล เบียร์มี CO2 ถึงระดับนี้อยู่แล้ว',
    }),
    sugarNames: Object.freeze({ dextrose: 'เดกซ์โทรส', table: 'น้ำตาลทราย' }),
    sugarFallback: 'น้ำตาล',
    fieldNames: Object.freeze({
      litres: 'ปริมาณเบียร์',
      customBottleMl: 'ขนาดขวด',
      targetVols: 'CO2 เป้าหมาย',
      tempC: 'อุณหภูมิสูงสุด',
    }),
    promptFill: 'กรอก{fields} เพื่อดูว่าต้องใส่น้ำตาลเท่าไร',
    promptFix: 'แก้ช่องที่ทำเครื่องหมายไว้ เพื่อดูผลลัพธ์',
    promptCheck: 'เครื่องคำนวณใช้ตัวเลขชุดนี้ไม่ได้ ลองตรวจดูแต่ละช่องอีกครั้ง',
    listSeparator: ' ',
    listLast: ' และ',
    batchLabel: '{sugar}สำหรับทั้งแบตช์',
    perBottleLabel: '{sugar}ต่อขวด {ml} มล.',
    residual: 'เบียร์มี CO2 อยู่แล้วประมาณ {vols} วอลุ่ม',
    customTargetHint: 'พิมพ์ระดับ CO2 ที่ต้องการ เป็นวอลุ่ม',
    targetHint: '{style}: ปกติ {range}',
    targetOutside: 'ค่าเป้าหมายของคุณอยู่นอกช่วงนี้',
    range: '{min} ถึง {max} วอลุ่ม',
    guideRangeLabel: 'ช่วงที่นิยม',
    guideRangeLine: '{range}',
    typicalLabel: 'เบียร์ทั่วไป',
    typicalText: 'เบียร์ส่วนใหญ่อยู่ระหว่าง {min} ถึง {max} วอลุ่ม {high}ขึ้นไปได้ถึง {highMax}',
    bottleOption: '{ml} มล.',
    customBottleOption: 'กำหนดขนาดเอง',
    styleNames: Object.freeze({
      'british-ales': 'เอลสไตล์อังกฤษ',
      'stout-porter': 'สเตาต์และพอร์เตอร์',
      'american-ale-ipa': 'เอลอเมริกันและ IPA',
      'lager-pilsner': 'ลาเกอร์และพิลส์เนอร์',
      wheat: 'เบียร์ข้าวสาลี',
      custom: 'กำหนดเอง',
    }),
    // Keyed "<field>.<code>", from PrimingInputError (priming.js).
    // {min} and {max} are the field's limits from priming.js.
    errors: Object.freeze({
      'litres.empty': 'ใส่ปริมาณเบียร์เป็นลิตร',
      'litres.not-number': 'ปริมาณเบียร์ต้องเป็นตัวเลข',
      'litres.not-positive': 'ปริมาณเบียร์ต้องมากกว่า 0 ลิตร',
      'litres.over-limit': 'ปริมาณเบียร์ต้องไม่เกิน {max} ลิตร',
      'tempC.empty': 'ใส่อุณหภูมิสูงสุดที่เบียร์เคยขึ้นถึง',
      'tempC.not-number': 'อุณหภูมิต้องเป็นตัวเลข',
      'tempC.out-of-range': 'อุณหภูมิต้องอยู่ระหว่าง {min} ถึง {max} °C',
      'targetVols.empty': 'ใส่ระดับ CO2 ที่ต้องการ เป็นวอลุ่ม',
      'targetVols.not-number': 'CO2 เป้าหมายต้องเป็นตัวเลข',
      'targetVols.not-positive': 'CO2 เป้าหมายต้องมากกว่า 0 วอลุ่ม',
      'targetVols.over-limit': 'CO2 เป้าหมายต้องไม่เกิน {max} วอลุ่ม',
      'bottleMl.empty': 'ใส่ขนาดขวดเป็นมิลลิลิตร',
      'bottleMl.not-number': 'ขนาดขวดต้องเป็นตัวเลข',
      'bottleMl.not-positive': 'ขนาดขวดต้องมากกว่า 0 มล.',
      'bottleMl.over-limit': 'ขนาดขวดต้องไม่เกิน {max} มล.',
      'bottleMl.too-big': 'ขนาดขวดต้องไม่ใหญ่กว่าปริมาณเบียร์ทั้งหมด',
      'sugar.unknown': 'เลือกเดกซ์โทรสหรือน้ำตาลทราย',
    }),
    errorFallback: 'ค่านี้ใช้ไม่ได้ ลองตรวจดูอีกครั้ง',
  }),
});

/**
 * The language of a page, from the lang attribute on its <html> element.
 * @param {Document} [doc]
 * @returns {'en'|'th'} 'th' for lang="th" or "th-…", otherwise 'en'.
 */
export function langOf(doc) {
  const lang = doc?.documentElement?.getAttribute?.('lang') ?? '';
  return /^th(-|$)/i.test(lang) ? 'th' : 'en';
}

/**
 * The words for a language. Anything that isn't 'th' gets English.
 * @param {string} lang
 */
export function textFor(lang) {
  return lang === 'th' ? TEXT.th : TEXT.en;
}

/**
 * Fills the {name} slots of a template. Slots without a value stay as they are.
 * @param {string} template
 * @param {Object<string, string|number>} [values]
 * @returns {string}
 */
export function fill(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (slot, name) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : slot,
  );
}
