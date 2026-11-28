// Tests for the home page copy in COPY.md and its Thai draft (T16).
// Until the home page is built (T5), the Thai copy lives only in COPY.md and
// THAI.md, so the THAI.md checks in i18n.test.js don't reach it yet. These
// keep the two files in step: every Thai piece next to its exact English.
// Node's built-in runner only.
//
// COPY.md conventions these rely on: English sections "## 1." to "## 6."
// before "## Questions for you"; Thai sections "### 1." to "### 6." after
// "## Thai version"; lines in italics are notes, apart from
// '*Page heading:* **X**' and '*Link text: "X"...*'; '**Name.** text' is a
// bold venture name followed by its text.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const COPY_MD = read('../COPY.md');
const THAI_MD = read('../THAI.md');
const TH_HOME = read('../docs/th/index.html');

/** One piece of page text: { kind: 'heading' | 'name' | 'text' | 'link', text } */
function piecesOf(lines) {
  const out = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('- ')) continue; // blank or a link list item
    let m;
    if ((m = line.match(/^\*Page heading:\* \*\*(.+)\*\*$/))) out.push({ kind: 'heading', text: m[1] });
    else if ((m = line.match(/^\*Link text: "([^"]+)"/))) out.push({ kind: 'link', text: m[1] });
    else if (/^\*[^*]/.test(line)) continue; // an italic note
    else if ((m = line.match(/^\*\*([^*]+)\*\* (.+)$/))) {
      out.push({ kind: 'name', text: m[1] }, { kind: 'text', text: m[2].replace(/\*\*/g, '') });
    } else out.push({ kind: 'text', text: line.replace(/\*\*/g, '') });
  }
  return out;
}

/** Numbered sections between start and end, split on headings like "## 1." */
function sections(start, end, level) {
  const from = COPY_MD.indexOf(start);
  assert.ok(from >= 0, `COPY.md has a "${start}" heading`);
  const to = end ? COPY_MD.indexOf(end, from) : COPY_MD.length;
  assert.ok(to > from, `COPY.md has a "${end}" heading after "${start}"`);
  const out = [];
  for (const line of COPY_MD.slice(from, to).split('\n')) {
    const m = line.match(new RegExp(`^${level} (\\d+)\\. `));
    if (m) out.push({ num: Number(m[1]), lines: [] });
    else if (out.length) out.at(-1).lines.push(line);
  }
  return out.map((s) => ({ num: s.num, pieces: piecesOf(s.lines) }));
}

const EN = sections('## 1. Hero', '## Questions for you', '##');
const TH = sections('## Thai version', null, '###');
const flat = (secs) => secs.flatMap((s) => s.pieces);

/** Rows of the "Home page copy" table in THAI.md, as [English, Thai]. */
function thaiMdCopyRows() {
  const from = THAI_MD.indexOf('## Home page copy');
  assert.ok(from >= 0, 'THAI.md has a "## Home page copy" section');
  const next = THAI_MD.indexOf('\n## ', from + 1);
  return THAI_MD.slice(from, next < 0 ? undefined : next)
    .split('\n')
    .filter((l) => l.startsWith('| ') && !l.startsWith('| English') && !/^\|-/.test(l))
    .map((l) => l.replace(/^\| | \|$/g, '').split(' | '));
}

describe('home page copy: Thai draft in COPY.md and THAI.md (T16)', () => {
  test('the Thai copy has the same sections, and the same kinds of piece in each, as the English', () => {
    assert.ok(EN.length > 0, 'found the English sections');
    const shape = (secs) => secs.map((s) => `${s.num}: ${s.pieces.map((p) => p.kind).join(', ')}`);
    assert.deepEqual(shape(TH), shape(EN));
  });

  test('THAI.md lists every piece of Thai copy, in page order, next to its exact English from COPY.md', () => {
    const expected = flat(EN).map((p, i) => [p.text, flat(TH)[i]?.text]);
    assert.deepEqual(thaiMdCopyRows(), expected);
  });

  test('Floc Nation and flocnationbrew stay in Latin letters in the Thai copy', () => {
    const en = flat(EN);
    flat(TH).forEach((p, i) => {
      for (const name of ['Floc Nation', 'flocnationbrew']) {
        if (en[i]?.text.includes(name)) assert.ok(p.text.includes(name), `"${p.text}" keeps ${name}`);
      }
    });
  });

  test('the copy has no words about selling, prices or ordering, in English or Thai', () => {
    const english = /\b(buy|buying|sell|selling|sold|sale|sales|price|prices|priced|order|orders|ordering|pre-?order|shop|store|baht|thb|delivery|shipping)\b|฿/i;
    const thai = /ซื้อ|ขาย|จำหน่าย|ราคา|สั่ง|จอง|บาท|ร้าน|ค่าส่ง|ส่งฟรี|โปรโมชั่น/;
    for (const p of flat(EN)) assert.doesNotMatch(p.text, english, p.text);
    for (const p of flat(TH)) assert.doesNotMatch(p.text, thai, p.text);
  });

  test('the Thai calculator heading is the Thai nav label for the calculator', () => {
    const navLabel = TH_HOME.match(/<a href="calculator\.html">([^<]+)<\/a>/)?.[1];
    assert.ok(navLabel, 'docs/th/index.html links calculator.html from its nav');
    const heading = TH.find((s) => s.num === 4)?.pieces.find((p) => p.kind === 'heading')?.text;
    assert.equal(heading, navLabel);
  });
});
