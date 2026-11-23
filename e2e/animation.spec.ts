import { test, expect } from '@playwright/test';
import { ROUTE_NAMES, url, expectOn, scrollThrough, stuckHidden, watch } from './helpers';

test.describe('scroll reveals finish on every route (desktop, motion on)', () => {
  for (const r of ROUTE_NAMES) {
    test(`#${r}`, async ({ page }) => {
      const problems = watch(page);
      await page.goto(url(r));
      await expectOn(page, r);
      await scrollThrough(page);
      expect(await stuckHidden(page)).toEqual([]);
      expect(problems).toEqual([]);
    });
  }
});

test('fast jump to the bottom still reveals everything that was skipped', async ({ page }) => {
  await page.goto('/#about');
  await page.waitForTimeout(300);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2200);
  expect(await stuckHidden(page)).toEqual([]);
});

test('reveals still work after many route changes', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const [l, r] of [['Accommodations', 'rooms'], ['Dining', 'restaurant'], ['Gallery', 'gallery'], ['About', 'about'], ['Wellness', 'wellness'], ['Resort Overview', 'home']] as const) {
    await nav.getByRole('link', { name: l, exact: true }).click(); await expectOn(page, r);
  }
  await scrollThrough(page);
  expect(await stuckHidden(page)).toEqual([]);
});

test('pinned resort stack: pins, layers the panels, then releases', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  const top = await page.evaluate(() => (document.querySelector('.pin-spacer') as HTMLElement).offsetTop);
  const len = await page.evaluate(() => (document.querySelector('.pin-spacer') as HTMLElement).offsetHeight - innerHeight);
  expect(len).toBeGreaterThan(1.5 * 900); // ~1.15 screens per transition × 2
  const panelY = (i: number) => page.evaluate((k) => new DOMMatrix(getComputedStyle(document.querySelectorAll('.rs__panel')[k]).transform).m42, i);
  expect(await panelY(1)).toBeGreaterThan(800); // waiting below
  // scrub to the middle of the pin
  for (let y = top; y <= top + len / 2; y += 150) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(30); }
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.rs')!).position)).toBe('fixed');
  expect(Math.abs(await panelY(1))).toBeLessThan(40); // panel 2 has risen
  // past the end
  for (let y = top + len / 2; y <= top + len + 400; y += 150) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(30); }
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.rs')!).position)).not.toBe('fixed');
  expect(Math.abs(await panelY(2))).toBeLessThan(2);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.rs__panel:nth-child(3) .rs__text')!).opacity)).toBe('1');
});

test('horizontal rooms pin on desktop (≥1024) travels the whole track', async ({ page }) => {
  await page.goto('/#rooms');
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  await scrollThrough(page, 300);
  const x = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.hscroll__track')!).transform).m41);
  const dist = await page.evaluate(() => document.querySelector('.hscroll__track')!.scrollWidth - innerWidth);
  expect(Math.abs(x + dist)).toBeLessThan(5);
});

test('resizing across 768px swaps pinned ↔ stacked layout without hidden content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  await page.setViewportSize({ width: 600, height: 900 });
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await scrollThrough(page);
  expect(await stuckHidden(page)).toEqual([]);
  const texts = await page.locator('.rs__text').evaluateAll((els) => els.map((e) => +getComputedStyle(e).opacity));
  expect(texts).toEqual([1, 1, 1]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
});

test('mobile (375): no pinning, resort panels are stacked and readable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await scrollThrough(page);
  expect(await page.locator('.rs__text').evaluateAll((els) => els.map((e) => +getComputedStyle(e).opacity))).toEqual([1, 1, 1]);
  expect(await stuckHidden(page)).toEqual([]);
});

test('page-transition curtain fades in, swaps the page, then lifts', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const c = document.querySelector('.curtain') as HTMLElement; (window as any).__maxCurtain = 0;
    const tick = () => { (window as any).__maxCurtain = Math.max((window as any).__maxCurtain, +getComputedStyle(c).opacity * (getComputedStyle(c).display === 'none' ? 0 : 1)); requestAnimationFrame(tick); };
    tick();
  });
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click();
  await expectOn(page, 'about');
  expect(await page.evaluate(() => (window as any).__maxCurtain)).toBeGreaterThan(0.9);
});

test('lightbox: opens with animation, arrows step, Tab trapped, Escape restores focus', async ({ page }) => {
  await page.goto('/#gallery');
  const first = page.locator('.pgrid__btn').first();
  await first.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  await first.click();
  const lb = page.getByRole('dialog', { name: 'Photo viewer' });
  await expect(lb).toBeVisible();
  await expect(lb.getByRole('button', { name: 'Close photo viewer' })).toBeFocused();
  await expect.poll(() => lb.locator('img').evaluate((i) => +getComputedStyle(i).opacity)).toBe(1);
  await expect(lb.locator('.lb__count')).toHaveText('1 / 15');
  await page.keyboard.press('ArrowRight'); await expect(lb.locator('.lb__count')).toHaveText('2 / 15');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await expect(lb.locator('.lb__count')).toHaveText('15 / 15');
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('.lb'))).toBe(true); }
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await page.keyboard.press('Escape');
  await expect(lb).toHaveCount(0);
  await expect(first).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('lightbox swipe on touch (mobile)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('/#gallery');
  const first = page.locator('.pgrid__btn').first();
  await first.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  await first.tap();
  const lb = page.locator('.lb');
  await lb.evaluate((el) => {
    const t = (x: number) => [new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 })];
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: t(300), changedTouches: t(300) }));
    el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: t(150) }));
  });
  await expect(lb.locator('.lb__count')).toHaveText('2 / 15');
  await ctx.close();
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  for (const r of ROUTE_NAMES) {
    test(`#${r}: all content visible immediately, nothing pinned @smoke`, async ({ page }) => {
      await page.goto(url(r));
      await expectOn(page, r);
      await page.waitForTimeout(300);
      expect(await stuckHidden(page)).toEqual([]);
      await expect(page.locator('.pin-spacer')).toHaveCount(0);
    });
  }
  test('navigation skips the curtain and commits immediately', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Gallery' }).click();
    await expect(page.locator('.curtain')).toBeHidden();
    await expectOn(page, 'gallery');
  });
  test('hero slideshow starts paused', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Play slideshow' })).toBeVisible();
  });
});

test.describe('React StrictMode (dev server) does not duplicate animations', () => {
  test.use({ baseURL: 'http://127.0.0.1:5175' });
  test('one pin per pinned section, reveals complete', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main h1')).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(page.locator('.pin-spacer')).toHaveCount(1);
    await scrollThrough(page);
    expect(await stuckHidden(page)).toEqual([]);
    await page.goto('/#rooms'); await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.locator('.pin-spacer')).toHaveCount(1);
  });
});
