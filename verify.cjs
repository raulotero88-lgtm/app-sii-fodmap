const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('SII-FODMAP.html','utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
const code = m[1];
const fake = { hidden:false, innerHTML:'', setSelectionRange(){}, focus(){}, value:'', addEventListener(){}, querySelectorAll(){return []}, querySelector(){return null} };
const sandbox = {
  console,
  document: {
    getElementById: () => fake,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (ev, fn) => { sandbox.__init = fn; }
  },
  location: { search: '?test' },
  window: { scrollTo(){} },
  Set
};
sandbox.global = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
// trigger DOMContentLoaded handler (init)
if (sandbox.__init) sandbox.__init();
const r = sandbox.runTests();
console.log('RESULT', JSON.stringify(r));
console.log('TOTAL ALIMENTOS', sandbox.DATOS.length);
process.exit(r.failed === 0 ? 0 : 1);
