import { test, expect, type Page } from '@playwright/test';
import { ROUTE_NAMES, url, expectOn, scrollThrough, stuckHidden } from './helpers';

const WIDTHS = [320, 375, 430, 768, 1024, 1440, 1920];
const SHOT = 'test-artifacts/screenshots';

/** Visible text/controls that stick out of the viewport (body has overflow-x: clip, so scrollWidth can't be trusted). */
const overflowing = (page: Page) => page.evaluate(() => {
  const W = innerWidth, bad: string[] = [];
  const scrollers = '.explore__track, .hscroll__track, .feat__bg, .feat__stage, .hero__media, .rs__img, .menu, .sr-only, .curtain, .skip, .pop';
  document.querySelectorAll('h1, h2, h3, p, a, button, label, input, textarea, li, dd, dt, figcaption, img').forEach((el) => {
    if (el.closest(scrollers) || el.closest('[aria-hidden="true"]')) return;
    const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden') return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (r.right > W + 1 || r.left < -1) bad.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${Math.round(r.left)}–${Math.round(r.right)}] "${(el.textContent || '').trim().slice(0, 30)}"`);
  });
  return [...new Set(bad)];
});

/** Images whose rendered box was set from intrinsic size (not object-fit cover crops) but whose ratio is distorted. */
const distorted = (page: Page) => page.evaluate(() => [...document.images].filter((i) => {
  if (!i.complete || !i.naturalWidth || !i.width) return false;
  if (getComputedStyle(i).objectFit === 'cover' || getComputedStyle(i).objectFit === 'contain') return false;
  return Math.abs(i.width / i.height - i.naturalWidth / i.naturalHeight) > 0.03;
}).map((i) => i.currentSrc));

for (const w of WIDTHS) {
  test.describe(`${w}px`, () => {
    test.use({ viewport: { width: w, height: w < 768 ? 780 : 900 }, hasTouch: w < 1024, isMobile: w < 768 });
    for (const r of ROUTE_NAMES) {
      test(`#${r}`, async ({ page }) => {
        await page.goto(url(r));
        await expectOn(page, r);
        await scrollThrough(page, 700);
        expect(await overflowing(page)).toEqual([]);
        expect(await distorted(page)).toEqual([]);
        expect(await stuckHidden(page)).toEqual([]);
        // the right navigation for the width
        if (w <= 1180) await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
        else await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
        if (w < 768 && r !== 'booking') await expect(page.locator('.mbar')).toBeVisible();
        // touch targets: buttons (not inline text links) ≥ 24px
        if (w < 1024) {
          const small = await page.locator('main button:visible, .mbar button, .hdr button:visible').evaluateAll((els) => els
            .map((e) => ({ e, r: e.getBoundingClientRect() })).filter(({ e, r }) => r.width && (r.width < 24 || r.height < 24) && !e.closest('[aria-hidden="true"]'))
            .map(({ e, r }) => `${e.className} ${Math.round(r.width)}×${Math.round(r.height)} "${e.getAttribute('aria-label') || e.textContent}"`));
          expect(small).toEqual([]);
        }
      });
    }
  });
}

test.describe('breakpoint edges', () => {
  const checks: [number, string, boolean][] = [
    [399, '.ftr__cols one column', true], [401, '.ftr__cols one column', false],
    [767, 'mobile bar', true], [768, 'mobile bar', false],
    [1023, 'booking bar 2 columns', true], [1024, 'booking bar 2 columns', false],
    [1180, 'burger', true], [1181, 'burger', false],
  ];
  for (const [w, what, on] of checks) {
    test(`${w}px: ${what} ${on ? 'on' : 'off'}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto('/#contact');
      await expectOn(page, 'contact');
      await page.waitForTimeout(1800); // let the hero image settle from its 1.06 entrance scale
      const v = await page.evaluate((x) => {
        const cols = (s: string) => getComputedStyle(document.querySelector(s)!).gridTemplateColumns.split(' ').length;
        if (x === '.ftr__cols one column') return cols('.ftr__cols') === 1;
        if (x === 'mobile bar') return getComputedStyle(document.querySelector('.mbar')!).display !== 'none';
        if (x === 'burger') return getComputedStyle(document.querySelector('.burger')!).display !== 'none';
        return null;
      }, what);
      if (what === 'booking bar 2 columns') {
        await page.goto('/#booking'); await expectOn(page, 'booking'); await page.waitForTimeout(1800);
        const n = await page.evaluate(() => getComputedStyle(document.querySelector('.bpanel .bbar')!).gridTemplateColumns.split(' ').length);
        expect(n === 2).toBe(on);
      } else expect(v).toBe(on);
      expect(await overflowing(page)).toEqual([]);
    });
  }
});

test.describe('screenshots (review artifacts, not visual-regression baselines)', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } }); // deterministic: every section in its final state
  for (const w of [375, 1440]) {
    for (const r of ROUTE_NAMES) {
      test(`${w}px #${r}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: w < 768 ? 780 : 900 });
        await page.goto(url(r));
        await expectOn(page, r);
        await scrollThrough(page, 900); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
        await page.screenshot({ path: `${SHOT}/${w}-${r}.png`, fullPage: true });
      });
    }
  }
  for (const w of [320, 430, 768, 1024, 1920]) {
    for (const r of ['home', 'booking', 'gallery'] as const) {
      test(`${w}px #${r}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: w < 768 ? 780 : 900 });
        await page.goto(url(r));
        await expectOn(page, r);
        await page.screenshot({ path: `${SHOT}/${w}-${r}-viewport.png` });
      });
    }
  }
});
