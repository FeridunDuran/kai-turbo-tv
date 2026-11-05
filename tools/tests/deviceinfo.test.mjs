import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function deviceAPI(productinfo) {
  const source = fs.readFileSync(new URL('../../src/js/lib/luna.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export function /g, 'function ');
  const context = { Promise, Set, window: { webapis: { productinfo } }, isTizen: () => true };
  vm.runInNewContext(source, context);
  return context;
}

test('Settings device lookup tolerates Samsung API access errors', async () => {
  const deny = () => { throw new Error('SecurityError: Product API access denied'); };
  const api = deviceAPI({ getRealModel: deny, getFirmware: deny });
  const info = await api.deviceInfo();
  assert.equal(info.modelName, 'Samsung');
  assert.equal(info.firmwareVersion, '');
});

test('Settings device lookup tolerates missing methods and preserves available fields', async () => {
  const partial = await deviceAPI({ getModel: () => 'Q70T' }).deviceInfo();
  assert.equal(partial.modelName, 'Q70T');
  assert.equal(partial.firmwareVersion, '');
  const full = await deviceAPI({ getRealModel: () => 'Q70T', getFirmware: () => 'fixture' }).deviceInfo();
  assert.equal(full.modelName, 'Q70T');
  assert.equal(full.firmwareVersion, 'fixture');
});
