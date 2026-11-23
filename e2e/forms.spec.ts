import { test, expect, type Page } from '@playwright/test';
import { expectOn } from './helpers';

const form = (page: Page) => page.getByRole('form', { name: 'Send an enquiry' });
const field = (page: Page, label: string) => form(page).getByLabel(label, { exact: false });

async function open(page: Page) {
  await page.goto('/#contact');
  await expectOn(page, 'contact');
  await form(page).scrollIntoViewIfNeeded();
}

test('empty submit shows required-field errors and no mailto @smoke', async ({ page }) => {
  await open(page);
  await form(page).getByRole('button', { name: 'Prepare message' }).click();
  await expect(form(page).getByRole('alert')).toHaveText(['Please enter your name.', 'Enter an email address we can reply to.', 'Please add a little more detail (10+ characters).']);
  await expect(form(page).locator('[aria-invalid="true"]')).toHaveCount(3);
  await expect(form(page).locator('a[href^="mailto:"]')).toHaveCount(0);
});

test('email, phone and message validation', async ({ page }) => {
  await open(page);
  await field(page, 'Name').fill('Asha');
  await field(page, 'Message').fill('short');
  for (const bad of ['asha', 'asha@', 'asha@host', 'a b@c.in']) {
    await field(page, 'Email').fill(bad);
    await form(page).getByRole('button', { name: 'Prepare message' }).click();
    await expect(form(page).getByText('Enter an email address we can reply to.')).toBeVisible();
  }
  await field(page, 'Email').fill('asha@example.in');
  await field(page, 'Phone (optional)').fill('12');
  await form(page).getByRole('button', { name: 'Prepare message' }).click();
  await expect(form(page).getByText('That phone number looks incomplete.')).toBeVisible();
  await expect(form(page).getByText('Please add a little more detail (10+ characters).')).toBeVisible();
  await field(page, 'Phone (optional)').fill('+91 92580 34042');
  await field(page, 'Message').fill('A longer message.');
  await form(page).getByRole('button', { name: 'Prepare message' }).click();
  await expect(form(page).getByRole('alert')).toHaveCount(0);
  await expect(form(page).getByRole('status')).toContainText('info@sunriverresort.in');
});

test('mailto URL encodes special characters and multiline text exactly @smoke', async ({ page }) => {
  await open(page);
  const name = 'Zoë & Raj <test> #1 + 50%';
  const msg = 'Line one — with ₹5,000?\nLine two & more: a=b&c=d\n\n“Quoted” #hash';
  await field(page, 'Name').fill(name);
  await field(page, 'Email').fill('zoe+raj@example.co.uk');
  await field(page, 'Message').fill(msg);
  await form(page).getByRole('button', { name: 'Prepare message' }).click();
  const href = (await form(page).getByRole('link', { name: 'Open in email' }).getAttribute('href'))!;
  expect(href).toMatch(/^mailto:info@sunriverresort\.in\?subject=[^&#]*&body=[^&#]*$/); // only one separator, nothing unencoded
  const u = new URL(href);
  expect(u.searchParams.get('subject')).toBe('Enquiry from ' + name);
  expect(decodeURIComponent(href.split('&body=')[1])).toBe(`${msg}\n\n— ${name}\nzoe+raj@example.co.uk`);
});

test('editing after "Prepare message" withdraws the stale mailto', async ({ page }) => {
  await open(page);
  await field(page, 'Name').fill('Asha'); await field(page, 'Email').fill('a@b.in'); await field(page, 'Message').fill('Ten chars plus');
  await form(page).getByRole('button', { name: 'Prepare message' }).click();
  await expect(form(page).getByRole('link', { name: 'Open in email' })).toBeVisible();
  await field(page, 'Message').fill('Changed my mind about this');
  await expect(form(page).getByRole('link', { name: 'Open in email' })).toHaveCount(0);
});

test('"Copy message" works as the no-email-client fallback', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in Playwright');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  await field(page, 'Name').fill('Asha'); await field(page, 'Email').fill('a@b.in'); await field(page, 'Message').fill('Please call me back.');
  await form(page).getByRole('button', { name: 'Prepare message' }).click();
  await form(page).getByRole('button', { name: 'Copy message' }).click();
  await expect(form(page).getByRole('button', { name: 'Copied' })).toBeVisible();
  // Windows' clipboard stores \r\n
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe('To: info@sunriverresort.in\n\nPlease call me back.\n\n— Asha\na@b.in');
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true });
  test('form fields fit a 320px screen and are tappable', async ({ page }) => {
    await open(page);
    for (const l of ['Name', 'Email', 'Phone (optional)', 'Message']) {
      const b = (await field(page, l).boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(320);
      expect(b.height).toBeGreaterThanOrEqual(24);
    }
    await field(page, 'Name').tap();
    await expect(field(page, 'Name')).toBeFocused();
  });
});
