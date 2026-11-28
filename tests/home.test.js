// Tests for the home page (T5): docs/index.html and docs/th/index.html show
// the approved copy from COPY.md in page order, the Thai matches COPY.md's
// Thai section and THAI.md, the links go to the right places, and the home
// page's footer arrangement doesn't leak into the calculator pages.
// Node's built-in runner only; no packages.
//
// COPY.md conventions (as in copy.test.js): English sections "## 1." to
// "## 6." before "## Questions for you"; Thai sections "### 1." to "### 6."
// after "## Thai version"; italic lines are notes, apart from
// '*Page heading:* **X**' and '*Link text: "X"...*'; '**Name.** text' is a
// bold venture name followed by its text; '- Platform: https://...' lines
// in English section 6 are the account links.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const COPY_MD = read('COPY.md');
const THAI_MD = read('THAI.md');
const HOME = { en: read('docs/index.html'), th: read('docs/th/index.html') };
const HOME_FILE = { en: 'index.html', th: 'th/index.html' };
const CALC = { en: read('docs/calculator.html'), th: read('docs/th/calculator.html') };
const TAGLINE = { en: 'Brewed and built in Bangkok', th: 'ต้มเบียร์และสร้างเครื่องมือเองในกรุงเทพฯ' };
const CALC_FOOTER_LABEL = { en: 'Find us as flocnationbrew on', th: 'ติดตามเราในชื่อ flocnationbrew ได้ที่' };
const FOOTER_ORDER = ['Instagram', 'YouTube', 'TikTok', 'Facebook'];
const SOCIAL_HOSTS = {
  'www.instagram.com': 'Instagram',
  'www.youtube.com': 'YouTube',
  'www.tiktok.com': 'TikTok',
  'www.facebook.com': 'Facebook',
};

// ---------- small HTML helpers (the pages are hand-written) ----------

const section = (html, tag) => html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] ?? '';
const plain = (fragment) => fragment.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1] ?? null;
const anchors = (html) =>
  [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({ tag: `<a${m[1]}>`, href: attr(`<a${m[1]}>`, 'href'), text: plain(m[2]) }));
const isExternal = (url) => /^(https?:)?\/\//i.test(url ?? '');
const resolveFrom = (pageFile, href) => {
  let p = join(DOCS, dirname(pageFile), href.split(/[?#]/)[0]);
  if (href.endsWith('/') || href === '.' || href === './') p = join(p, 'index.html');
  return p;
};

/**
 * The page's own copy in order: h1, h2, h3 and p in <main>, then the
 * footer's heading and label (the tagline is checked on its own).
 * Kinds line up with COPY.md: h1 'hero', h2 'heading', h3 'name',
 * p 'text', and a paragraph holding only the button 'link'.
 */
function pagePieces(html) {
  const out = [];
  for (const part of [section(html, 'main'), section(html, 'footer')]) {
    for (const m of part.matchAll(/<(h1|h2|h3|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      const [, tag, attrs, inner] = m;
      if (/\bsite-footer__tagline\b/.test(attrs)) continue;
      const button = inner.trim().match(/^<a\b[^>]*class="button"[^>]*>([\s\S]*?)<\/a>$/i);
      const kind = button ? 'link' : { h1: 'hero', h2: 'heading', h3: 'name', p: 'text' }[tag.toLowerCase()];
      out.push({ kind, text: plain(button ? button[1] : inner) });
    }
  }
  return out;
}

// ---------- COPY.md ----------

function piecesOf(lines, num) {
  const out = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('- ')) continue;
    let m;
    if ((m = line.match(/^\*Page heading:\* \*\*(.+)\*\*$/))) out.push({ kind: 'heading', text: m[1] });
    else if ((m = line.match(/^\*Link text: "([^"]+)"/))) out.push({ kind: 'link', text: m[1] });
    else if (/^\*[^*]/.test(line)) continue;
    else if ((m = line.match(/^\*\*([^*]+)\*\* (.+)$/))) out.push({ kind: 'name', text: m[1] }, { kind: 'text', text: m[2].replace(/\*\*/g, '') });
    else out.push({ kind: num === 1 ? 'hero' : 'text', text: line.replace(/\*\*/g, '') });
  }
  return out;
}

function copySections(start, end, level) {
  const from = COPY_MD.indexOf(start);
  assert.ok(from >= 0, `COPY.md has "${start}"`);
  const to = end ? COPY_MD.indexOf(end, from) : COPY_MD.length;
  const secs = [];
  for (const line of COPY_MD.slice(from, to).split('\n')) {
    const m = line.match(new RegExp(`^${level} (\\d+)\\. `));
    if (m) secs.push({ num: Number(m[1]), lines: [] });
    else if (secs.length) secs.at(-1).lines.push(line);
  }
  return secs;
}

const EN_SECS = copySections('## 1. Hero', '## Questions for you', '##');
const COPY_PIECES = {
  en: EN_SECS.flatMap((s) => piecesOf(s.lines, s.num)),
  th: copySections('## Thai version', null, '###').flatMap((s) => piecesOf(s.lines, s.num)),
};
const COPY_LINKS = (EN_SECS.find((s) => s.num === 6)?.lines ?? [])
  .map((l) => l.trim().match(/^- (\w+): (https:\/\/\S+)$/))
  .filter(Boolean)
  .map(([, name, url]) => ({ name, url }));

/** Rows of a THAI.md table under the given heading, as [English, Thai]. */
function thaiMdRows(heading) {
  const from = THAI_MD.indexOf(heading);
  assert.ok(from >= 0, `THAI.md has "${heading}"`);
  const next = THAI_MD.indexOf('\n## ', from + 1);
  return THAI_MD.slice(from, next < 0 ? undefined : next)
    .split('\n')
    .filter((l) => l.startsWith('| ') && !l.startsWith('| English') && !/^\|-/.test(l))
    .map((l) => l.replace(/^\| | \|$/g, '').split(' | '));
}

// ==========================================================================

describe('home page copy (T5)', () => {
  test('the English home page shows the COPY.md text in page order, from the hero to "Follow along"', () => {
    assert.ok(COPY_PIECES.en.length > 10, 'found the English copy in COPY.md');
    assert.deepEqual(pagePieces(HOME.en), COPY_PIECES.en);
  });

  test("the Thai home page shows COPY.md's Thai text in page order, from the hero to ติดตามเรา", () => {
    assert.ok(COPY_PIECES.th.length > 10, 'found the Thai copy in COPY.md');
    assert.deepEqual(pagePieces(HOME.th), COPY_PIECES.th);
  });

  test("each piece of Thai home page text sits next to the English piece in the same place in THAI.md's home page copy table", () => {
    const en = pagePieces(HOME.en);
    const th = pagePieces(HOME.th);
    assert.deepEqual(en.map((p, i) => [p.text, th[i]?.text]), thaiMdRows('## Home page copy'));
  });

  test("the meta description is About Floc Nation's first sentence, in English and in Thai", () => {
    const desc = (html) => html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    const about = (html) => pagePieces(html).find((p, i, all) => all[i - 1]?.kind === 'heading' && p.kind === 'text')?.text ?? '';
    const enFirst = about(HOME.en).match(/^.+?\.(?=\s|$)/)?.[0];
    assert.equal(desc(HOME.en), enFirst);
    assert.ok(about(HOME.th).startsWith(`${desc(HOME.th)} `), `Thai About starts with the Thai description: ${desc(HOME.th)}`);
    assert.ok(THAI_MD.includes(`| ${desc(HOME.en)} | ${desc(HOME.th)} |`), 'THAI.md pairs the two descriptions');
  });

  test('THAI.md\'s home page table lists only text that is still on the home pages', () => {
    const squash = (s) => s.replace(/\s+/g, ' ');
    for (const [en, th] of thaiMdRows('## Home page (`docs/th/index.html`)')) {
      assert.ok(squash(HOME.en).includes(en), `docs/index.html no longer has "${en}"`);
      assert.ok(squash(HOME.th).includes(th), `docs/th/index.html no longer has "${th}"`);
    }
  });
});

describe('home page links (T5)', () => {
  for (const lang of ['en', 'th']) {
    test(`${HOME_FILE[lang]}: the calculator button opens the calculator in the same language`, () => {
      const buttons = anchors(section(HOME[lang], 'main')).filter((a) => /\bbutton\b/.test(attr(a.tag, 'class') ?? ''));
      assert.equal(buttons.length, 1, 'one button link in main');
      assert.equal(resolveFrom(HOME_FILE[lang], buttons[0].href), join(DOCS, lang === 'en' ? '' : 'th', 'calculator.html'));
    });

    test(`${HOME_FILE[lang]}: the footer links to the COPY.md accounts, in the order Instagram, YouTube, TikTok, Facebook`, () => {
      assert.deepEqual(COPY_LINKS.map((l) => l.name), FOOTER_ORDER, 'COPY.md lists the accounts in footer order');
      const got = anchors(section(HOME[lang], 'footer')).filter((a) => isExternal(a.href)).map((a) => ({ name: a.text, url: a.href }));
      assert.deepEqual(got, COPY_LINKS);
    });

    test(`${HOME_FILE[lang]}: the account links show once, in the footer, and not in the main content`, () => {
      assert.deepEqual(anchors(section(HOME[lang], 'main')).filter((a) => isExternal(a.href)).map((a) => a.href), []);
    });

    test(`${HOME_FILE[lang]}: the footer closes with the tagline, after the account links`, () => {
      const footer = section(HOME[lang], 'footer');
      const m = footer.match(/<\/nav>\s*<p class="site-footer__tagline">([^<]*)<\/p>\s*<\/div>\s*$/);
      assert.ok(m, 'the tagline paragraph comes straight after the links and ends the footer');
      assert.equal(m[1], TAGLINE[lang]);
      assert.equal((footer.match(/site-footer__tagline/g) ?? []).length, 1, 'the tagline shows once');
    });

    test(`${HOME_FILE[lang]}: headings go h1, h2, h3 without skipping a level`, () => {
      const levels = [...HOME[lang].matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
      assert.equal(levels[0], 1, 'starts with the h1');
      levels.forEach((l, i) => i && assert.ok(l <= levels[i - 1] + 1, `h${levels[i - 1]} is followed by h${l}`));
    });
  }

  test('every page lists its footer accounts in the order Instagram, YouTube, TikTok, Facebook', () => {
    for (const [file, html] of [['index.html', HOME.en], ['th/index.html', HOME.th], ['calculator.html', CALC.en], ['th/calculator.html', CALC.th]]) {
      const got = anchors(section(html, 'footer')).filter((a) => isExternal(a.href)).map((a) => [SOCIAL_HOSTS[new URL(a.href).hostname], a.text]);
      assert.deepEqual(got, FOOTER_ORDER.map((n) => [n, n]), file);
    }
  });
});

describe('calculator pages keep their own footer and look (T5)', () => {
  for (const lang of ['en', 'th']) {
    const file = lang === 'en' ? 'calculator.html' : 'th/calculator.html';

    test(`${file}: the footer is still the short one: tagline, then "${CALC_FOOTER_LABEL[lang]}", then the links, with no heading`, () => {
      const footer = section(CALC[lang], 'footer');
      assert.doesNotMatch(footer, /<h[1-6]\b/i, 'no heading in the footer');
      const order = [...footer.matchAll(/<(p|nav)\b[^>]*>/g)].map((m) => attr(m[0], 'class') ?? m[1]);
      assert.deepEqual(order, ['site-footer__tagline', 'site-footer__label', 'nav']);
      assert.equal(plain(footer.match(/<p class="site-footer__tagline">([\s\S]*?)<\/p>/)?.[1] ?? ''), TAGLINE[lang]);
      const label = footer.match(/<p class="site-footer__label"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
      assert.equal(label, CALC_FOOTER_LABEL[lang], 'label text, with no bold inside');
    });

    test(`${file}: uses none of the home page's own classes (hero, section, ventures, site-footer__heading)`, () => {
      const classes = [...CALC[lang].matchAll(/\sclass="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/));
      for (const c of ['hero', 'section', 'ventures', 'site-footer__heading']) assert.ok(!classes.includes(c), `class "${c}" is used`);
    });
  }
});
