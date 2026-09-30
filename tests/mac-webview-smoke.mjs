import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Reproduce the missing WebKit APIs that previously stopped Mac initialization.
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--allow-file-access-from-files']
});
try {
  const context = await browser.newContext({ viewport: { width: 1536, height: 1024 } });
  await context.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', { configurable: true, value: undefined });
    Object.defineProperty(window, 'structuredClone', { configurable: true, value: undefined });
    Object.defineProperty(Element.prototype, 'replaceChildren', { configurable: true, value: undefined });
    Object.defineProperty(File.prototype, 'text', { configurable: true, value: undefined });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve('ui/index.html')).href);
  await page.waitForSelector('#homeDpiChips .chip');
  assert.equal(await page.locator('#homeDpiChips .chip').count(), 6);
  assert.equal(await page.locator('#profileChips button').count(), 5);
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'hoshino');

  await page.locator('#settingsTop').click();
  await page.locator('[data-theme-choice="blue"]').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'blue');
  await page.locator('.nav-item[data-page="buttons"]').click();
  assert.equal(await page.locator('.page.active').getAttribute('data-page'), 'buttons');
  await page.locator('.nav-item[data-page="home"]').click();
  await page.locator('#profileChips button').filter({ hasText: /^M2$/ }).click();
  assert.equal(await page.locator('#profileChips button.active').textContent(), 'M2');
  await page.locator('#homeDpiChips .chip').filter({ hasText: /^1600$/ }).click();
  assert.equal(await page.locator('#homeDpi').textContent(), '1600');

  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('hxd-gaming-mouse-profiles-v1')).profiles[0]);
  await page.locator('#importFile').setInputFiles({ name: 'profile.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ profile })) });
  assert.equal(await page.locator('#profileChips button.active').textContent(), 'M2');
  assert.deepEqual(errors, []);

  const deniedStorage = await browser.newContext();
  await deniedStorage.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Denied', 'SecurityError'); } });
  });
  const fallbackPage = await deniedStorage.newPage();
  await fallbackPage.goto(pathToFileURL(resolve('ui/index.html')).href);
  await fallbackPage.waitForSelector('#profileChips button');
  await fallbackPage.locator('#settingsTop').click();
  await fallbackPage.locator('[data-theme-choice="green"]').click();
  assert.equal(await fallbackPage.locator('html').getAttribute('data-theme'), 'green');
  await deniedStorage.close();
  console.log('Mac WebView compatibility smoke passed');
} finally {
  await browser.close();
}
