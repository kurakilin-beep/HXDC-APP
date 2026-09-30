import { COMMAND, DEVICE_FILTERS, VENDOR_USAGE_PAGE, encodeMacro, encodeNv1, encodeNv2, packet } from './protocol.js';
const invoke = (command, args) => window.__TAURI__.core.invoke(command, args);

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export class GamingMouseDevice extends EventTarget {
  constructor() {
    super();
    this.device = null;
    this.reportId = 0;
    this.pending = [];
    this.queue = Promise.resolve();
    this.trace = [];
    this.native = !!(window.__TAURI__ && window.__TAURI__.core);
    this.nativeConnected = false;
    this.probing = false;
  }

  get connected() { return this.native ? this.nativeConnected : !!(this.device && this.device.opened); }

  async probe() {
    if (!this.native || this.connected || this.probing) return;
    this.probing = true;
    try {
      const found = await invoke('mouse_probe');
      if (found) {
        this.device = { vendorId: 0x062a, productId: found[0], manufacturerName: found[1], productName: found[2] };
        this.reportId = 0;
        this.nativeConnected = true;
        this.dispatchEvent(new Event('change'));
      }
    } finally { this.probing = false; }
  }

  async checkConnection() {
    if (!this.native || !this.connected) return;
    if (!await invoke('mouse_connected')) {
      this.nativeConnected = false;
      this.device = null;
      this.dispatchEvent(new Event('change'));
    }
  }

  async connect() {
    if (this.native) { await this.probe(); return this.connected; }
    if (!navigator.hid) throw new Error('此 WebView2 無法使用 WebHID，請更新 WebView2 Runtime。');
    const devices = await navigator.hid.requestDevice({ filters: DEVICE_FILTERS });
    if (!devices.length) return false;
    const chosen = devices.find(d => d.collections.some(c => c.usagePage === VENDOR_USAGE_PAGE && c.outputReports && c.outputReports.length)) || devices[0];
    const collection = chosen.collections.find(c => c.usagePage === VENDOR_USAGE_PAGE && c.outputReports && c.outputReports.length) || chosen.collections.find(c => c.outputReports && c.outputReports.length);
    if (!collection) throw new Error('裝置沒有可用的 Output Report。');
    await chosen.open();
    this.device = chosen;
    this.reportId = collection.outputReports[0].reportId != null ? collection.outputReports[0].reportId : 0;
    chosen.addEventListener('inputreport', event => {
      const bytes = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
      this.trace.push({ time: new Date().toISOString(), direction: 'input', reportId: event.reportId, bytes: Array.from(bytes) });
      const resolvePending = this.pending.shift();
      if (resolvePending) resolvePending(bytes);
      this.dispatchEvent(new Event('trace'));
    });
    navigator.hid.addEventListener('disconnect', event => {
      if (event.device !== chosen) return;
      this.device = null;
      this.reportId = 0;
      while (this.pending.length) this.pending.shift()(null);
      this.dispatchEvent(new Event('change'));
    });
    this.dispatchEvent(new Event('change'));
    return true;
  }

  async disconnect() {
    if (this.native) {
      await invoke('mouse_disconnect');
      this.nativeConnected = false;
      this.device = null;
      this.dispatchEvent(new Event('change'));
      return;
    }
    if (this.device && this.device.opened) await this.device.close();
    this.device = null;
    this.reportId = 0;
    while (this.pending.length) this.pending.shift()(null);
    this.dispatchEvent(new Event('change'));
  }

  execute(task) {
    const next = this.queue.then(task);
    this.queue = next.catch(() => {});
    return next;
  }

  async send(command, data) {
    if (!this.connected) throw new Error('請先連接滑鼠。');
    const payload = packet(command, data);
    const record = { time: new Date().toISOString(), direction: 'output', reportId: this.reportId, command, bytes: Array.from(payload), status: 'pending' };
    this.trace.push(record);
    this.dispatchEvent(new Event('trace'));
    let resolver;
    const response = new Promise(resolve => { resolver = resolve; });
    this.pending.push(resolver);
    try {
      if (this.native) await invoke('mouse_send', { reportId: this.reportId, payload: Array.from(payload) });
      else await this.device.sendReport(this.reportId, payload);
      record.status = 'sent';
    } catch (error) {
      record.status = `failed: ${error.message}`;
      this.pending.splice(this.pending.indexOf(resolver), 1);
      this.dispatchEvent(new Event('trace'));
      throw error;
    }
    this.dispatchEvent(new Event('trace'));
    if (this.native) await pause(15);
    else await Promise.race([response, pause(800)]);
    const index = this.pending.indexOf(resolver);
    if (index >= 0) this.pending.splice(index, 1);
  }

  writeNv1(rate, stage) { return this.execute(async () => { await this.send(COMMAND.NV1, encodeNv1(rate, stage)); await this.send(COMMAND.END); }); }
  writeNv2(values) { return this.execute(async () => { await this.send(COMMAND.NV2, encodeNv2(values)); await this.send(COMMAND.END); }); }
  writeMacro(buttonIndex, steps, repetitions = 1) {
    return this.execute(async () => {
      for (const data of encodeMacro(buttonIndex, steps, repetitions)) { await this.send(COMMAND.MACRO, data); await pause(15); }
      await this.send(COMMAND.END);
    });
  }
}
