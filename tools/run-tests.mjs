// Ejecuta los tests inline de index.html en Node, con shims de DOM/localStorage/history.
// Uso: node tools/run-tests.mjs   ->   imprime "Tests: N ✓ / M ✗" y sale 0 si M==0.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const url = new URL('../index.html', import.meta.url);
const html = readFileSync(url, 'utf8');

const bloques = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const appScript = bloques.find(s => s.includes('function registerTests'));
if (!appScript) { console.error('No se encontró el <script> con registerTests'); process.exit(2); }

function stubEl() {
  const el = {
    innerHTML: '', textContent: '', value: '', hidden: false, checked: false,
    style: {}, dataset: {}, files: [],
    appendChild() {}, removeChild() {}, setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {}, focus() {}, click() {}, setSelectionRange() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }
  };
  return el;
}

const listeners = {};
const elCache = {};
const documentShim = {
  addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
  removeEventListener() {},
  getElementById: (id) => (elCache[id] || (elCache[id] = stubEl())),
  querySelector: () => null, querySelectorAll: () => [],
  createElement: () => stubEl(), body: stubEl()
};

const store = new Map();
const localStorageShim = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); }, clear: () => store.clear()
};

const logs = [], errs = [];
const consoleShim = {
  log: (...a) => logs.push(a.join(' ')),
  error: (...a) => errs.push(a.join(' ')),
  warn() {}, info() {}
};

const ctx = {
  document: documentShim, localStorage: localStorageShim, console: consoleShim,
  location: { search: '?test', href: '', reload() {} },
  navigator: { language: 'es' },
  history: { state: null, _s: [{}], pushState(s) { this._s.push(s); this.state = s; },
             replaceState(s) { this.state = s; }, back() {}, go() {}, length: 1 },
  alert() {}, confirm() { return true; },
  setTimeout: () => 0, clearTimeout() {},
  URL: { createObjectURL: () => '', revokeObjectURL() {} },
  Blob: function () {}, FileReader: function () {}
};
ctx.window = ctx;
ctx.window.scrollTo = () => {};
ctx.window.addEventListener = (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); };
ctx.window.removeEventListener = () => {};

vm.createContext(ctx);
vm.runInContext(appScript, ctx);

(listeners['DOMContentLoaded'] || []).forEach(fn => { try { fn(); } catch (e) { errs.push('EXC: ' + e.message); } });

errs.forEach(e => console.log(e));
const linea = logs.find(l => /Tests:/.test(l)) || '';
console.log(linea || 'No se obtuvo el resumen de tests');
const m = linea.match(/(\d+)\s*✓\s*\/\s*(\d+)\s*✗/);
const failed = m ? Number(m[2]) : 1;
process.exit(failed > 0 ? 1 : 0);
