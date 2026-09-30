// Profiles and macros only contain JSON data. Avoid newer WebKit APIs here:
// a missing API must not prevent the entire interface from initializing.
export function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export function profileId() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function replaceChildren(parent, ...children) {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
  for (const child of children) parent.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
}

export function readFileText(file) {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// A denied custom-scheme storage origin must not leave the whole UI inert.
const memoryStorage = new Map();
export const storage = {
  getItem(key) {
    try { return localStorage.getItem(key); }
    catch { return memoryStorage.has(key) ? memoryStorage.get(key) : null; }
  },
  setItem(key, value) {
    try { localStorage.setItem(key, value); }
    catch { memoryStorage.set(key, String(value)); }
  }
};
