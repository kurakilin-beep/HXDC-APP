import assert from 'node:assert/strict';
import test from 'node:test';
import { COMMAND, DEVICE_FILTERS, crc8, encodeMacro, encodeNv1, encodeNv2, packet } from '../ui/protocol.js';

test('supported USB products include PID 8000, 8001 and 8002', () => {
  assert.deepEqual(DEVICE_FILTERS.map(({ productId }) => productId), [0x8000, 0x8002, 0x8001]);
});

test('NV1 keeps the working page’s rate divisor and zero-based stage', () => {
  const data = encodeNv1(1000, 2);
  assert.equal(data.length, 61);
  assert.deepEqual(Array.from(data.slice(0, 3)), [8, 2, 0]);
  assert.equal(encodeNv1(8000, 0)[0], 1);
});

test('NV2 encodes six DPI stages and fixed RGB565 colors', () => {
  const data = encodeNv2([800, 1600, 3200, 6400, 8000, 12000]);
  assert.equal(data.length, 61);
  assert.deepEqual(Array.from(data.slice(0, 6)), [4, 0x00, 0xf8, 8, 0xe0, 0x07]);
  assert.throws(() => encodeNv2([800, 1600]), /six/);
});

test('macro uses four 32-byte fragments inside 61-byte command payloads', () => {
  const chunks = encodeMacro(3, [
    { action: 'make', cat: 'kb', val: 4 },
    { action: 'delay', cat: 'delay', val: 50 },
    { action: 'break', cat: 'kb', val: 4 }
  ], 2);
  assert.equal(chunks.length, 4);
  assert.deepEqual(Array.from(chunks[0].slice(0, 10)), [3, 0, 8, 0, 2, 3, 4, 0, 50, 192]);
  assert.deepEqual(chunks.map(chunk => chunk[1]), [0, 32, 64, 96]);
  assert.throws(() => encodeMacro(0, Array(63).fill({ action: 'delay', val: 1 }), 1), /62/);
});

test('report packet is 64 bytes with command, mode and CRC8', () => {
  const result = packet(COMMAND.NV1, encodeNv1(1000, 0));
  assert.equal(result.length, 64);
  assert.deepEqual(Array.from(result.slice(0, 4)), [0x20, 1, 8, 0]);
  assert.equal(result[63], crc8(result.slice(0, 63)));
});
