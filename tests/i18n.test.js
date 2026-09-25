import test from 'node:test';
import assert from 'node:assert/strict';
import { systemLanguage } from '../ui/i18n.js';

test('first-launch language follows OS locale with English fallback', () => {
  assert.equal(systemLanguage(['zh-TW']), 'zh-TW');
  assert.equal(systemLanguage(['zh-HK']), 'zh-TW');
  assert.equal(systemLanguage(['zh-CN']), 'zh-CN');
  assert.equal(systemLanguage(['zh-SG']), 'zh-CN');
  assert.equal(systemLanguage(['ja-JP']), 'ja');
  assert.equal(systemLanguage(['ko-KR']), 'ko');
  assert.equal(systemLanguage(['en-US']), 'en');
  assert.equal(systemLanguage(['fr-FR', 'zh-TW']), 'en');
});
