import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ROUTES, ROUTE_NAMES, url, watch, expectOn, type R } from './helpers';

test('test route list matches src/router.tsx', () => {
  const src = readFileSync('src/router.tsx', 'utf8');
  const list = src.match(/export const routes = \[([^\]]+)\]/)![1].match(/'([^']+)'/g)!.map((s) => s.slice(1, -1));
  expect(list.sort()).toEqual([...ROUTE_NAMES].sort());
  expect(list).toHaveLength(12);
});

test.describe('direct URL load', () => {
  for (const r of ROUTE_NAMES) {
    test(`#${r} @smoke`, async ({ page }) => {
      const problems = watch(page);
      await page.goto(url(r));
      await expectOn(page, r);
      await expect(page.locator('main')).not.toBeFocused(); // first load: focus starts at the top (skip link)
      await page.waitForLoadState('networkidle');
      expect(problems).toEqual([]);
    });
  }
});

test('header navigation reaches every main-nav route and marks aria-current @smoke', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  const items: [string, R][] = [['Accommodations', 'rooms'], ['Dining', 'restaurant'], ['Wellness', 'wellness'], ['Gallery', 'gallery'], ['About', 'about'], ['Contact', 'contact'], ['Resort Overview', 'home']];
  for (const [label, r] of items) {
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expectOn(page, r);
    await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('main')).toBeFocused();
  }
});

test('footer navigation reaches every footer route', async ({ page }) => {
  await page.goto('/');
  const ftr = page.locator('footer');
  const items: [string, R][] = [['Executive Room with Hill View', 'room-executive-hill-view'], ['Executive Room with River View', 'room-executive-river-view'],
    ['Family Suite', 'room-family-suite'], ['Book your stay', 'booking'], ['About us', 'about'], ['Dining', 'restaurant'], ['Wellness', 'wellness'],
    ['Gallery', 'gallery'], ['Contact us', 'contact'], ['Policies', 'policies']];
  for (const [label, r] of items) {
    await ftr.getByRole('link', { name: label, exact: true }).click();
    await expectOn(page, r);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(5); // new route starts at the top
  }
});

test('browser back / forward keep URL and page in sync @smoke', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Accommodations' }).click();
  await expectOn(page, 'rooms');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Gallery' }).click();
  await expectOn(page, 'gallery');
  await page.goBack(); await expectOn(page, 'rooms');
  await page.goBack(); await expectOn(page, 'home');
  await page.goForward(); await expectOn(page, 'rooms');
  await page.goForward(); await expectOn(page, 'gallery');
});

test('refresh on a non-home route stays on that route', async ({ page }) => {
  await page.goto('/#gallery');
  await expectOn(page, 'gallery');
  await page.reload();
  await expectOn(page, 'gallery');
  await page.goto('/#room-family-suite');
  await page.reload();
  await expectOn(page, 'room-family-suite');
});

test('rapid clicks during the curtain transition end in a consistent state', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  // fire clicks without waiting for transitions
  for (const l of ['Accommodations', 'Gallery', 'About', 'Contact', 'Dining']) await nav.getByRole('link', { name: l }).click({ noWaitAfter: true });
  await page.waitForTimeout(1500);
  const hash = await page.evaluate(() => location.hash.slice(1)) as R;
  expect(ROUTE_NAMES).toContain(hash);
  await expectOn(page, hash);
  expect(problems).toEqual([]);
});

test('browser back during the curtain transition ends in a consistent state', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await nav.getByRole('link', { name: 'Gallery' }).click();
  await expectOn(page, 'gallery');
  await nav.getByRole('link', { name: 'About' }).click({ noWaitAfter: true });
  await page.evaluate(() => history.back()); // mid-fade
  await page.waitForTimeout(1500);
  const hash = (await page.evaluate(() => location.hash.slice(1)) || 'home') as R;
  await expectOn(page, hash);
});

test('hashchange (typed URL / in-page #link) switches the page', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { location.hash = 'policies'; });
  await expectOn(page, 'policies');
  await page.evaluate(() => { location.hash = 'contact'; });
  await expectOn(page, 'contact');
});

test('unknown and malformed hashes fall back to home without crashing', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/#does-not-exist');
  await expect(page).toHaveTitle(ROUTES.home.title);
  await expect(page.locator('main h1')).toHaveText(ROUTES.home.h1);
  await page.goto('/#%E0%A4%A'); // invalid percent-encoding
  await page.reload();
  await expect(page.locator('main h1')).toHaveText(ROUTES.home.h1);
  expect(problems.filter((p) => p.startsWith('pageerror'))).toEqual([]);
});

test('"Discover the resort" scrolls to the resort section', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Discover the resort' }).click();
  // lands under the 100px header offset set by `html { scroll-padding-top: 100px }`
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('the-resort')!.getBoundingClientRect().top)), { timeout: 5000 }).toBeLessThanOrEqual(101);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500);
});

test('repeated navigation does not accumulate window/document listeners or pins', async ({ page }) => {
  await page.addInitScript(() => {
    const live = new Map<string, Set<unknown>>();
    const key = (t: EventTarget, type: string) => (t === window ? 'w:' : 'd:') + type;
    const add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, fn: any, o?: any) {
      if ((this === window || this === document) && fn && !(o && o.once)) { const k = key(this, type); if (!live.has(k)) live.set(k, new Set()); live.get(k)!.add(fn); }
      return add.call(this, type, fn, o);
    };
    EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, fn: any, o?: any) {
      if (this === window || this === document) live.get(key(this, type))?.delete(fn);
      return rem.call(this, type, fn, o);
    };
    (window as any).__listeners = () => Object.fromEntries([...live].map(([k, v]) => [k, v.size]).filter(([, n]) => (n as number) > 0));
  });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  const cycle = async () => {
    for (const [l, r] of [['Accommodations', 'rooms'], ['Gallery', 'gallery'], ['Resort Overview', 'home']] as const) {
      await nav.getByRole('link', { name: l, exact: true }).click(); await expectOn(page, r);
    }
  };
  await cycle();
  const after1 = await page.evaluate(() => (window as any).__listeners());
  const pins1 = await page.locator('.pin-spacer').count();
  for (let i = 0; i < 4; i++) await cycle();
  const after5 = await page.evaluate(() => (window as any).__listeners());
  expect(after5).toEqual(after1);
  expect(await page.locator('.pin-spacer').count()).toBe(pins1);
  expect(pins1).toBe(1); // home: the resort stack only
});
