import { test, expect, type Page } from '@playwright/test';
import { expectOn } from './helpers';

const SEARCH = 'https://sunriverresort.in/search-results/';

// NB: a fixed clock also freezes GSAP's ticker (it reads Date.now), so reveal animations don't finish under it.
async function openBooking(page: Page, now?: string) {
  if (now) await page.clock.setFixedTime(new Date(now));
  // never reach the live booking engine from tests
  await page.context().route('https://sunriverresort.in/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }));
  await page.goto('/#booking');
  await expectOn(page, 'booking');
  return page.locator('.bpanel');
}
const dates = (p: ReturnType<Page['locator']>) => p.locator('.bf__field').first();
const guests = (p: ReturnType<Page['locator']>) => p.locator('.bf__field').nth(1);
const day = (page: Page, d: string) => page.locator(`.pop--cal [data-date="${d}"]`);
const params = (href: string | null) => { const u = new URL(href!); return { origin: u.origin + u.pathname, ...Object.fromEntries(u.searchParams) }; };

test.describe('date range calendar', () => {
  test('past dates disabled, month navigation bounded to the current month', async ({ page }) => {
    const panel = await openBooking(page, '2026-12-30T10:00:00');
    await dates(panel).click();
    await expect(page.getByRole('dialog', { name: 'Choose check-in and check-out dates' })).toBeVisible();
    await expect(day(page, '2026-12-29')).toBeDisabled();
    await expect(day(page, '2026-12-30')).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    await expect(page.locator('.cal__title')).toHaveText(['December 2026', 'January 2027']);
    await page.getByRole('button', { name: 'Next month' }).click();
    await expect(page.locator('.cal__title')).toHaveText(['January 2027', 'February 2027']);
    await expect(page.getByRole('button', { name: 'Previous month' })).toBeEnabled();
    await expect(day(page, '2027-02-28')).toHaveCount(1);
    await expect(day(page, '2027-02-29')).toHaveCount(0); // 2027 is not a leap year
  });

  test('year-end range produces the exact MotoPress search URL @smoke', async ({ page }) => {
    const panel = await openBooking(page, '2026-12-30T10:00:00');
    await dates(panel).click();
    await expect(page.locator('.cal__hint')).toHaveText('Select your check-in date');
    await day(page, '2026-12-31').click();
    await expect(page.locator('.cal__hint')).toHaveText('Now select your check-out date');
    await day(page, '2027-01-02').click();
    await expect(page.locator('.pop--cal')).toHaveCount(0); // closes after check-out
    await expect(dates(panel)).toBeFocused();
    await expect(dates(panel)).toContainText('31 Dec 2026 — 2 Jan 2027');
    await expect(panel.locator('.bpanel__sum')).toContainText('2 nights');
    const go = panel.getByRole('link', { name: 'Check rates' });
    await expect(go).toHaveAttribute('target', '_blank');
    await expect(go).toHaveAttribute('rel', /noopener/);
    expect(params(await go.getAttribute('href'))).toEqual({ origin: SEARCH, mphb_check_in_date: '2026-12-31', mphb_check_out_date: '2027-01-02', mphb_adults: '2', mphb_children: '0' });
    const [popup] = await Promise.all([page.waitForEvent('popup'), go.click()]);
    expect(popup.url()).toBe(SEARCH + '?mphb_check_in_date=2026-12-31&mphb_check_out_date=2027-01-02&mphb_adults=2&mphb_children=0');
  });

  test('leap day and month-end boundary (Feb 2028)', async ({ page }) => {
    const panel = await openBooking(page, '2028-02-27T09:00:00');
    await dates(panel).click();
    await day(page, '2028-02-29').click();
    await day(page, '2028-03-01').click();
    await expect(panel.locator('.bpanel__sum')).toContainText('1 night ·');
    expect(params(await panel.getByRole('link', { name: 'Check rates' }).getAttribute('href'))).toMatchObject({ mphb_check_in_date: '2028-02-29', mphb_check_out_date: '2028-03-01' });
  });

  test('check-out on/before check-in restarts the range (no zero/negative nights)', async ({ page }) => {
    const panel = await openBooking(page, '2027-03-01T09:00:00');
    await dates(panel).click();
    await day(page, '2027-03-10').click();
    await day(page, '2027-03-05').click(); // earlier → becomes the new check-in
    await expect(page.locator('.pop--cal')).toBeVisible();
    await expect(page.locator('.cal__hint')).toHaveText('Now select your check-out date');
    await expect(day(page, '2027-03-05')).toHaveAttribute('aria-pressed', 'true');
    await day(page, '2027-03-05').click(); // same day → still check-in
    await expect(page.locator('.pop--cal')).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Check rates' })).toHaveCount(0);
    await day(page, '2027-03-08').click();
    await expect(panel.locator('.bpanel__sum')).toContainText('3 nights');
  });

  test('no booking link exists until both dates are chosen; clearing removes it', async ({ page }) => {
    const panel = await openBooking(page, '2027-03-01T09:00:00');
    await expect(panel.getByRole('link', { name: 'Check rates' })).toHaveCount(0);
    await panel.getByRole('button', { name: 'Check rates' }).click({ force: true }); // aria-disabled, but opens the picker
    await expect(page.locator('.pop--cal')).toBeVisible();
    await day(page, '2027-03-10').click(); await day(page, '2027-03-12').click();
    await expect(panel.getByRole('link', { name: 'Check rates' })).toHaveCount(1);
    await dates(panel).click();
    await page.getByRole('button', { name: 'Clear dates' }).click();
    await expect(panel.getByRole('link', { name: 'Check rates' })).toHaveCount(0);
    expect(await page.locator(`a[href^="${SEARCH}"]`).count()).toBe(0);
  });

  test('Escape and outside click dismiss the calendar and return focus', async ({ page }) => {
    const panel = await openBooking(page, '2027-03-01T09:00:00');
    await dates(panel).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.pop--cal')).toHaveCount(0);
    await expect(dates(panel)).toBeFocused();
    await dates(panel).click();
    await page.mouse.click(5, 450);
    await expect(page.locator('.pop--cal')).toHaveCount(0);
  });

  test('keyboard: arrows move across days and months, Enter selects, grid reachable by Tab', async ({ page }) => {
    const panel = await openBooking(page, '2027-03-30T09:00:00');
    await dates(panel).click();
    await expect(day(page, '2027-03-30')).toBeFocused(); // opens on today
    await page.keyboard.press('ArrowRight'); await expect(day(page, '2027-03-31')).toBeFocused();
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
    await expect(day(page, '2027-03-30')).toBeFocused(); // past day blocked
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown'); // 42 days → May, beyond the two visible months
    await expect(day(page, '2027-05-11')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(panel.locator('.bpanel__sum')).toContainText('2 nights');
    // re-open; Tab out of the grid and back in must land on a day again
    await dates(panel).click();
    await expect(page.locator('.pop--cal .cal__day:focus')).toHaveCount(1);
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Next month' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.pop--cal .cal__day:focus')).toHaveCount(1);
  });

  for (const tz of ['Asia/Kolkata', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
    test.describe(tz, () => {
      test.use({ timezoneId: tz });
      test(`dates use the visitor's local calendar day (${tz})`, async ({ page }) => {
        const instant = new Date('2027-01-31T18:00:00Z'); // Jan 31 in Kolkata/LA, already Feb 1 in Kiritimati
        const local = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
        const todayLocal = local(instant), tomorrow = local(new Date(+instant + 86400000)), yesterday = local(new Date(+instant - 86400000));
        const panel = await openBooking(page, instant.toISOString());
        await dates(panel).click();
        await expect(day(page, todayLocal)).toBeEnabled();
        if (await day(page, yesterday).count()) await expect(day(page, yesterday)).toBeDisabled(); // else outside the visible months
        await day(page, todayLocal).click(); await day(page, tomorrow).click();
        expect(params(await panel.getByRole('link', { name: 'Check rates' }).getAttribute('href'))).toMatchObject({ mphb_check_in_date: todayLocal, mphb_check_out_date: tomorrow });
      });
    });
  }
});
test.describe('room & guests', () => {
  test('steppers respect min/max and room capacity; counts flow into URL and summary @smoke', async ({ page }) => {
    const panel = await openBooking(page, '2027-03-01T09:00:00');
    await guests(panel).click();
    const more = page.getByRole('button', { name: 'More adults' }), fewer = page.getByRole('button', { name: 'Fewer adults' });
    await fewer.click();
    await expect(fewer).toBeDisabled(); // min 1
    for (let i = 0; i < 15; i++) if (await more.isEnabled()) await more.click();
    await expect(page.locator('.step').first().locator('output')).toHaveText('12');
    await expect(more).toBeDisabled(); // any room: max 12
    await page.getByRole('radio', { name: /Executive Room with Hill View/ }).check();
    await expect(page.locator('.step').first().locator('output')).toHaveText('2'); // clamped to room capacity
    await expect(more).toBeDisabled();
    const kids = page.getByRole('button', { name: 'More children' });
    for (let i = 0; i < 12; i++) if (await kids.isEnabled()) await kids.click();
    await expect(page.locator('.step').nth(1).locator('output')).toHaveText('10');
    await expect(kids).toBeDisabled();
    await page.getByRole('button', { name: 'Fewer children' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(guests(panel)).toBeFocused();
    await expect(guests(panel)).toContainText('Hill View — 2 Adults, 9 Children');
    await dates(panel).click(); await day(page, '2027-03-10').click(); await day(page, '2027-03-13').click();
    await expect(panel.locator('.bpanel__sum')).toContainText('Listed rate from ₹5,000 per night — about ₹15,000');
    expect(params(await panel.getByRole('link', { name: 'Check rates' }).getAttribute('href'))).toMatchObject({ mphb_adults: '2', mphb_children: '9' });
  });

  test('"Email this request" mailto carries the selection', async ({ page }) => {
    const panel = await openBooking(page, '2027-03-01T09:00:00');
    await dates(panel).click(); await day(page, '2027-03-10').click(); await day(page, '2027-03-12').click();
    const href = await panel.getByRole('link', { name: 'Email this request' }).getAttribute('href');
    const u = new URL(href!);
    expect(u.protocol + u.pathname).toBe('mailto:reservations@sunriverresort.in');
    expect(u.searchParams.get('subject')).toBe('Booking request');
    expect(u.searchParams.get('body')).toContain('Check-in: 10 Mar 2027\nCheck-out: 12 Mar 2027\nAdults: 2\nChildren: 0');
  });

  test('room detail "Check rates" prefills the room', async ({ page }) => {
    await page.goto('/#room-family-suite');
    await page.locator('.rd__card').getByRole('link', { name: 'Check rates' }).click();
    await expectOn(page, 'booking');
    await expect(guests(page.locator('.bpanel'))).toContainText('Family Suite — 2 Adults');
  });

  test('"Book" on a room card while already on #booking selects that room', async ({ page }) => {
    const panel = await openBooking(page);
    const card = page.locator('.rcard').filter({ hasText: 'Family Suite' });
    await card.scrollIntoViewIfNeeded(); await expect(card).toBeVisible();
    await card.getByRole('link', { name: 'Book' }).click();
    await expect(guests(panel)).toContainText('Family Suite — 2 Adults');
    // raise to 5 adults, then pick a 2-adult room from its card: adults are clamped to capacity
    await guests(panel).click();
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'More adults' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(guests(panel)).toContainText('Family Suite — 5 Adults');
    await page.locator('.rcard').filter({ hasText: 'Hill View' }).getByRole('link', { name: 'Book' }).click();
    await expect(guests(panel)).toContainText('Hill View — 2 Adults');
  });
});

test.describe('mobile booking', () => {
  test.use({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
  test('single-month calendar fits the viewport and completes a booking URL', async ({ page }) => {
    const panel = await openBooking(page, '2027-03-01T09:00:00');
    await dates(panel).tap();
    await expect(page.locator('.cal__month')).toHaveCount(1);
    const box = (await page.locator('.pop--cal').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    const cell = (await day(page, '2027-03-10').boundingBox())!;
    expect(Math.min(cell.width, cell.height)).toBeGreaterThanOrEqual(24); // WCAG 2.2 target size (minimum)
    await day(page, '2027-03-10').tap(); await day(page, '2027-03-11').tap();
    expect(params(await panel.getByRole('link', { name: 'Check rates' }).getAttribute('href'))).toMatchObject({ mphb_check_in_date: '2027-03-10', mphb_check_out_date: '2027-03-11' });
  });
});
