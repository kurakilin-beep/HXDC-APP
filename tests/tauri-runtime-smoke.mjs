import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';

const executable = resolve(process.argv[2] || 'src-tauri/target/release/gaming-mouse-control-center.exe');
const port = 19337;
const app = spawn(executable, [], {
  windowsHide: true,
  stdio: 'ignore',
  env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}` }
});
let browser;
try {
  for (let attempt = 0; attempt < 25; attempt++) {
    try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 1500 }); break; }
    catch { await delay(700); }
  }
  if (!browser) throw new Error('Tauri WebView2 did not expose its test debugging port');
  const pages = browser.contexts().flatMap(context => context.pages());
  const page = pages.find(candidate => candidate.url().includes('tauri.localhost')) || pages[0];
  if (!page) throw new Error('No Tauri page found');
  await page.waitForSelector('#homeDpiChips .chip');
  const result = await page.evaluate(() => ({ title: document.title, origin: location.origin, secure: isSecureContext, nativeHid: !!window.__TAURI__?.core, profiles: document.querySelectorAll('#profileChips button').length, chips: document.querySelectorAll('#homeDpiChips .chip').length }));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('#profileChips button').filter({ hasText: /^M2$/ }).click();
  result.activeProfile = await page.locator('#profileChips button.active').textContent();
  result.pageErrors = errors;
  console.log(JSON.stringify(result, null, 2));
  await page.locator('#profileChips button').filter({ hasText: /^M1$/ }).click();
  await page.screenshot({ path: 'tauri-runtime-preview.png' });
  if (!result.secure || !result.nativeHid || result.profiles !== 5 || result.chips !== 6 || errors.length) process.exitCode = 1;
} finally {
  await browser?.close();
  app.kill();
}





