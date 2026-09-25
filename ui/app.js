import { GamingMouseDevice } from './device.js';
import { DEFAULT_DPI, REPORT_RATES, STAGE_COLORS } from './protocol.js';
import { LANGUAGES, systemLanguage, translate } from './i18n.js';

const $ = id => document.getElementById(id);
const device = new GamingMouseDevice();
const textSources = new WeakMap();
const attributeSources = new WeakMap();
const t = text => translate(text, $('languageSelect')?.value || 'zh-TW');
const STORAGE_KEY = 'hxd-gaming-mouse-profiles-v1';
const MOUSE_BUTTONS = ['左鍵', '右鍵', '中鍵', '側鍵 1', '側鍵 2'];
const STAGE_NAMES = ['紅色', '綠色', '藍色', '黃色', '青色', '紫色'];
const KEYBOARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((label, i) => ({ label, cat: 'kb', val: i + 4 }));
KEYBOARD.push(...'1234567890'.split('').map((label, i) => ({ label, cat: 'kb', val: i + 0x1e })));
KEYBOARD.push(...[['Enter', 0x28], ['Esc', 0x29], ['Backspace', 0x2a], ['Tab', 0x2b], ['Space', 0x2c], ['F1', 0x3a], ['F2', 0x3b], ['F3', 0x3c], ['F4', 0x3d], ['F5', 0x3e], ['F6', 0x3f], ['F7', 0x40], ['F8', 0x41], ['F9', 0x42], ['F10', 0x43], ['F11', 0x44], ['F12', 0x45]].map(([label, val]) => ({ label, cat: 'kb', val })));
const MOUSE_KEYS = [['左鍵', 1], ['右鍵', 2], ['中鍵', 4], ['前進', 8], ['後退', 16]].map(([label, val]) => ({ label, cat: 'ms', val }));
const MEDIA_KEYS = [['音量＋', 0xe9], ['音量－', 0xea], ['靜音', 0xe2], ['播放／暫停', 0xcd], ['下一首', 0xb5], ['上一首', 0xb6]].map(([label, val]) => ({ label, cat: 'media', val }));
const OPTIONS = [...MOUSE_KEYS, ...KEYBOARD, ...MEDIA_KEYS];
const DEFAULT_ASSIGNMENTS = MOUSE_KEYS.map(({ label, cat, val }) => ({ label, cat, val }));
let profiles = [];
let activeId = '';
let editingSteps = [];
let busy = false;
let toastTimer;
let gaugeTimer;
let suppressProbeUntil = 0;
function scheduleGaugeWrite() {
  clearTimeout(gaugeTimer);
  if (!device.connected) return;
  gaugeTimer = setTimeout(() => work('DPI／回報率寫入', () => device.writeNv1(active().rate, active().stage)), 500);
}

function defaultProfile(name = 'M1') {
  return { id: crypto.randomUUID(), name, rate: 1000, stage: 0, dpi: [...DEFAULT_DPI], assignments: structuredClone(DEFAULT_ASSIGNMENTS), macros: {} };
}
function validProfile(profile) {
  return profile && typeof profile.name === 'string' && Array.isArray(profile.dpi) && profile.dpi.length === 6 && Array.isArray(profile.assignments) && profile.assignments.length === 5;
}
function loadProfiles() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(data?.profiles) && data.profiles.some(validProfile)) {
      profiles = Array.from({ length: 5 }, (_, index) => {
        const profile = data.profiles[index];
        return validProfile(profile) ? { ...profile, name: `M${index + 1}` } : defaultProfile(`M${index + 1}`);
      });
      activeId = profiles.some(p => p.id === data.activeId) ? data.activeId : profiles[0].id;
      persist();
      return;
    }
  } catch (error) { console.warn('Profile load failed:', error); }
  profiles = Array.from({ length: 5 }, (_, i) => defaultProfile(`M${i + 1}`));
  activeId = profiles[0].id;
  persist();
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeId, profiles })); }
function active() { return profiles.find(p => p.id === activeId) || profiles[0]; }
function notify(message, error = false) {
  const el = $('toast');
  el.textContent = message;
  el.className = `show${error ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3800);
}
async function work(label, operation) {
  if (busy) return;
  busy = true;
  document.body.classList.add('busy');
  $('saveDevice').disabled = true;
  try { await operation(); notify(`${t(label)} ${t('完成')}`); }
  catch (error) { notify(`${t(label)} ${t('失敗')}：${t(error.message)}`, true); }
  finally { busy = false; document.body.classList.remove('busy'); $('saveDevice').disabled = false; }
}
function optionValue(item) { return `${item.cat}:${item.val}`; }
function parseOption(value) {
  const [cat, raw] = value.split(':');
  const val = Number(raw);
  return OPTIONS.find(o => o.cat === cat && o.val === val);
}
function populateAssignmentSelect(select, current, index) {
  select.replaceChildren();
  const addGroup = (name, items) => {
    const group = document.createElement('optgroup');
    group.label = name;
    for (const item of items) {
      const option = new Option(item.label, optionValue(item));
      group.appendChild(option);
    }
    select.appendChild(group);
  };
  addGroup('滑鼠', MOUSE_KEYS);
  addGroup('鍵盤', KEYBOARD);
  addGroup('多媒體', MEDIA_KEYS);
  if (current?.kind === 'macro' && active().macros[index]) select.add(new Option(`巨集 (${active().macros[index].steps.length} 動作)`, 'macro'));
  select.value = current?.kind === 'macro' ? 'macro' : optionValue(current || DEFAULT_ASSIGNMENTS[index]);
  select.addEventListener('change', () => {
    if (select.value === 'macro') return;
    const selected = parseOption(select.value);
    if (!selected) return;
    active().assignments[index] = { ...selected };
    delete active().macros[index];
    persist();
    renderAssignments();
  });
}
function assignmentRow(index) {
  const row = document.createElement('div');
  row.className = 'assignment-row';
  const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = index + 1;
  const label = document.createElement('label'); label.textContent = MOUSE_BUTTONS[index];
  const select = document.createElement('select'); select.setAttribute('aria-label', `${MOUSE_BUTTONS[index]} 功能`);
  populateAssignmentSelect(select, active().assignments[index], index);
  row.append(badge, label, select);
  return row;
}
function renderAssignments() {
  $('homeAssignmentLeft').replaceChildren(...[0, 3, 4].map(assignmentRow));
  $('homeAssignmentRight').replaceChildren(...[1, 2].map(assignmentRow));
  const editor = $('buttonEditor'); editor.replaceChildren();
  for (let i = 0; i < 5; i++) {
    const row = document.createElement('div'); row.className = 'button-edit-row';
    const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = i + 1;
    const label = document.createElement('strong'); label.textContent = MOUSE_BUTTONS[i];
    const select = document.createElement('select'); select.setAttribute('aria-label', `${MOUSE_BUTTONS[i]} 功能`);
    populateAssignmentSelect(select, active().assignments[i], i);
    row.append(badge, label, select); editor.appendChild(row);
  }
  applyLanguage();
}
function renderProfiles() {
  const chips = $('profileChips');
  chips.replaceChildren();
  for (const profile of profiles) {
    const button = document.createElement('button');
    button.textContent = profile.name;
    button.classList.toggle('active', profile.id === activeId);
    button.addEventListener('click', () => selectProfile(profile.id));
    chips.appendChild(button);
  }
}
const gaugePoint = (angle, radius) => {
  const radians = angle * Math.PI / 180;
  return [200 + Math.sin(radians) * radius, 200 - Math.cos(radians) * radius];
};
function gaugeArc(endAngle, radius) {
  const points = [];
  for (let angle = -120; angle <= endAngle; angle += 2) points.push(gaugePoint(angle, radius));
  points.push(gaugePoint(endAngle, radius));
  return points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}
function renderGaugeFace(root, labels, fraction) {
  const ticks = Array.from({ length: 61 }, (_, index) => {
    const angle = -120 + index * 4;
    const major = index % 10 === 0;
    const [x1, y1] = gaugePoint(angle, major ? 149 : 157);
    const [x2, y2] = gaugePoint(angle, 166);
    return `<line class="gauge-tick${major ? ' major' : ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join('');
  const numbers = labels.map((label, index) => {
    const [x, y] = gaugePoint(-120 + index * 40, 124);
    return `<text class="gauge-number" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${label}</text>`;
  }).join('');
  root.innerHTML = `<path class="gauge-track" d="${gaugeArc(120, 177)}"/><path class="gauge-progress" pathLength="100" d="${gaugeArc(-120 + Math.max(.01, Math.min(1, fraction)) * 240, 177)}"/>${ticks}${numbers}`;
}
function formatGaugeTick(value) {
  if (value < 1000) return String(value);
  return `${Number((value / 1000).toFixed(1))}K`;
}
function renderGauges() {
  const profile = active();
  $('homeDpi').textContent = profile.dpi[profile.stage];
  $('homeRate').textContent = profile.rate;
  $('homeDpiChips').replaceChildren();
  profile.dpi.forEach((value, index) => {
    const chip = document.createElement('button'); chip.className = `chip${index === profile.stage ? ' active' : ''}`; chip.textContent = value;
    chip.addEventListener('click', () => { profile.stage = index; persist(); renderGauges(); scheduleGaugeWrite(); });
    $('homeDpiChips').appendChild(chip);
  });
  $('homeRateChips').replaceChildren();
  REPORT_RATES.forEach(rate => {
    for (const [container, className, suffix] of [[$('homeRateChips'), 'chip', '']]) {
      const chip = document.createElement('button'); chip.className = `${className}${rate === profile.rate ? ' active' : ''}`; chip.textContent = rate + suffix;
      chip.addEventListener('click', () => { profile.rate = rate; persist(); renderGauges(); scheduleGaugeWrite(); });
      container.appendChild(chip);
    }
  });
  document.querySelector('.dpi-dial .needle').style.transform = `rotate(${-125 + profile.stage * 50}deg)`;
  document.querySelector('.rate-dial .needle').style.transform = `rotate(${-125 + REPORT_RATES.indexOf(profile.rate) * (250 / (REPORT_RATES.length - 1))}deg)`;
  const dpiMax = Math.max(12000, ...profile.dpi);
  renderGaugeFace(document.querySelector('.dpi-dial .gauge-face'), Array.from({ length: 7 }, (_, index) => formatGaugeTick(Math.round(dpiMax * index / 600) * 100)), profile.dpi[profile.stage] / dpiMax);
  renderGaugeFace(document.querySelector('.rate-dial .gauge-face'), ['125', '250', '500', '1K', '2K', '4K', '8K'], REPORT_RATES.indexOf(profile.rate) / (REPORT_RATES.length - 1));
  applyLanguage();
}
function renderDpiEditor() {
  const root = $('dpiEditor'); root.replaceChildren();
  active().dpi.forEach((value, index) => {
    const box = document.createElement('div'); box.className = 'dpi-stage';
    const title = document.createElement('strong'); title.textContent = `STAGE ${index + 1}`;
    const marker = document.createElement('small'); marker.textContent = 'NV2';
    const label = document.createElement('label'); label.textContent = 'DPI';
    const input = document.createElement('input'); input.type = 'number'; input.min = '200'; input.max = '30000'; input.step = '200'; input.value = value;
    input.addEventListener('change', () => {
      const next = Number(input.value);
      if (!Number.isInteger(next) || next < 200 || next > 30000 || next % 200 !== 0) { input.value = active().dpi[index]; return notify(t('DPI 需為 200–30000 且以 200 遞增。'), true); }
      active().dpi[index] = next; persist(); renderGauges();
    });
    const color = document.createElement('div'); color.className = 'dpi-color'; color.innerHTML = `<span class="swatch" style="--color:${STAGE_COLORS[index]}"></span>${STAGE_NAMES[index]} · 固定色`;
    box.append(title, marker, label, input, color); root.appendChild(box);
  });
}
function renderMacro() {
  const root = $('macroSteps'); root.replaceChildren();
  if (!editingSteps.length) { const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = '尚無動作。加入按下、放開或延遲。'; root.appendChild(empty); applyLanguage(); return; }
  editingSteps.forEach((step, index) => {
    const item = document.createElement('span'); item.className = 'macro-step';
    const label = document.createElement('span'); label.textContent = `${index + 1}. ${t(step.action === 'make' ? '按下' : step.action === 'break' ? '放開' : '延遲')} ${t(step.name || String(step.val))}${step.action === 'delay' ? ' ms' : ''}`;
    const remove = document.createElement('button'); remove.textContent = '×'; remove.title = '移除動作'; remove.addEventListener('click', () => { editingSteps.splice(index, 1); renderMacro(); });
    item.append(label, remove); root.appendChild(item);
  });
  applyLanguage();
}
function renderTrace() {
  $('traceView').textContent = device.trace.slice(-30).map(item => {
    const bytes = item.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    return `${item.time} ${item.direction} ID:${item.reportId} ${item.status || ''}\n${bytes}`;
  }).join('\n\n');
}
function renderConnection() {
  const connected = device.connected;
  $('connectButton').classList.toggle('connected', connected);
  $('connectionLabel').textContent = connected ? '已連接' : '未連接';
  $('infoStatus').textContent = connected ? '已連接' : '未連接';
  $('infoConnect').textContent = connected ? '中斷連線' : '連接裝置';
  $('infoVidPid').textContent = connected ? `${device.device.vendorId.toString(16).toUpperCase().padStart(4, '0')} : ${device.device.productId.toString(16).toUpperCase().padStart(4, '0')}` : '062A : 8000 / 8001 / 8002';
  $('infoReportId').textContent = connected ? device.reportId : '—';
  $('infoManufacturer').textContent = 'Hua Xuan Design Co ., Ltd';
  $('infoProduct').textContent = connected ? device.device.productName || '—' : '—';
  applyLanguage();
}
function renderAll() { renderProfiles(); renderAssignments(); renderDpiEditor(); renderGauges(); renderMacro(); renderConnection(); renderTrace(); applyLanguage(); }
function selectProfile(id) {
  if (!profiles.some(p => p.id === id)) return;
  activeId = id; editingSteps = []; persist(); renderAll();
}
function switchPage(page) {
  document.querySelectorAll('.page').forEach(node => node.classList.toggle('active', node.dataset.page === page));
  document.querySelectorAll('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.page === page));
}
const LIGHTING_DEMO_KEY = 'hxd-lighting-demo-v1';
const LIGHTING_NAMES = { solid: '單色', breathing: '呼吸', cycle: '多彩循環', flow: '流光' };
function initLightingDemo() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(LIGHTING_DEMO_KEY)) || {}; } catch { /* Use demo defaults. */ }
  for (const picker of document.querySelectorAll('[data-lighting-color]')) {
    const color = saved.colors?.[picker.dataset.lightingColor];
    if (/^#[0-9a-f]{6}$/i.test(color || '')) picker.value = color;
  }
  const selected = document.querySelector(`input[name="lightingEffect"][value="${saved.effect}"]`);
  if (selected) selected.checked = true;
  const render = () => {
    const effect = document.querySelector('input[name="lightingEffect"]:checked').value;
    const color = document.querySelector(`[data-lighting-color="${effect}"]`).value;
    const preview = $('lightingPreview');
    preview.dataset.effect = effect;
    preview.style.setProperty('--led-color', color);
    $('lightingPreviewName').textContent = t(LIGHTING_NAMES[effect]);
    document.querySelectorAll('.lighting-effect').forEach(row => row.classList.toggle('active', row.querySelector('input[type="radio"]').checked));
    localStorage.setItem(LIGHTING_DEMO_KEY, JSON.stringify({ effect, colors: Object.fromEntries([...document.querySelectorAll('[data-lighting-color]')].map(picker => [picker.dataset.lightingColor, picker.value])) }));
  };
  $('lightingEffects').addEventListener('input', render);
  $('lightingEffects').addEventListener('change', render);
  $('languageSelect').addEventListener('change', render);
  render();
}
async function toggleConnection() {
  await work(device.connected ? '中斷連線' : '連接裝置', async () => {
    if (device.connected) { await device.disconnect(); suppressProbeUntil = Date.now() + 10000; }
    else { const connected = await device.connect(); if (!connected) throw new Error('沒有選取裝置'); }
  });
}
async function writeAllButtons(profile = active()) {
  for (let index = 0; index < 5; index++) {
    const assignment = profile.assignments[index];
    if (assignment.kind === 'macro') {
      const macro = profile.macros[index];
      if (!macro) throw new Error(`按鍵 ${index + 1} 的巨集資料不存在`);
      await device.writeMacro(index, macro.steps, macro.repetitions);
    } else await device.writeMacro(index, [{ action: 'make', cat: assignment.cat, val: Number(assignment.val) }], 1);
  }
}
function download(name, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function importProfile(raw) {
  const incoming = raw?.profile || raw;
  if (incoming?.payload) {
    const old = incoming.payload;
    const profile = defaultProfile(incoming.name || 'Imported');
    profile.dpi = old.nv2?.map(item => Number(item.dpi)) || profile.dpi;
    const oldRate = Number(old.nv1?.rate);
    profile.rate = REPORT_RATES.includes(8000 / oldRate) ? 8000 / oldRate : profile.rate;
    profile.stage = Number(old.nv1?.stage) || 0;
    if (Array.isArray(old.macro?.steps) && Number.isInteger(old.macro?.btnIndex)) {
      const index = old.macro.btnIndex;
      profile.macros[index] = { steps: old.macro.steps, repetitions: Number(old.macro.loop) || 1 };
      profile.assignments[index] = { kind: 'macro', label: '巨集' };
    }
    return profile;
  }
  if (!validProfile(incoming)) throw new Error('設定檔格式不正確');
  return { ...incoming, id: crypto.randomUUID(), name: String(incoming.name).slice(0, 30), macros: incoming.macros || {} };
}
function initMacroControls() {
  $('macroButton').replaceChildren(...MOUSE_BUTTONS.map((name, i) => new Option(`${i + 1} · ${name}`, i)));
  const updateValues = () => {
    const cat = $('macroCategory').value;
    const items = cat === 'ms' ? MOUSE_KEYS : cat === 'media' ? MEDIA_KEYS : KEYBOARD;
    $('macroValue').replaceChildren(...items.map(item => new Option(item.label, item.val)));
  };
  $('macroCategory').addEventListener('change', updateValues); updateValues();
  $('macroAction').addEventListener('change', () => {
    const delay = $('macroAction').value === 'delay';
    $('macroCategoryField').classList.toggle('hidden', delay);
    $('macroValueField').classList.toggle('hidden', delay);
    $('macroDelayField').classList.toggle('hidden', !delay);
  });
  $('macroButton').addEventListener('change', () => {
    const macro = active().macros[$('macroButton').value];
    editingSteps = macro ? structuredClone(macro.steps) : [];
    $('macroRepeats').value = macro?.repetitions ?? 1;
    renderMacro();
  });
}
function bindEvents() {
  document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => switchPage(button.dataset.page)));
  const closeThemeMenu = () => {
    $('themeMenu').hidden = true;
    $('settingsTop').setAttribute('aria-expanded', 'false');
  };
  $('settingsTop').addEventListener('click', () => {
    const opening = $('themeMenu').hidden;
    $('themeMenu').hidden = !opening;
    $('settingsTop').setAttribute('aria-expanded', String(opening));
  });
  $('themeMenu').querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
    setTheme(button.dataset.themeChoice);
    closeThemeMenu();
  }));
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.theme-picker')) closeThemeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeThemeMenu();
  });
  $('connectButton').addEventListener('click', toggleConnection);
  $('infoConnect').addEventListener('click', toggleConnection);
  $('resetHome').addEventListener('click', () => {
    if (!confirm(t('將目前設定檔恢復預設值？尚未寫入裝置。'))) return;
    const replacement = defaultProfile(active().name);
    replacement.id = activeId;
    profiles[profiles.findIndex(p => p.id === activeId)] = replacement;
    persist(); renderAll(); notify(t('設定檔已恢復預設；需按「儲存到裝置」才會寫入滑鼠。'));
  });
  $('writeDpi').addEventListener('click', () => work('DPI 寫入', () => device.writeNv2(active().dpi)));
  $('writeButtons').addEventListener('click', () => work('按鍵設定寫入', writeAllButtons));
  $('saveDevice').addEventListener('click', () => {
    clearTimeout(gaugeTimer);
    work('設定寫入', async () => {
      const profile = structuredClone(active());
      await device.writeNv2(profile.dpi);
      await device.writeNv1(profile.rate, profile.stage);
      await writeAllButtons(profile);
    });
  });
  $('exportProfile').addEventListener('click', () => download(`${active().name}-gaming-mouse.json`, JSON.stringify({ version: 1, profile: active() }, null, 2)));
  $('importProfile').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const profile = importProfile(JSON.parse(await file.text()));
      const index = profiles.findIndex(item => item.id === activeId);
      profile.name = `M${index + 1}`;
      profiles[index] = profile; activeId = profile.id;
      persist(); renderAll(); notify(t('匯入完成'));
    }
    catch (error) { notify(`${t('匯入失敗')}：${t(error.message)}`, true); }
    event.target.value = '';
  });
  $('addMacroStep').addEventListener('click', () => {
    if (editingSteps.length >= 62) return notify(t('巨集最多 62 個動作。'), true);
    const action = $('macroAction').value;
    const value = action === 'delay' ? Number($('macroDelay').value) : Number($('macroValue').value);
    if (!Number.isInteger(value) || value < 0 || value > (action === 'delay' ? 16383 : 4095)) return notify(t('動作數值超出範圍。'), true);
    editingSteps.push({ action, cat: action === 'delay' ? 'delay' : $('macroCategory').value, val: value, name: action === 'delay' ? '' : $('macroValue').selectedOptions[0].text });
    renderMacro();
  });
  $('addQuickKey').addEventListener('click', () => {
    if (editingSteps.length + 4 > 62) return notify(t('巨集最多 62 個動作。'), true);
    const cat = $('macroCategory').value, val = Number($('macroValue').value), name = $('macroValue').selectedOptions[0].text;
    const delay = Number($('macroDelay').value);
    if (!Number.isInteger(delay) || delay < 0 || delay > 16383) return notify(t('延遲需為 0–16383 毫秒。'), true);
    editingSteps.push({ action: 'make', cat, val, name }, { action: 'delay', cat: 'delay', val: delay }, { action: 'break', cat, val, name }, { action: 'delay', cat: 'delay', val: delay });
    renderMacro();
  });
  $('clearMacro').addEventListener('click', () => { editingSteps = []; renderMacro(); });
  $('writeMacro').addEventListener('click', () => work('巨集寫入', async () => {
    if (!editingSteps.length) throw new Error('請先加入動作');
    const index = Number($('macroButton').value), repetitions = Number($('macroRepeats').value);
    await device.writeMacro(index, editingSteps, repetitions);
    active().macros[index] = { steps: structuredClone(editingSteps), repetitions };
    active().assignments[index] = { kind: 'macro', label: '巨集' };
    persist(); renderAssignments();
  }));
  $('exportTrace').addEventListener('click', () => download(`gaming-mouse-hid-${Date.now()}.json`, JSON.stringify(device.trace, null, 2)));
  $('languageSelect').addEventListener('change', () => {
    localStorage.setItem('hxd-language', $('languageSelect').value);
    applyLanguage();
  });
  document.addEventListener('pointermove', event => {
    const card = event.target.closest?.('.card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--glow-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--glow-y', `${event.clientY - rect.top}px`);
  }, { passive: true });
}
function setTheme(theme) {
  const labels = { dark: '橘黑', light: '橘白', red: '紅色', green: '綠色', blue: '藍色', lavender: '薰衣草紫', banana: '香蕉黃', hoshino: '星野橙花', cyberpunk: '賽博龐克' };
  if (!labels[theme]) theme = 'hoshino';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('hxd-theme', theme);
  const label = $('themeLabel');
  label.textContent = t(labels[theme]);
  $('settingsTop').setAttribute('aria-label', t('選擇主題'));
  $('settingsTop').querySelector('use').setAttribute('href', '#i-gear');
  $('themeMenu').querySelectorAll('[data-theme-choice]').forEach(button => {
    const selected = button.dataset.themeChoice === theme;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
function applyLanguage() {
  const language = $('languageSelect').value;
  document.documentElement.lang = ({ 'zh-TW': 'zh-Hant', 'zh-CN': 'zh-Hans', en: 'en', ja: 'ja', ko: 'ko' })[language];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent.trim() || node.parentElement?.closest('script,style,#traceView')) continue;
    if (!textSources.has(node)) textSources.set(node, node.textContent);
    const source = textSources.get(node);
    const trimmed = source.trim();
    node.textContent = source.replace(trimmed, translate(trimmed, language));
  }
  document.querySelectorAll('[aria-label],[title]').forEach(element => {
    let original = attributeSources.get(element);
    if (!original) {
      original = { label: element.getAttribute('aria-label'), title: element.getAttribute('title') };
      attributeSources.set(element, original);
    }
    if (original.label) element.setAttribute('aria-label', translate(original.label, language));
    if (original.title) element.setAttribute('title', translate(original.title, language));
  });
  setTheme(document.documentElement.dataset.theme || 'hoshino');
}

loadProfiles();
initMacroControls();
bindEvents();
initLightingDemo();
device.addEventListener('change', renderConnection);
device.addEventListener('trace', renderTrace);
const savedLanguage = localStorage.getItem('hxd-language');
$('languageSelect').value = LANGUAGES.includes(savedLanguage) ? savedLanguage : systemLanguage(navigator.languages || [navigator.language]);
document.documentElement.dataset.theme = localStorage.getItem('hxd-theme') || 'hoshino';
renderAll();



if (device.native) {
  device.probe().catch(error => notify(`裝置偵測失敗：${error}`, true));
  setInterval(async () => {
    try {
      if (device.connected) await device.checkConnection();
      else if (Date.now() >= suppressProbeUntil) await device.probe();
    } catch (error) { console.warn('HID scan failed:', error); }
  }, 2000);
}
