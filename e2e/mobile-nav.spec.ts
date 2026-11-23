import { test, expect } from '@playwright/test';
import { expectOn } from './helpers';

test.use({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });

test('menu opens, focuses close, navigates and closes; scroll lock released @smoke', async ({ page }) => {
  await page.goto('/');
  const burger = page.getByRole('button', { name: 'Menu' });
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden(); // desktop nav hidden ≤1180px
  await burger.tap();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Close menu' })).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await menu.getByRole('link', { name: 'Gallery' }).tap();
  await expectOn(page, 'gallery');
  await expect(menu).toBeHidden();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('choosing the current page in the menu closes it', async ({ page }) => {
  await page.goto('/#gallery');
  await page.getByRole('button', { name: 'Menu' }).tap();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await menu.getByRole('link', { name: 'Gallery' }).tap();
  await expect(menu).toBeHidden();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('Escape closes the menu and returns focus to the burger; Tab stays inside', async ({ page }) => {
  await page.goto('/');
  const burger = page.getByRole('button', { name: 'Menu' });
  await burger.click();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#menu'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(burger).toBeFocused();
});

test('mobile Check rates bar goes to booking and is hidden there', async ({ page }) => {
  await page.goto('/');
  await page.locator('.mbar').getByRole('button', { name: 'Check rates' }).tap();
  await expectOn(page, 'booking');
  await expect(page.locator('.mbar')).toHaveCount(0);
});

test('header turns solid after scrolling and stays on screen', async ({ page }) => {
  await page.goto('/#about');
  await expect(page.locator('.hdr')).not.toHaveClass(/hdr--solid/);
  await page.evaluate(() => scrollTo(0, 600));
  await expect(page.locator('.hdr')).toHaveClass(/hdr--solid/);
  const b = (await page.locator('.hdr__main').boundingBox())!;
  expect(b.y).toBeGreaterThanOrEqual(-1);
  expect(b.y).toBeLessThan(60);
});
