import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ROUTE_NAMES, url, expectOn, scrollThrough, watch } from './helpers';

test('every image srcset candidate and every font file resolves @smoke', async ({ page, request }) => {
  const found = new Set<string>();
  for (const r of ROUTE_NAMES) {
    await page.goto(url(r)); await expectOn(page, r);
    const srcs = await page.evaluate(() => [...document.images].flatMap((i) => [i.getAttribute('src')!, ...(i.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(' ')[0]).filter(Boolean)]));
    srcs.forEach((s) => found.add(new URL(s, page.url()).href));
  }
  const html = readFileSync('index.html', 'utf8');
  const fonts = [...html.matchAll(/url\('([^']+\.woff2)'\)/g)].map((m) => m[1]);
  expect(fonts).toHaveLength(8);
  fonts.forEach((f) => found.add(new URL(f, page.url()).href));
  const bad: string[] = [];
  for (const u of found) {
    const res = await request.get(u);
    const type = res.headers()['content-type'] || '';
    if (!res.ok() || !/^(image|font)\//.test(type)) bad.push(`${res.status()} ${type} ${u}`);
  }
  expect(bad).toEqual([]);
  expect(found.size).toBeGreaterThan(35);
});

test('no request fails or 404s while browsing every route', async ({ page }) => {
  const problems = watch(page);
  for (const r of ROUTE_NAMES) { await page.goto(url(r)); await expectOn(page, r); await scrollThrough(page, 1200); }
  expect(problems).toEqual([]);
});

test('declared width/height match the real image files', async ({ page }) => {
  await page.goto('/#gallery'); await scrollThrough(page, 600);
  const off = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth && i.getAttribute('width'))
    .filter((i) => Math.abs(+i.getAttribute('width')! / +i.getAttribute('height')! - i.naturalWidth / i.naturalHeight) > 0.02)
    .map((i) => `${i.currentSrc} attr ${i.getAttribute('width')}×${i.getAttribute('height')} real ${i.naturalWidth}×${i.naturalHeight}`));
  expect(off).toEqual([]);
});

test('below-the-fold images are lazy; the first hero slide is eager + high priority', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('.hero__slide').first().locator('img');
  await expect(hero).toHaveAttribute('loading', 'eager');
  await expect(hero).toHaveAttribute('fetchpriority', 'high');
  expect(await page.locator('.gal img[loading="lazy"]').count()).toBeGreaterThan(0);
});

// The preload (river-balcony) is the #booking hero and home's first resort panel, not home's first slide.
// Lighthouse trade-off measured and documented in docs/frontend_deployment.md §14; kept as-is.
test('preloaded image resolves and is used by home and #booking', async ({ page }) => {
  for (const r of ['/', '/#booking']) {
    await page.goto(r); await page.waitForLoadState('networkidle');
    const preload = await page.locator('link[rel="preload"][as="image"]').getAttribute('href');
    const used = await page.evaluate((p) => [...document.images].some((i) => (i.getAttribute('srcset') || i.src).includes(p!.replace(/-1600\.webp$/, ''))), preload);
    expect(used).toBe(true);
  }
});

test('fonts: preloads are real, all three families load', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => document.fonts.ready);
  await scrollThrough(page, 1500);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/"/g, '')} ${f.weight} ${f.style}`));
  for (const f of ['Cormorant Garamond 300 normal', 'Inter 400 normal', 'EB Garamond 400 normal', 'EB Garamond 400 italic'])
    expect(loaded).toContain(f);
  const preloads = await page.locator('link[rel="preload"][as="font"]').evaluateAll((l) => l.map((x) => (x as HTMLLinkElement).href));
  const used = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name));
  for (const p of preloads) expect(used).toContain(p);
});

test('UTF-8 text renders correctly (em dash, ₹, curly quotes) @smoke', async ({ page }) => {
  await page.goto('/#booking'); await expectOn(page, 'booking');
  expect(await page.evaluate(() => document.characterSet)).toBe('UTF-8');
  await expect(page).toHaveTitle(/ — /);
  const text = await page.evaluate(() => document.body.textContent!); // textContent: cards not yet revealed still count
  expect(text).toContain('₹5,000');
  await page.goto('/#restaurant'); await expectOn(page, 'restaurant');
  expect(await page.evaluate(() => document.body.textContent)).toContain('Sunriver Resort’s'); // curly apostrophe
  expect(text).not.toMatch(/â€|Ã|�/);
});
