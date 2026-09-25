import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--allow-file-access-from-files']
});
try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack));
  await page.goto(pathToFileURL(resolve('ui/index.html')).href);
  await page.waitForSelector('#homeDpiChips .chip');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'hoshino');
  assert.equal(await page.locator('.hoshino-edition').textContent(), ' - Touka Hoshino Special Edition');
  await page.setViewportSize({ width: 1920, height: 1024 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), 'maximized home should fit without a vertical scrollbar');
  await page.setViewportSize({ width: 1536, height: 1024 });
  assert.equal(await page.locator('#homeDpiChips .chip').count(), 6);
  assert.equal(await page.locator('#homeRateChips .chip').count(), 7);
  assert.equal(await page.locator('#buttonEditor .button-edit-row').count(), 5);
  assert.equal(await page.locator('#profileChips button').count(), 5);
  assert.equal(await page.locator('#profileSelectTop').count(), 0);
  const assignmentSelect = await page.locator('.assignment-row select').first().evaluate(element => ({ height: element.getBoundingClientRect().height, fontSize: parseFloat(getComputedStyle(element).fontSize), padding: parseFloat(getComputedStyle(element).paddingTop) }));
  assert.ok(assignmentSelect.height >= 42 && assignmentSelect.fontSize <= 15 && assignmentSelect.padding <= 5, 'button select text should have vertical clearance');
  const popupColors = await page.locator('#languageSelect option').nth(1).evaluate(option => ({ color: getComputedStyle(option).color, background: getComputedStyle(option).backgroundColor }));
  assert.deepEqual(popupColors, { color: 'rgb(23, 38, 50)', background: 'rgb(248, 250, 252)' });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'glass sweep should not create horizontal scrolling');
  const hero = page.locator('.hero');
  const sweep = await hero.evaluate(element => getComputedStyle(element, '::after').animationDuration);
  assert.equal(sweep, '8.5s');
  await hero.hover({ position: { x: 80, y: 80 } });
  assert.ok((await hero.getAttribute('style')).includes('--glow-x'), 'cursor spotlight should remain active');
  assert.equal(await page.locator('.dial-label').count(), 0);
  assert.equal(await page.locator('.dpi-dial .gauge-number').count(), 7);
  assert.equal(await page.locator('.rate-dial .gauge-number').count(), 7);
  assert.equal(await page.locator('.dpi-dial .gauge-tick').count(), 61);
  for (const block of await page.locator('.dial-block').all()) {
    const spacing = await block.evaluate(element => {
      const dial = element.querySelector('.dial').getBoundingClientRect();
      const chips = element.querySelector('.chip-row').getBoundingClientRect();
      return chips.top - dial.bottom;
    });
    assert.ok(spacing >= 8, 'gauge rim should leave clear space above its buttons');
  }
  for (const id of ['homeDpi', 'homeRate']) {
    const position = await page.locator(`#${id}`).evaluate(element => {
      const value = element.getBoundingClientRect();
      const core = element.parentElement.getBoundingClientRect();
      return { valueTop: value.top, hubBottom: core.top + core.height / 2 + 12 };
    });
    assert.ok(position.valueTop > position.hubBottom, `${id} should clear the fixed needle hub`);
  }
  for (const [language, heading] of [['zh-CN', '首页'], ['en', 'Home'], ['ja', 'ホーム'], ['ko', '홈']]) {
    await page.locator('#languageSelect').selectOption(language);
    assert.equal(await page.locator('.nav-item[data-page="home"] span').textContent(), heading);
    if (language === 'en') await page.screenshot({ path: 'ui-english-preview.png', fullPage: true });
    if (language === 'ko') await page.screenshot({ path: 'ui-korean-preview.png', fullPage: true });
  }
  await page.locator('#languageSelect').selectOption('zh-TW');
  await page.locator('#settingsTop').click();
  await page.locator('[data-theme-choice="light"]').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.screenshot({ path: 'ui-light-preview.png', fullPage: true });
  for (const theme of ['red', 'green', 'blue', 'lavender', 'banana', 'hoshino', 'cyberpunk', 'dark']) {
    await page.locator('#settingsTop').click();
    await page.locator(`[data-theme-choice="${theme}"]`).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    if (theme === 'blue') await page.screenshot({ path: 'ui-blue-preview.png', fullPage: true });
    if (theme === 'lavender' || theme === 'banana') await page.screenshot({ path: `ui-${theme}-preview.png`, fullPage: true });
    if (theme === 'hoshino') await page.screenshot({ path: 'ui-hoshino-preview.png', fullPage: true });
    if (theme === 'cyberpunk') { await page.waitForTimeout(650); await page.screenshot({ path: 'ui-cyberpunk-preview.png', fullPage: true }); }
  }
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.locator('#profileChips button').filter({ hasText: /^M2$/ }).click();
  const importedProfile = await page.evaluate(() => JSON.parse(localStorage.getItem('hxd-gaming-mouse-profiles-v1')).profiles[0]);
  await page.locator('#importFile').setInputFiles({ name: 'profile.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ profile: importedProfile })) });
  assert.equal(await page.locator('#profileChips button').count(), 5);
  assert.equal(await page.locator('#profileChips button.active').textContent(), 'M2');
  await page.getByRole('button', { name: 'DPI 設定' }).first().click();
  assert.equal(await page.locator('.page.active').getAttribute('data-page'), 'dpi');
  await page.getByRole('button', { name: '首頁' }).click();
  await page.locator('#homeRateChips .chip').filter({ hasText: /^2000$/ }).click();
  assert.equal(await page.locator('#homeRate').textContent(), '2000');
  await page.locator('.nav-item[data-page="info"]').click();
  assert.equal(await page.locator('#infoManufacturer').textContent(), 'Hua Xuan Design Co ., Ltd');
  await page.locator('.nav-item[data-page="lighting"]').click();
  assert.equal(await page.locator('.page.active').getAttribute('data-page'), 'lighting');
  await page.locator('input[name="lightingEffect"][value="breathing"]').check();
  await page.locator('[data-lighting-color="breathing"]').fill('#14c8f0');
  assert.equal(await page.locator('#lightingPreview').getAttribute('data-effect'), 'breathing');
  assert.equal(await page.locator('#lightingPreview').evaluate(element => element.style.getPropertyValue('--led-color')), '#14c8f0');
  await page.reload();
  assert.equal(await page.locator('input[name="lightingEffect"]:checked').inputValue(), 'breathing');
  assert.equal(await page.locator('[data-lighting-color="breathing"]').inputValue(), '#14c8f0');
  await page.locator('.nav-item[data-page="home"]').click();
  assert.deepEqual(errors, []);
  await page.screenshot({ path: 'ui-preview.png', fullPage: true });
  await page.setViewportSize({ width: 1050, height: 720 });
  for (const id of ['homeDpi', 'homeRate']) {
    const clear = await page.locator(`#${id}`).evaluate(element => {
      const value = element.getBoundingClientRect();
      const core = element.parentElement.getBoundingClientRect();
      return value.top > core.top + core.height / 2 + 12;
    });
    assert.ok(clear, `${id} should clear the hub at minimum window width`);
  }
  for (const [locale, expected] of [['ja-JP', 'ja'], ['ko-KR', 'ko'], ['fr-FR', 'en']]) {
    const context = await browser.newContext({ locale });
    const firstLaunch = await context.newPage();
    await firstLaunch.goto(pathToFileURL(resolve('ui/index.html')).href);
    await firstLaunch.waitForSelector('#homeDpiChips .chip');
    assert.equal(await firstLaunch.locator('#languageSelect').inputValue(), expected);
    await context.close();
  }
  console.log('UI smoke passed; screenshot saved to ui-preview.png');
} finally {
  await browser.close();
}

