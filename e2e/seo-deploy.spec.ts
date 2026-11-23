import { test, expect } from '@playwright/test';
import { expectOn, watch } from './helpers';

test('head metadata and Resort JSON-LD @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Sunriver Resort/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Sunriver/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-IN');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld['@type']).toBe('Resort');
  expect(ld.address.postalCode).toBe('246127');
  expect(ld.url).toBe('https://sunriverresort.in/');
});

// KNOWN ISSUE: needs the production domain, which isn't decided yet. Remove .fixme once og:image is absolute.
test.fixme('og:image is an absolute URL (required by social preview crawlers)', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(/^https:\/\//);
});

test('crawler view: raw HTML has one title/description for every hash route', async ({ request }) => {
  // hash fragments never reach the server; a crawler without JS sees the same document for every route
  const a = await (await request.get('/')).text();
  expect(a).toContain('<title>Sunriver Resort — Riverside stays near Lansdowne</title>');
  expect(a).toContain('<div id="root"></div>'); // no prerendered content
});

test.describe('nested-path hosting (base "./")', () => {
  test.use({ baseURL: 'http://127.0.0.1:4174' });
  test('the build works from /nested/path/ with all assets and routes @smoke', async ({ page }) => {
    const problems = watch(page);
    await page.goto('/nested/path/');
    await expectOn(page, 'home');
    await page.goto('/nested/path/#gallery');
    await expectOn(page, 'gallery');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Resort Overview' }).click();
    await expectOn(page, 'home');
    expect(new URL(page.url()).pathname).toBe('/nested/path/'); // home keeps the sub-path
    await page.waitForLoadState('networkidle');
    expect(problems).toEqual([]);
    expect(await page.evaluate(() => [...document.images].filter((i) => i.complete && !i.naturalWidth).length)).toBe(0);
  });
});
