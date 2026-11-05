import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('remote log keeps a failed batch and delivers it in order on the next attempt', () => {
  const sent = [], timers = [];
  let fail = true;
  const context = { console: { log() {}, warn() {}, error() {} }, window: {}, Date, JSON, Array,
    setTimeout: (fn) => timers.push(fn),
    XMLHttpRequest: class { open() {} setRequestHeader() {} send(body) { sent.push(JSON.parse(body).map((e) => e.text)); this.status = fail ? 0 : 200; this.onloadend(); } } };
  const source = fs.readFileSync(new URL('../../src/js/lib/log.js', import.meta.url), 'utf8').replace(/export const log/, 'var log');
  vm.runInNewContext(source + '\nthis.log = log;', context);
  context.log.setRemote('http://receiver/log');
  context.log.info('Startup timeline');
  assert.deepEqual(sent, [['Startup timeline']]);
  context.log.info('later line');
  fail = false;
  timers.shift()();
  assert.deepEqual(sent.at(-1), ['Startup timeline', 'later line'], 'nothing lost, original order kept');
});


test('general debug is remote-only and redacts configured and signed URLs and credentials',()=>{
 const sent=[],printed=[];const context={console:{log:s=>printed.push(s),warn(){},error:s=>printed.push(s)},window:{},Date,JSON,Array,setTimeout(){},
 XMLHttpRequest:class{open(){}setRequestHeader(){}send(body){sent.push(JSON.parse(body));this.status=200;this.onloadend();}}};
 const source=fs.readFileSync(new URL('../../src/js/lib/log.js',import.meta.url),'utf8').replace(/export const log/,'var log');vm.runInNewContext(source,context);
 context.log.debug('disabled');assert.equal(printed.length,0);
 context.log.setRemote('http://receiver/log');context.log.debug('HTTP request',{url:'https://user:SECRET@example.com/TOPSECRET/video?token=SIGNED',auth_token:'PRIVATE'});
 const text=JSON.stringify(sent);assert.ok(text.includes('example.com'));for(const value of ['SECRET','TOPSECRET','SIGNED','PRIVATE'])assert.ok(!text.includes(value));
 context.window.onunhandledrejection({reason:'fixture failure'});assert.ok(JSON.stringify(sent).includes('Unhandled promise rejection'));
});
