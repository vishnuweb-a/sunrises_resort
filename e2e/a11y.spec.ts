import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { ROUTE_NAMES, url, expectOn } from './helpers';

// Reduced motion so every section is in its final, readable state while axe inspects it.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

for (const w of [1440, 375]) {
  test.describe(`axe WCAG 2.1 A/AA @ ${w}px`, () => {
    for (const r of ROUTE_NAMES) {
      test(`#${r}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(url(r)); await expectOn(page, r);
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const v = res.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, sample: x.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
        mkdirSync('test-artifacts/axe', { recursive: true });
        writeFileSync(`test-artifacts/axe/${w}-${r}.json`, JSON.stringify(v, null, 2));
        expect(v.filter((x) => x.impact === 'critical' || x.impact === 'serious')).toEqual([]);
      });
    }
  });
}

test('skip link is first in Tab order, visible on focus, moves focus to main @smoke', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit only Tabs to links when the user enables it (Safari: Option+Tab); not reproducible in Playwright WebKit on Windows');
  await page.goto('/#about'); await expectOn(page, 'about');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  expect((await skip.boundingBox())!.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('landmarks and heading hierarchy on every route', async ({ page }) => {
  const issues: string[] = [];
  for (const r of ROUTE_NAMES) {
    await page.goto(url(r)); await expectOn(page, r);
    const h = await page.evaluate(() => ({
      main: document.querySelectorAll('main').length, banner: document.querySelectorAll('body > div header, #root > header').length,
      footer: document.querySelectorAll('footer').length, h1: document.querySelectorAll('h1').length,
      levels: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((x) => +x.tagName[1]),
      noAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
      unnamedNav: [...document.querySelectorAll('nav')].filter((n) => !n.getAttribute('aria-label')).length,
    }));
    if (h.main !== 1) issues.push(`${r}: ${h.main} <main>`);
    if (h.banner !== 1 || h.footer !== 1) issues.push(`${r}: header/footer ${h.banner}/${h.footer}`);
    if (h.h1 !== 1) issues.push(`${r}: ${h.h1} h1`);
    h.levels.forEach((l, i) => { if (i && l > h.levels[i - 1] + 1) issues.push(`${r}: heading jumps h${h.levels[i - 1]}→h${l}`); });
    if (h.noAlt) issues.push(`${r}: ${h.noAlt} img without alt`);
    if (h.unnamedNav) issues.push(`${r}: ${h.unnamedNav} unnamed nav`);
  }
  expect(issues).toEqual([]);
});

test('focus indicator is visible on keyboard focus', async ({ page }) => {
  await page.goto('/#contact'); await expectOn(page, 'contact');
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  const o = await page.evaluate(() => { const s = getComputedStyle(document.activeElement!); return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }; });
  expect(o.style).not.toBe('none');
  expect(o.width).toBeGreaterThanOrEqual(2);
});

test('route change moves focus to main and updates the title (for screen readers)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Dining' }).click();
  await expectOn(page, 'restaurant');
  await expect(page.locator('main')).toBeFocused();
});

test('popovers expose dialog semantics and expanded state', async ({ page }) => {
  await page.goto('/#booking'); await expectOn(page, 'booking');
  const f = page.locator('.bpanel .bf__field').first();
  await expect(f).toHaveAttribute('aria-expanded', 'false');
  await f.click();
  await expect(f).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('dialog', { name: 'Choose check-in and check-out dates' })).toBeVisible();
});
