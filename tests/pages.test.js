// Static checks for the pages in docs/ and the shared stylesheet.
// Node's built-in test runner only; no packages. Every *.html page in docs/
// gets the per-page checks, so new pages (e.g. calculator.html) are covered
// as soon as they are added.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const CSS_PATH = join(DOCS, 'css', 'site.css');

const pages = readdirSync(DOCS).filter((f) => f.endsWith('.html')).sort();
const read = (p) => readFileSync(p, 'utf8');
const css = read(CSS_PATH);
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

// Badge palette from CLAUDE.md (Brand). Token name in site.css -> hex.
const BRAND = {
  navy: '#022C54',
  teal: '#06929E',
  'teal-deep': '#06727B',
  sky: '#2BACC7',
  white: '#FDFDFD',
  pale: '#EEF4F8',
  line: '#D5DEE6',
  muted: '#4F5B6B',
};

// The retired bottle-cap brand (navy, steel, copper, paper, paper border).
// Muted #4F5B6B carried over into the badge palette, so it is not here.
const RETIRED_HEXES = ['#13233A', '#2F5D8A', '#B8741F', '#F3EEE5', '#D9D1C3'];

// The three-hops badge (CLAUDE.md): served copy and source copy.
const BADGE_SRC = 'assets/floc-nation-badge.svg';
const BADGE_PATH = join(DOCS, BADGE_SRC);
const BADGE_SOURCE_PATH = join(ROOT, 'brand', 'logo', 'floc-nation-badge.svg');

// The four flocnationbrew accounts (CLAUDE.md). Host -> platform name.
const SOCIAL_HOSTS = {
  'www.instagram.com': 'Instagram',
  'www.youtube.com': 'YouTube',
  'www.facebook.com': 'Facebook',
  'www.tiktok.com': 'TikTok',
};

const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com';
const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com';

// ---------- small HTML helpers (regex based; the pages are hand-written) ----------

const tags = (html) => html.match(/<[a-zA-Z][^>]*>/g) ?? [];
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4]) : null;
};
const metaByName = (html, name) =>
  tags(html).filter((t) => /^<meta\b/i.test(t) && (attr(t, 'name') ?? '').toLowerCase() === name);
const cspOf = (html) => {
  const t = tags(html).find(
    (x) => /^<meta\b/i.test(x) && (attr(x, 'http-equiv') ?? '').toLowerCase() === 'content-security-policy',
  );
  if (!t) return null;
  const directives = {};
  for (const part of attr(t, 'content').split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) directives[name.toLowerCase()] = sources;
  }
  return directives;
};
const section = (html, tag) => {
  const m = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1] : null;
};
const text = (fragment) => fragment.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const links = (html) =>
  tags(html)
    .filter((t) => /^<a\b/i.test(t))
    .map((t) => ({ tag: t, href: attr(t, 'href'), target: attr(t, 'target'), rel: attr(t, 'rel') }));
const isExternal = (url) => /^(https?:)?\/\//i.test(url ?? '');

// ---------- WCAG contrast ----------

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const token = (name) => {
  const m = cssNoComments.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  assert.ok(m, `site.css defines --${name}`);
  return m[1];
};

// ---------- small CSS rule parser (enough for the hand-written site.css) ----------

// Returns [{ media, selectors: [..], decls: { prop: value } }] for every style
// rule, including rules inside @media blocks. Statements such as @import are skipped.
const parseRules = (source, media = '') => {
  const rules = [];
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf('{', i);
    if (open === -1) break;
    // Drop statements like @import ...; that come before this block.
    let prelude = source.slice(i, open);
    prelude = prelude.slice(prelude.lastIndexOf(';') + 1).trim();
    let depth = 1;
    let j = open + 1;
    while (j < source.length && depth > 0) {
      if (source[j] === '{') depth += 1;
      else if (source[j] === '}') depth -= 1;
      j += 1;
    }
    const body = source.slice(open + 1, j - 1);
    if (/^@media\b/i.test(prelude)) {
      rules.push(...parseRules(body, prelude));
    } else if (!prelude.startsWith('@')) {
      const decls = {};
      for (const d of body.split(';')) {
        const k = d.indexOf(':');
        if (k > 0) decls[d.slice(0, k).trim().toLowerCase()] = d.slice(k + 1).trim();
      }
      rules.push({ media, selectors: prelude.split(',').map((s) => s.trim()).filter(Boolean), decls });
    }
    i = j;
  }
  return rules;
};
const cssRules = parseRules(cssNoComments);
const screenRules = cssRules.filter((r) => !/\bprint\b/i.test(r.media));
const usesToken = (value, name) => new RegExp(`var\\(\\s*--${name}\\s*\\)`).test(value ?? '');
const ruleFor = (selector) => screenRules.find((r) => r.selectors.includes(selector));
const resolveColour = (value) => {
  const v = value?.match(/var\(\s*--([\w-]+)\s*\)/);
  return v ? token(v[1]) : value?.match(/#[0-9a-fA-F]{6}\b/)?.[0];
};

// Areas with a navy background on screen, by class or element name, e.g.
// .site-footer, .card--dark, .skip-link, .button, button.
const navyAreas = screenRules
  .filter((r) => usesToken(r.decls.background ?? r.decls['background-color'], 'navy'))
  .flatMap((r) => r.selectors)
  .filter((s) => /^(\.[\w-]+|[a-z]+)$/i.test(s));

// True when a selector targets something inside (or is) one of the given areas.
// BEM elements count as inside their block: .site-footer__label is in .site-footer.
const insideArea = (selector, areas) =>
  areas.some((area) => {
    if (area.startsWith('.')) {
      const name = area.slice(1).replace(/[-]/g, '\\-');
      return new RegExp(`\\.${name}(?![\\w-])|\\.${name}__[\\w-]+`).test(selector);
    }
    return new RegExp(`(^|[\\s>+~(])${area}(?![\\w-])`, 'i').test(selector);
  });

// Selectors whose rule sets the text colour to the given token.
const textSelectors = (name) =>
  screenRules.filter((r) => usesToken(r.decls.color, name)).flatMap((r) => r.selectors.map((s) => ({ s, rule: r })));

// Font size of a rule in px, if it sets one in px or rem.
const fontSizePx = (rule) => {
  const m = (rule.decls['font-size'] ?? '').match(/^([\d.]+)(px|rem)$/);
  return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : null;
};

const remOf = (value) => {
  const m = (value ?? '').match(/^([\d.]+)rem$/);
  return m ? Number(m[1]) : null;
};

// Every text file in docs/, recursively.
const docsTextFiles = readdirSync(DOCS, { recursive: true })
  .map(String)
  .filter((f) => /\.(html|css|js|mjs|svg|json|txt|md|webmanifest|xml)$/i.test(f));

// ==========================================================================
// Per-page checks
// ==========================================================================

test('docs/ contains at least the home page', () => {
  assert.ok(pages.includes('index.html'), `pages found: ${pages.join(', ')}`);
});

for (const page of pages) {
  const html = read(join(DOCS, page));

  describe(`${page}: head`, () => {
    test('html element declares lang="en"', () => {
      const htmlTag = tags(html).find((t) => /^<html\b/i.test(t));
      assert.equal(attr(htmlTag, 'lang'), 'en');
    });

    test('declares UTF-8', () => {
      assert.match(html, /<meta\s+charset=["']?utf-8["']?\s*\/?>/i);
    });

    test('has a non-empty title that names Floc Nation', () => {
      const title = section(html, 'title');
      assert.ok(title && title.trim().length > 0, 'title is present and not empty');
      assert.match(title, /Floc Nation/);
    });

    test('has a non-empty meta description', () => {
      const [m] = metaByName(html, 'description');
      assert.ok(m, 'meta description present');
      assert.ok((attr(m, 'content') ?? '').trim().length > 0, 'description is not empty');
    });

    test('keeps robots noindex until gate G3', () => {
      const robots = metaByName(html, 'robots');
      assert.equal(robots.length, 1, 'exactly one robots meta');
      assert.match(attr(robots[0], 'content'), /\bnoindex\b/i);
    });

    test('viewport meta is mobile first and allows zoom', () => {
      const [m] = metaByName(html, 'viewport');
      assert.ok(m, 'viewport meta present');
      const content = attr(m, 'content');
      assert.match(content, /width=device-width/);
      assert.doesNotMatch(content, /user-scalable\s*=\s*(no|0)/i);
      assert.doesNotMatch(content, /maximum-scale\s*=\s*1(\.0)?\b/i);
    });

    test('links the shared stylesheet css/site.css', () => {
      const sheet = tags(html).find((t) => /^<link\b/i.test(t) && attr(t, 'rel') === 'stylesheet');
      assert.ok(sheet, 'stylesheet link present');
      assert.equal(attr(sheet, 'href'), 'css/site.css');
    });

    test('theme-color is a badge palette colour', () => {
      for (const m of metaByName(html, 'theme-color')) {
        const c = (attr(m, 'content') ?? '').toUpperCase();
        assert.ok(Object.values(BRAND).includes(c), `theme-color ${c} is not in the badge palette`);
      }
    });
  });

  describe(`${page}: Content Security Policy`, () => {
    const csp = cspOf(html);

    test('has a CSP meta tag', () => {
      assert.ok(csp, 'Content-Security-Policy meta present');
    });

    test('CSP default-src, script-src and img-src allow this site only', () => {
      for (const d of ['default-src', 'script-src', 'img-src']) {
        assert.deepEqual(csp[d], ["'self'"], d);
      }
    });

    test('CSP blocks plugins, base-tag hijacking and form posts', () => {
      assert.deepEqual(csp['object-src'], ["'none'"]);
      assert.deepEqual(csp['base-uri'], ["'self'"]);
      assert.deepEqual(csp['form-action'], ["'none'"]);
    });

    test('CSP style-src and font-src allow this site plus Google Fonts at most', () => {
      const allowed = {
        'style-src': ["'self'", GOOGLE_FONTS_CSS],
        'font-src': ["'self'", GOOGLE_FONTS_FILES],
      };
      for (const [d, ok] of Object.entries(allowed)) {
        const sources = csp[d] ?? csp['default-src'];
        assert.ok(sources.includes("'self'"), `${d} includes 'self'`);
        for (const s of sources) assert.ok(ok.includes(s), `${d} source ${s} is not allowed`);
      }
    });

    test('CSP never allows unsafe-inline, unsafe-eval or wildcards', () => {
      for (const [d, sources] of Object.entries(csp)) {
        for (const s of sources) {
          assert.ok(!/unsafe-|^\*$|^https?:$|^data:$|^blob:$/i.test(s), `${d} allows ${s}`);
        }
      }
    });

    test('CSP allows Google Fonts only while site.css still imports them', () => {
      const cssImportsGoogle = cssNoComments.includes(GOOGLE_FONTS_CSS);
      const cspAllowsGoogle =
        (csp['style-src'] ?? []).includes(GOOGLE_FONTS_CSS) || (csp['font-src'] ?? []).includes(GOOGLE_FONTS_FILES);
      assert.equal(cspAllowsGoogle, cssImportsGoogle, 'CSP Google Fonts entries and the site.css @import must go together');
    });
  });

  describe(`${page}: no inline code the CSP would block`, () => {
    test('has no inline scripts (every script tag has a src)', () => {
      for (const t of tags(html).filter((x) => /^<script\b/i.test(x))) {
        assert.ok(attr(t, 'src'), `inline script: ${t}`);
      }
    });

    test('has no inline event handler attributes', () => {
      const offenders = tags(html).filter((t) => /\son[a-z]+\s*=/i.test(t));
      assert.deepEqual(offenders, []);
    });

    test('has no inline style attributes or style blocks', () => {
      assert.deepEqual(tags(html).filter((t) => /\sstyle\s*=/i.test(t)), [], 'style attributes');
      assert.doesNotMatch(html, /<style\b/i, 'style block');
    });

    test('has no javascript: URLs', () => {
      assert.doesNotMatch(html, /javascript:/i);
    });
  });

  describe(`${page}: loads nothing from other sites`, () => {
    test('scripts, styles and images load from this site only', () => {
      const offenders = tags(html)
        .filter((t) => /^<(script|link|img|source|iframe|video|audio)\b/i.test(t))
        .map((t) => attr(t, 'src') ?? attr(t, 'href'))
        .filter(isExternal);
      assert.deepEqual(offenders, []);
    });

    test('every local file the page references exists', () => {
      const refs = tags(html)
        .filter((t) => /^<(script|link|img|a)\b/i.test(t))
        .map((t) => attr(t, 'src') ?? attr(t, 'href'))
        .filter((u) => u && !isExternal(u) && !u.startsWith('#') && !/^(mailto|tel):/i.test(u));
      for (const ref of refs) {
        let p = join(DOCS, ref.split(/[?#]/)[0]);
        if (ref.endsWith('/') || ref === '.' || ref === './') p = join(p, 'index.html');
        assert.ok(existsSync(p), `${ref} -> ${p} is missing`);
      }
    });

    test('every in-page anchor points to an element that exists', () => {
      for (const { href } of links(html).filter((l) => l.href?.startsWith('#') && l.href.length > 1)) {
        assert.match(html, new RegExp(`\\sid=["']${href.slice(1)}["']`), `${href} has no target`);
      }
    });
  });

  describe(`${page}: header badge`, () => {
    const header = section(html, 'header');
    const logoTag = header && tags(header).find((t) => /^<a\b/i.test(t) && /\blogo\b/.test(attr(t, 'class') ?? ''));
    const logoInner = header?.match(/<a\b[^>]*class="[^"]*\blogo\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? '';
    const logoImgs = tags(logoInner).filter((t) => /^<img\b/i.test(t));
    const badgeImg = logoImgs[0];

    test('has a skip link to the main content as the first focusable element', () => {
      const firstLink = links(html)[0];
      assert.ok(firstLink, 'page has links');
      assert.match(firstLink.tag, /\bskip-link\b/);
      assert.equal(firstLink.href, '#main');
      assert.match(html, /<main\b[^>]*\sid=["']main["']/);
    });

    test('logo links to the home page', () => {
      assert.ok(logoTag, 'header contains a.logo');
      assert.ok(['./', 'index.html', './index.html'].includes(attr(logoTag, 'href')), `href=${attr(logoTag, 'href')}`);
    });

    test('logo has the accessible name "Floc Nation, home"', () => {
      assert.equal(attr(logoTag, 'aria-label'), 'Floc Nation, home');
    });

    test('the home link holds exactly one image and nothing else', () => {
      assert.equal(logoImgs.length, 1, `images in a.logo: ${logoImgs.length}`);
      const rest = logoInner.replace(/<img\b[^>]*>/gi, '').trim();
      assert.equal(rest, '', `a.logo also holds: ${rest}`);
    });

    test(`the home link image is the badge, ${BADGE_SRC}`, () => {
      assert.equal(attr(badgeImg, 'src'), BADGE_SRC);
    });

    test('the badge image has a non-empty alt', () => {
      assert.ok((attr(badgeImg, 'alt') ?? '').trim().length > 0, `alt="${attr(badgeImg, 'alt')}"`);
    });

    test("the badge image's width and height keep the SVG viewBox ratio", () => {
      const vb = read(BADGE_PATH).match(/<svg\b[^>]*\sviewBox=["']([^"']+)["']/i);
      assert.ok(vb, 'badge SVG has a viewBox');
      const [, , vw, vh] = vb[1].trim().split(/[\s,]+/).map(Number);
      const w = Number(attr(badgeImg, 'width'));
      const h = Number(attr(badgeImg, 'height'));
      assert.ok(w > 0 && h > 0, `width=${attr(badgeImg, 'width')} height=${attr(badgeImg, 'height')}`);
      const off = Math.abs(w / h - vw / vh) / (vw / vh);
      assert.ok(off < 0.01, `img ${w}x${h} (${(w / h).toFixed(4)}) vs viewBox ${vw}x${vh} (${(vw / vh).toFixed(4)})`);
    });

    test('has exactly one h1', () => {
      assert.equal((html.match(/<h1\b/gi) ?? []).length, 1);
    });
  });

  describe(`${page}: footer`, () => {
    const footer = section(html, 'footer') ?? '';
    const footerLinks = links(footer);

    test('footer shows the tagline "Brewed and built in Bangkok"', () => {
      assert.match(text(footer), /Brewed and built in Bangkok/);
    });

    test('footer links to the four flocnationbrew accounts, once each', () => {
      const platforms = footerLinks
        .filter((l) => isExternal(l.href))
        .map((l) => SOCIAL_HOSTS[new URL(l.href).hostname])
        .sort();
      assert.deepEqual(platforms, ['Facebook', 'Instagram', 'TikTok', 'YouTube']);
    });

    test('every social link points to the flocnationbrew handle over https', () => {
      for (const { href } of footerLinks.filter((l) => isExternal(l.href))) {
        const u = new URL(href);
        assert.equal(u.protocol, 'https:', href);
        assert.match(u.pathname, /^\/@?flocnationbrew\/?$/, href);
      }
    });

    test('every off-site link on the page is a flocnationbrew account', () => {
      for (const { href } of links(html).filter((l) => isExternal(l.href))) {
        const u = new URL(href);
        assert.ok(u.hostname in SOCIAL_HOSTS, `unexpected outside link ${href}`);
        assert.match(u.pathname, /flocnationbrew/, href);
      }
    });

    test('links that open a new tab use rel="noopener noreferrer"', () => {
      for (const l of links(html).filter((x) => x.target === '_blank')) {
        const rel = (l.rel ?? '').split(/\s+/);
        assert.ok(rel.includes('noopener') && rel.includes('noreferrer'), l.tag);
      }
    });
  });

  describe(`${page}: privacy and brand text`, () => {
    test('has no email addresses, mailto or tel links', () => {
      assert.doesNotMatch(html, /mailto:|tel:/i);
      assert.doesNotMatch(html, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    });

    test('never spells the brand name with a K', () => {
      assert.doesNotMatch(html, /flock/i);
    });
  });

  describe(`${page}: form labels and ARIA references`, () => {
    const allTags = tags(html);
    const ids = allTags.map((t) => attr(t, 'id')).filter(Boolean);

    test('every input, select and textarea has a label', () => {
      const re = /<(input|select|textarea)\b[^>]*>/gi;
      for (const m of html.matchAll(re)) {
        const t = m[0];
        if (/^(hidden|submit|button|reset|image)$/i.test(attr(t, 'type') ?? '')) continue;
        const id = attr(t, 'id');
        const hasFor = id && allTags.some((x) => /^<label\b/i.test(x) && attr(x, 'for') === id);
        const before = html.slice(0, m.index);
        const wrapped = before.lastIndexOf('<label') > before.lastIndexOf('</label>');
        assert.ok(hasFor || wrapped || attr(t, 'aria-label'), `unlabelled control: ${t}`);
      }
    });

    test('every id named by for, aria-describedby, aria-labelledby or aria-controls exists', () => {
      for (const t of allTags) {
        for (const a of ['for', 'aria-describedby', 'aria-labelledby', 'aria-controls']) {
          for (const ref of (attr(t, a) ?? '').split(/\s+/).filter(Boolean)) {
            assert.ok(ids.includes(ref), `${a}="${ref}" has no element: ${t}`);
          }
        }
      }
    });

    test('ids are unique', () => {
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      assert.deepEqual(dupes, []);
    });
  });

  describe(`${page}: header navigation`, () => {
    const nav = html.match(/<nav\b[^>]*aria-label="Main"[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? '';
    const navLinks = links(nav);
    const pageOf = (href) => (['./', '.', 'index.html', './index.html'].includes(href) ? 'index.html' : href);

    test('header nav links to the home page and the calculator', () => {
      const targets = navLinks.map((l) => pageOf(l.href)).sort();
      assert.deepEqual(targets, ['calculator.html', 'index.html']);
    });

    test('header nav marks this page, and only this page, as current', () => {
      const current = navLinks.filter((l) => attr(l.tag, 'aria-current') === 'page').map((l) => pageOf(l.href));
      assert.deepEqual(current, [page]);
    });
  });
}

// ==========================================================================
// Calculator page
// ==========================================================================

describe('calculator.html: page wiring', { skip: !pages.includes('calculator.html') && 'no calculator page yet' }, () => {
  const html = pages.includes('calculator.html') ? read(join(DOCS, 'calculator.html')) : '';

  test('loads js/calculator.js as an ES module', () => {
    const s = tags(html).find((t) => /^<script\b/i.test(t) && attr(t, 'src') === 'js/calculator.js');
    assert.ok(s, 'script tag for js/calculator.js');
    assert.equal(attr(s, 'type'), 'module');
  });

  test('results, safety notes and prompt sit inside one polite live region', () => {
    const live = tags(html).filter((t) => attr(t, 'aria-live'));
    assert.equal(live.length, 1, 'exactly one live region');
    assert.equal(attr(live[0], 'aria-live'), 'polite');
    // Take the live element through its matching closing tag.
    const start = html.indexOf(live[0]);
    const name = live[0].match(/^<([a-z]+)/i)[1];
    const re = new RegExp(`<${name}\\b|</${name}>`, 'gi');
    re.lastIndex = start;
    let depth = 0;
    let end = -1;
    for (let m = re.exec(html); m; m = re.exec(html)) {
      depth += m[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { end = re.lastIndex; break; }
    }
    const region = html.slice(start, end);
    for (const id of ['result-prompt', 'note-high-pressure', 'note-no-sugar', 'batch-grams', 'per-bottle-grams']) {
      assert.match(region, new RegExp(`\\sid="${id}"`), `#${id} is inside the live region`);
    }
  });

  test('every inline error message starts hidden', () => {
    const errors = tags(html).filter((t) => /\bfield-error\b/.test(attr(t, 'class') ?? ''));
    assert.ok(errors.length >= 4, 'error slots present');
    for (const t of errors) assert.match(t, /\shidden(\s|>|=)/, `${t} should start hidden`);
  });
});

// ==========================================================================
// Shared stylesheet
// ==========================================================================

describe('badge file', () => {
  const svg = read(BADGE_PATH);

  test('the badge SVG has no script elements', () => {
    assert.doesNotMatch(svg, /<script\b/i);
  });

  test('the badge SVG has no foreignObject', () => {
    assert.doesNotMatch(svg, /<foreignObject\b/i);
  });

  test('the badge SVG has no event-handler attributes', () => {
    const offenders = tags(svg).filter((t) => /\son[a-z]+\s*=/i.test(t));
    assert.deepEqual(offenders, []);
  });

  test('the badge SVG references nothing outside itself', () => {
    for (const t of tags(svg)) {
      for (const a of ['href', 'xlink:href', 'src']) {
        const v = attr(t, a);
        if (v !== null) assert.ok(v.startsWith('#'), `${a}="${v}" in ${t.slice(0, 60)}`);
      }
    }
    for (const [, u] of svg.matchAll(/url\(\s*["']?([^"')]*)/gi)) assert.ok(u.startsWith('#'), `url(${u})`);
    assert.doesNotMatch(svg, /@import/i, '@import');
    assert.doesNotMatch(svg, /<image\b/i, '<image>');
    const withoutNamespaces = svg.replace(/\sxmlns(:\w+)?\s*=\s*["'][^"']*["']/g, '');
    assert.doesNotMatch(withoutNamespaces, /(https?:|data:|javascript:)/i);
  });

  test('the served badge is the source file from brand/logo, unchanged', () => {
    assert.equal(svg, read(BADGE_SOURCE_PATH));
  });
});

describe('retired bottle-cap brand', () => {
  test('cap.svg is gone from docs/assets', () => {
    assert.ok(!existsSync(join(DOCS, 'assets', 'cap.svg')));
  });

  test('no retired brand colour appears anywhere in docs/', () => {
    const found = [];
    for (const f of docsTextFiles) {
      const body = read(join(DOCS, f)).toUpperCase();
      for (const hex of RETIRED_HEXES) if (body.includes(hex)) found.push(`${hex} in docs/${f}`);
    }
    assert.deepEqual(found, []);
  });

  test('no page or stylesheet refers to cap.svg or the old copper, steel and paper tokens', () => {
    const found = [];
    for (const f of docsTextFiles) {
      for (const m of read(join(DOCS, f)).matchAll(/cap\.svg|--(copper|steel|paper)(?![\w])|--paper-border|logo__(mark|nation)/gi)) {
        found.push(`${m[0]} in docs/${f}`);
      }
    }
    assert.deepEqual(found, []);
  });
});

describe('site.css: badge colours', () => {
  test('defines the eight badge colours exactly as in CLAUDE.md', () => {
    for (const [name, hex] of Object.entries(BRAND)) {
      assert.equal(token(name).toUpperCase(), hex, `--${name}`);
    }
  });

  test('uses only badge palette colours', () => {
    const palette = new Set(Object.values(BRAND));
    const hexes = (cssNoComments.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map((h) => h.toUpperCase());
    for (const h of hexes) assert.ok(palette.has(h), `off-brand colour ${h}`);
    assert.doesNotMatch(cssNoComments, /\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/i, 'colours should come from the badge tokens');
  });

  test('uses no named colours such as white, black, navy or teal', () => {
    // Words allowed in colour-bearing declarations; anything else is a named colour.
    const allowed = new Set([
      'transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'none', 'auto',
      'solid', 'dashed', 'dotted', 'double', 'underline', 'var', 'calc', 'linear-gradient', 'deg',
      'light', 'dark', 'normal',
    ]);
    const colourProps = /^(color|background(-color|-image)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|text-decoration(-color)?|accent-color|caret-color|fill|stroke|box-shadow|column-rule|color-scheme)$/;
    const offenders = [];
    for (const r of cssRules) {
      for (const [prop, value] of Object.entries(r.decls)) {
        if (!colourProps.test(prop)) continue;
        const words = value.replace(/var\([^)]*\)|#[0-9a-fA-F]+\b/g, ' ').match(/[a-z][a-z-]*/gi) ?? [];
        for (const w of words) {
          if (!allowed.has(w.toLowerCase()) && !/^(px|rem|em|%)$/.test(w)) offenders.push(`${r.selectors.join(', ')} { ${prop}: ${value} }`);
        }
      }
    }
    assert.deepEqual([...new Set(offenders)], []);
  });

  test('every var() in site.css refers to a defined custom property', () => {
    const defined = new Set([...cssNoComments.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    const missing = [...cssNoComments.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]).filter((n) => !defined.has(n));
    assert.deepEqual([...new Set(missing)], []);
  });

  test('the page background is white and body text is navy', () => {
    const body = ruleFor('body');
    assert.ok(usesToken(body.decls.background ?? body.decls['background-color'], 'white'), `body background: ${body.decls.background}`);
    assert.ok(usesToken(body.decls.color, 'navy'), `body color: ${body.decls.color}`);
  });

  test('cards are pale blue with a line-coloured border', () => {
    const card = ruleFor('.card');
    assert.ok(usesToken(card.decls.background ?? card.decls['background-color'], 'pale'), `.card background: ${card.decls.background}`);
    assert.ok(usesToken(card.decls.border, 'line'), `.card border: ${card.decls.border}`);
  });

  test('the footer is navy with sky links', () => {
    const footer = ruleFor('.site-footer');
    assert.ok(usesToken(footer.decls.background ?? footer.decls['background-color'], 'navy'), `.site-footer background: ${footer.decls.background}`);
    assert.ok(usesToken(ruleFor('.site-footer a')?.decls.color, 'sky'), '.site-footer a is sky');
  });

  test('the result card is navy with sky labels and white numbers', () => {
    const dark = ruleFor('.card--dark');
    assert.ok(usesToken(dark.decls.background ?? dark.decls['background-color'], 'navy'), `.card--dark background: ${dark.decls.background}`);
    assert.ok(usesToken(dark.decls.color, 'white'), `.card--dark color: ${dark.decls.color}`);
    assert.ok(usesToken(ruleFor('.card--dark .result__label')?.decls.color, 'sky'), '.card--dark .result__label is sky');
    // The numbers inherit white from .card--dark: .result__value must not set its own colour.
    assert.equal(ruleFor('.result__value')?.decls.color, undefined, '.result__value sets no colour of its own');
  });
});

describe('site.css: the badge in the header', () => {
  const img = ruleFor('.logo img');

  test('the badge is sized by height with an automatic width, so it never stretches', () => {
    assert.ok(img, '.logo img rule present');
    assert.ok(img.decls.height, '.logo img sets a height');
    assert.equal(img.decls.width, 'auto');
    for (const r of cssRules.filter((x) => x.selectors.includes('.logo img'))) {
      assert.ok(r.decls.width === undefined || r.decls.width === 'auto', `${r.media || 'base'} sets width ${r.decls.width}`);
      assert.ok(!r.decls['object-fit'] || r.decls['object-fit'] === 'contain', `object-fit ${r.decls['object-fit']}`);
    }
  });

  test('the badge has no max-width cap that could squash it on a narrow screen', () => {
    // The global img { max-width: 100% } plus a fixed height would distort the badge.
    assert.equal(img.decls['max-width'], 'none');
  });

  test('the badge is 4rem tall on phones and 5rem from 40em', () => {
    const base = screenRules.find((r) => !r.media && r.selectors.includes(':root'));
    const wide = screenRules.find((r) => /min-width:\s*40em/.test(r.media) && r.selectors.includes(':root'));
    assert.ok(usesToken(img.decls.height, 'badge-height'), `.logo img height: ${img.decls.height}`);
    assert.equal(base.decls['--badge-height'], '4rem');
    assert.equal(wide?.decls['--badge-height'], '5rem');
  });

  test('the header keeps clear space of a quarter of the badge height on every side', () => {
    const base = screenRules.find((r) => !r.media && r.selectors.includes(':root'));
    const wide = screenRules.find((r) => /min-width:\s*40em/.test(r.media) && r.selectors.includes(':root'));
    assert.match(base.decls['--badge-clear'], /^calc\(\s*var\(--badge-height\)\s*\/\s*4\s*\)$/);
    const inner = ruleFor('.site-header__inner');
    assert.ok(usesToken(inner.decls['padding-block'], 'badge-clear'), `padding-block: ${inner.decls['padding-block']}`);
    assert.ok(usesToken(inner.decls.gap, 'badge-clear'), `gap: ${inner.decls.gap}`);
    // Left and right: the container gutter must be at least the clear space.
    for (const [label, root] of [['phones', base], ['from 40em', wide]]) {
      const height = remOf(root.decls['--badge-height'] ?? base.decls['--badge-height']);
      const gutter = remOf(root.decls['--gutter'] ?? base.decls['--gutter']);
      assert.ok(gutter >= height / 4, `${label}: gutter ${gutter}rem < clear space ${height / 4}rem`);
    }
  });
});

describe('site.css: text contrast meets WCAG AA', () => {
  const pairs = [
    ['navy text on white', 'navy', 'white'],
    ['navy text on pale blue', 'navy', 'pale'],
    ['muted text on white', 'muted', 'white'],
    ['muted text on pale blue', 'muted', 'pale'],
    ['deep-teal links on white', 'teal-deep', 'white'],
    ['deep-teal links on pale blue', 'teal-deep', 'pale'],
    ['white text on navy', 'white', 'navy'],
    ['sky links and labels on navy', 'sky', 'navy'],
    ['pale-blue text on navy', 'pale', 'navy'],
    ['white text on deep teal (button hover, selection)', 'white', 'teal-deep'],
  ];
  for (const [label, fg, bg] of pairs) {
    test(`${label} is at least 4.5:1`, () => {
      const r = contrast(token(fg), token(bg));
      assert.ok(r >= 4.5, `${label}: ${r.toFixed(2)}:1`);
    });
  }

  test('hop teal on white is at least 3:1, enough for text 24 px or larger', () => {
    const r = contrast(token('teal'), token('white'));
    assert.ok(r >= 3, `hop teal on white: ${r.toFixed(2)}:1`);
  });
});

describe('site.css: colour roles from CLAUDE.md', () => {
  test('navy areas are found in site.css (footer and result card)', () => {
    assert.ok(navyAreas.includes('.site-footer'), `navy areas: ${navyAreas.join(', ')}`);
    assert.ok(navyAreas.includes('.card--dark'), `navy areas: ${navyAreas.join(', ')}`);
  });

  test('sky is text only inside navy areas, never on white or pale', () => {
    const offenders = textSelectors('sky').filter(({ s }) => !insideArea(s, navyAreas)).map(({ s }) => s);
    assert.deepEqual(offenders, [], `navy areas: ${navyAreas.join(', ')}`);
  });

  test('pale blue is text only inside navy areas', () => {
    const offenders = textSelectors('pale').filter(({ s }) => !insideArea(s, navyAreas)).map(({ s }) => s);
    assert.deepEqual(offenders, []);
  });

  test('white text sits only on navy or deep teal', () => {
    const offenders = textSelectors('white')
      .filter(({ s, rule }) => {
        const bg = rule.decls.background ?? rule.decls['background-color'];
        return !insideArea(s, navyAreas) && !usesToken(bg, 'navy') && !usesToken(bg, 'teal-deep');
      })
      .map(({ s }) => s);
    assert.deepEqual(offenders, []);
  });

  test('hop teal is text only at 24 px or larger', () => {
    const offenders = textSelectors('teal')
      .filter(({ rule }) => !(fontSizePx(rule) >= 24))
      .map(({ s, rule }) => `${s} (font-size ${rule.decls['font-size'] ?? 'inherited'})`);
    assert.deepEqual(offenders, []);
  });

  test('the line colour is never used for text', () => {
    assert.deepEqual(textSelectors('line').map(({ s }) => s), []);
  });
});

describe('site.css: focus rings are at least 3:1 against their background', () => {
  const ringColour = (selector) => {
    const r = ruleFor(selector);
    assert.ok(r, `${selector} rule present`);
    const c = resolveColour(r.decls['outline-color'] ?? r.decls.outline);
    assert.ok(c, `${selector} sets an outline colour`);
    return c;
  };

  test('the default focus ring is at least 3:1 on white and on pale blue', () => {
    const c = ringColour(':focus-visible');
    for (const bg of ['white', 'pale']) {
      const r = contrast(c, token(bg));
      assert.ok(r >= 3, `${c} on ${bg}: ${r.toFixed(2)}:1`);
    }
  });

  test('form-control focus rings are at least 3:1 on white and on pale blue', () => {
    const c = ringColour('input[type="text"]:focus-visible');
    for (const bg of ['white', 'pale']) {
      const r = contrast(c, token(bg));
      assert.ok(r >= 3, `${c} on ${bg}: ${r.toFixed(2)}:1`);
    }
  });

  test('focus rings in the navy footer and the navy result card are at least 3:1 on navy', () => {
    for (const sel of ['.site-footer :focus-visible', '.card--dark :focus-visible']) {
      const c = ringColour(sel);
      const r = contrast(c, token('navy'));
      assert.ok(r >= 3, `${sel}: ${c} on navy ${r.toFixed(2)}:1`);
    }
  });
});

describe('site.css: loads nothing from other sites', () => {
  test('the only outside URL is the Google Fonts preview import', () => {
    const urls = [
      ...[...cssNoComments.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/g)].map((m) => m[1]),
      ...[...cssNoComments.matchAll(/url\(\s*["']?([^"')]+)/g)].map((m) => m[1]),
    ].filter(isExternal);
    for (const u of urls) assert.ok(u.startsWith(`${GOOGLE_FONTS_CSS}/`), `outside URL ${u}`);
  });

  test('uses Manrope first in the font stack', () => {
    assert.match(cssNoComments, /--font:\s*"Manrope"/);
  });
});

describe('fonts', () => {
  test(
    'Manrope is self-hosted in docs/fonts with its licence',
    { todo: 'Google Fonts fallback is allowed on the preview; must be self-hosted before gate G3' },
    () => {
      const dir = join(DOCS, 'fonts');
      assert.ok(existsSync(dir), 'docs/fonts exists');
      const files = readdirSync(dir);
      assert.ok(files.some((f) => /^Manrope.*\.woff2$/i.test(f)), 'Manrope .woff2 files present');
      assert.ok(files.some((f) => /^(OFL|LICEN[CS]E)/i.test(f)), 'licence file present');
      assert.ok(!cssNoComments.includes(GOOGLE_FONTS_CSS), 'Google Fonts @import removed');
    },
  );
});
