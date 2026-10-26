import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const current = fs.readFileSync(new URL('../src/js/lib/nav.js', import.meta.url), 'utf8');
const baseline = execFileSync('git', ['show', 'a262917fbf087e964430de818f1c46b110ff0710:src/js/lib/nav.js'], { encoding: 'utf8' });

function simulate(source, keyCode, tagName = 'INPUT') {
  const keySource = source.slice(source.indexOf('export const KEY ='), source.indexOf('\nconst layers'))
    .replace('export const KEY =', 'var KEY =');
  const handler = source.slice(source.indexOf('function onKeyDown(e) {'), source.indexOf('\nfunction onMouseOver'));
  const result = { submits: 0, blurs: 0, selects: 0, backs: 0, prevented: 0, value: null };
  const input = {
    tagName, value: 'rick and morty',
    blur() { result.blurs++; },
    __submit(value) { result.submits++; result.value = value; },
  };
  const sandbox = {
    TIZEN: true, document: { activeElement: input }, pointerMode: false,
    top: () => ({ onBack() { result.backs++; } }),
    move() {}, select() { result.selects++; },
  };
  vm.createContext(sandbox);
  vm.runInContext(keySource + '\n' + handler, sandbox);
  sandbox.onKeyDown({ keyCode, preventDefault() { result.prevented++; } });
  return result;
}

assert.equal(simulate(baseline, 65376).submits, 0, 'Reproduce missing Samsung Done support');
assert.equal(simulate(baseline, 13).selects, 1, 'Reproduce Enter falling through to navigation');
for (const tag of ['INPUT', 'TEXTAREA']) {
  for (const code of [13, 65376]) {
    const r = simulate(current, code, tag);
    assert.equal(r.submits, 1);
    assert.equal(r.value, 'rick and morty');
    assert.equal(r.blurs, 1);
    assert.equal(r.selects, 0);
    assert.equal(r.prevented, code === 13 ? 1 : 0);
  }
  for (const code of [65385, 10009, 27]) {
    const r = simulate(current, code, tag);
    assert.equal(r.submits, 0);
    assert.equal(r.blurs, 1);
    assert.equal(r.backs, 0, 'Cancel editing must not also navigate back');
    assert.equal(r.selects, 0);
  }
  assert.equal(simulate(current, 229, tag).submits, 0, 'Normal IME text must not submit');
}
assert.equal(simulate(current, 13, 'DIV').selects, 1, 'Ordinary remote navigation still works');
assert.equal(simulate(current, 65376, 'DIV').submits, 0);
console.log('PASS: baseline defects reproduced; 14 input/navigation cases passed.');
