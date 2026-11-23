import { expect, type Page } from '@playwright/test';

/** Mirrors `routes` in src/router.tsx — routes.spec.ts asserts the two stay in sync. */
export const ROUTES = {
  home: { title: 'Sunriver Resort — Riverside stays near Lansdowne', h1: /Sunriver\s*Resort/ },
  rooms: { title: 'Rooms — Sunriver Resort', h1: /Rooms & suites/ },
  policies: { title: 'Policies — Sunriver Resort', h1: /Booking policies/ },
  'room-executive-hill-view': { title: 'Executive Room with Hill View — Sunriver Resort', h1: /Executive Room\s*with Hill View/ },
  'room-executive-river-view': { title: 'Executive Room with River View — Sunriver Resort', h1: /Executive Room\s*with River View/ },
  'room-family-suite': { title: 'Family Suite — Sunriver Resort', h1: /Family Suite/ },
  about: { title: 'About — Sunriver Resort', h1: /Welcome to\s*Sunriver Resort/ },
  restaurant: { title: 'Restaurant — Sunriver Resort', h1: /Enhancing life\s*around great food/ },
  wellness: { title: 'Wellness & Nature — Sunriver Resort', h1: /Rest, by\s*nature/ },
  gallery: { title: 'Gallery — Sunriver Resort', h1: /Moments at\s*Sunriver/ },
  contact: { title: 'Contact — Sunriver Resort', h1: /Have any\s*questions\?/ },
  booking: { title: 'Book your stay — Sunriver Resort', h1: /Check rates/ },
} as const;
export type R = keyof typeof ROUTES;
export const ROUTE_NAMES = Object.keys(ROUTES) as R[];
export const url = (r: R) => (r === 'home' ? '/' : '/#' + r);

/** Collects console errors/warnings, page errors and failed or 4xx/5xx same-origin requests. */
export function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => { if (r.url().startsWith('http://127.0.0.1')) problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`); });
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith('http://127.0.0.1')) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  return problems;
}

/** The visible page matches the URL hash, the title, and no curtain is covering it. */
export async function expectOn(page: Page, r: R) {
  if (r === 'home') await expect(page).toHaveURL((u) => u.hash === '' || u.hash === '#');
  else await expect(page).toHaveURL((u) => u.hash === '#' + r);
  await expect(page).toHaveTitle(ROUTES[r].title);
  await expect(page.locator('main h1')).toHaveText(ROUTES[r].h1);
  await expect(page.locator('.curtain')).toBeHidden();
}

/** Scroll the whole page in steps so every ScrollTrigger gets a chance to fire. */
export async function scrollThrough(page: Page, step = 500) {
  for (let i = 0; i < 400; i++) {
    const done = await page.evaluate((s) => { scrollBy(0, s); return innerHeight + scrollY >= document.documentElement.scrollHeight - 2; }, step);
    await page.waitForTimeout(40);
    if (done) break;
  }
  await page.waitForTimeout(1800); // longest reveal is ~2s
}

/** Elements that should be visible once revealed but are still hidden / masked. */
export async function stuckHidden(page: Page) {
  return page.evaluate(() => {
    const bad: string[] = [];
    const desc = (el: Element) => el.tagName.toLowerCase() + '.' + [...el.classList].join('.') + ' "' + (el.textContent || '').trim().slice(0, 40) + '"';
    document.querySelectorAll('main [data-reveal]').forEach((el) => {
      const s = getComputedStyle(el);
      if (+s.opacity < 0.99 || s.visibility === 'hidden') bad.push('reveal ' + desc(el));
    });
    document.querySelectorAll('main [data-lines] .ln > span').forEach((el) => {
      const t = new DOMMatrix(getComputedStyle(el).transform);
      if (Math.abs(t.m42) > 1) bad.push('line ' + desc(el));
    });
    document.querySelectorAll('main [data-img]').forEach((el) => {
      const c = getComputedStyle(el).clipPath;
      if (c && c !== 'none' && !/inset\(0(px|%)?( 0(px|%)?)*\)|inset\(0% 0% 0% 0%\)/.test(c)) bad.push('clip ' + desc(el) + ' ' + c);
    });
    return bad;
  });
}
