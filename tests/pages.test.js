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

// Brand colours from CLAUDE.md.
const BRAND = {
  navy: '#13233A',
  steel: '#2F5D8A',
  copper: '#B8741F',
  paper: '#F3EEE5',
  'paper-border': '#D9D1C3',
  muted: '#4F5B6B',
};

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

  describe(`${page}: header logo lockup`, () => {
    const header = section(html, 'header');
    const logoTag = header && tags(header).find((t) => /^<a\b/i.test(t) && /\blogo\b/.test(attr(t, 'class') ?? ''));
    const logoInner = header?.match(/<a\b[^>]*class="[^"]*\blogo\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? '';

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

    test('logo reads FL, the cap image as the O, C, then NATION', () => {
      const shape = logoInner
        .replace(/<img\b[^>]*src=["'][^"']*cap\.svg["'][^>]*>/gi, '(cap)')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, '');
      assert.equal(shape, 'FL(cap)CNATION');
    });

    test('cap image in the logo is decorative (empty alt, aria-hidden wrapper)', () => {
      const img = tags(logoInner).find((t) => /^<img\b/i.test(t));
      assert.equal(attr(img, 'alt'), '');
      for (const span of tags(logoInner).filter((t) => /^<span\b/i.test(t) && /logo__/.test(attr(t, 'class') ?? ''))) {
        assert.equal(attr(span, 'aria-hidden'), 'true', `${span} should be aria-hidden`);
      }
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
}

// ==========================================================================
// Shared stylesheet
// ==========================================================================

describe('site.css: brand colours', () => {
  test('defines the six brand colours exactly as in CLAUDE.md', () => {
    for (const [name, hex] of Object.entries(BRAND)) {
      assert.equal(token(name).toUpperCase(), hex, `--${name}`);
    }
  });

  test('uses only brand palette colours', () => {
    const palette = new Set(Object.values(BRAND));
    const hexes = (cssNoComments.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map((h) => h.toUpperCase());
    for (const h of hexes) assert.ok(palette.has(h), `off-brand colour ${h}`);
    assert.doesNotMatch(cssNoComments, /\b(rgb|rgba|hsl|hsla)\(/i, 'colours should come from the brand tokens');
  });

  test('copper is used only for the logo cap', () => {
    assert.doesNotMatch(cssNoComments, /var\(--copper\)/, 'site.css must not apply --copper');
    const copperHexes = cssNoComments.match(/#B8741F/gi) ?? [];
    assert.equal(copperHexes.length, 1, 'copper hex appears only in the token definition');
    for (const page of pages) {
      assert.doesNotMatch(read(join(DOCS, page)), /#B8741F/i, `${page} uses copper`);
    }
    assert.match(read(join(DOCS, 'assets', 'cap.svg')), /#B8741F/i, 'the cap is copper');
  });

  test('the logo NATION lines are thin steel-blue rules', () => {
    const rule = cssNoComments.match(/\.logo__nation::before,\s*\.logo__nation::after\s*\{([^}]*)\}/);
    assert.ok(rule, 'NATION line rule present');
    assert.match(rule[1], /height:\s*1px/);
    assert.match(rule[1], /background:\s*var\(--steel\)/);
  });
});

describe('site.css: text contrast meets WCAG AA (4.5:1)', () => {
  const pairs = [
    ['navy text on paper', 'navy', 'paper'],
    ['steel-blue links on paper', 'steel', 'paper'],
    ['muted text on paper', 'muted', 'paper'],
    ['paper text on the navy footer', 'paper', 'navy'],
    ['paper-border text on the navy footer', 'paper-border', 'navy'],
  ];
  for (const [label, fg, bg] of pairs) {
    test(`${label} is at least 4.5:1`, () => {
      const r = contrast(token(fg), token(bg));
      assert.ok(r >= 4.5, `${label}: ${r.toFixed(2)}:1`);
    });
  }

  test('focus rings are at least 3:1 against their background', () => {
    assert.ok(contrast(token('steel'), token('paper')) >= 3, 'steel ring on paper');
    assert.ok(contrast(token('paper'), token('navy')) >= 3, 'paper ring on navy footer');
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
