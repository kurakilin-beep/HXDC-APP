// Packet layout and constants are carried over from the working WebHID backup.
export const DEVICE_FILTERS = [
  { vendorId: 0x062a, productId: 0x8000 },
  { vendorId: 0x062a, productId: 0x8002 },
  { vendorId: 0x062a, productId: 0x8001 }
];
export const VENDOR_USAGE_PAGE = 0xff00;
export const COMMAND = Object.freeze({ NV1: 0x20, NV2: 0x30, MACRO: 0x50, END: 0x07 });
export const STAGE_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
export const DEFAULT_DPI = [800, 1600, 3200, 6400, 8000, 12000];
export const REPORT_RATES = [125, 250, 500, 1000, 2000, 4000, 8000];

export function crc8(bytes) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
  }
  return crc;
}

export function packet(command, data = []) {
  if (data.length > 61) throw new RangeError('Payload exceeds 61 bytes');
  const result = new Uint8Array(64);
  result[0] = command;
  result[1] = 1;
  result.set(data, 2);
  result[63] = crc8(result.subarray(0, 63));
  return result;
}

export function encodeNv1(rateHz, stageIndex) {
  const rate = Number(rateHz), stage = Number(stageIndex);
  if (!REPORT_RATES.includes(rate)) throw new RangeError('Unsupported report rate');
  if (!Number.isInteger(stage) || stage < 0 || stage > 5) throw new RangeError('DPI stage must be 1–6');
  const data = new Uint8Array(61);
  data[0] = 8000 / rate; // Matches the original WebHID UI (125 Hz => 64, 8K => 1).
  data[1] = stage;
  return data;
}

export function encodeNv2(values) {
  if (!Array.isArray(values) || values.length !== 6) throw new RangeError('NV2 requires six DPI stages');
  const data = new Uint8Array(61);
  values.forEach((raw, i) => {
    const dpi = Number(raw);
    if (!Number.isInteger(dpi) || dpi < 200 || dpi > 30000 || dpi % 200 !== 0) {
      throw new RangeError(`Stage ${i + 1}: DPI must be 200–30000 in steps of 200`);
    }
    const color = STAGE_COLORS[i];
    const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
    const rgb565 = (((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3)) & 0xffff;
    data[i * 3] = Math.floor((dpi + 100) / 200) & 0xff;
    data[i * 3 + 1] = rgb565 & 0xff;
    data[i * 3 + 2] = rgb565 >> 8;
  });
  return data;
}

export function encodeMacro(buttonIndex, steps, repetitions) {
  if (!Number.isInteger(buttonIndex) || buttonIndex < 0 || buttonIndex > 4) throw new RangeError('Button index must be 0–4');
  if (!Array.isArray(steps) || steps.length > 62) throw new RangeError('Macro supports at most 62 actions');
  if (!Number.isInteger(repetitions) || repetitions < 0 || repetitions > 255) throw new RangeError('Repeat count must be 0–255');
  const buffer = new Uint8Array(128);
  const view = new DataView(buffer.buffer);
  buffer[0] = 8;
  buffer[2] = repetitions;
  buffer[3] = steps.length;
  steps.forEach((step, index) => {
    const value = Number(step.val);
    const max = step.action === 'delay' ? 0x3fff : 0x0fff;
    if (!Number.isInteger(value) || value < 0 || value > max) throw new RangeError(`Action ${index + 1}: value out of range`);
    if (!['make', 'break', 'delay'].includes(step.action)) throw new RangeError(`Action ${index + 1}: unknown action`);
    let word = step.action === 'delay' ? 0xc000 : step.action === 'break' ? 0x4000 : 0;
    if (step.action !== 'delay' && step.cat === 'ms') word |= 0x2000;
    if (step.action !== 'delay' && step.cat === 'media') word |= 0x1000;
    word |= value;
    view.setUint16(4 + index * 2, word, true);
  });
  return Array.from({ length: 4 }, (_, i) => {
    const data = new Uint8Array(61);
    data[0] = buttonIndex;
    data[1] = i * 32;
    data.set(buffer.subarray(i * 32, (i + 1) * 32), 2);
    return data;
  });
}

