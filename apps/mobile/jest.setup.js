// Polyfill structuredClone for Expo SDK 55 compatibility in Jest
// This prevents the lazy getter in expo/src/winter/installGlobal from
// triggering a require() outside module scope
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock __ExpoImportMetaRegistry
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
    value: { url: null },
    writable: true,
    configurable: true,
  });
}
