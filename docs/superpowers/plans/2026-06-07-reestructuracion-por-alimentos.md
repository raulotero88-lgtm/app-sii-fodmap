# Reestructuración por alimentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar la app SII/FODMAP para que la Reintroducción sea por alimentos (los 131, con filtros por grupo FODMAP), la Personalización (Fase 3) sea por alimento (derivada + manual) y el botón "atrás" del dispositivo navegue dentro de la app en vez de cerrarla.

**Architecture:** Sigue siendo **un único `index.html` offline**, vanilla JS en un solo `<script>`, sin dependencias. La lógica pura (datos, migración, derivación de grupos, navegación) se separa en funciones testeables; la UI son builders de HTML string que reutilizan helpers existentes (`fichaHTML`, `buscar`, `normalizar`, `escapeHTML`, `emojiNivel`). Los datos de los alimentos salen de `DATOS` (única fuente). El diario pasa de guardarse por grupo a guardarse **por alimento** (`pruebas`), con migración automática v1→v2.

**Tech Stack:** HTML/CSS/JS vanilla (ES5, `var`, sin módulos). Tests inline en `registerTests(assert)`. Verificación headless con un arnés **Node** (`node:vm` + shims de DOM/localStorage/history) en `tools/run-tests.mjs`. PWA con `sw.js` (caché offline + banner de actualización).

**Diseño de referencia:** `docs/superpowers/specs/2026-06-07-reestructuracion-por-alimentos-design.md`.

---

## Convenciones (leer antes de empezar)

**Forma de un alimento (`DATOS[i]`, ya existe):**
`{ nombre, sinonimos[], categoria, nivel:"verde"|"amarillo"|"rojo", racion_segura, fodmap[], alternativas[], consejo, fuente, motivo? }`

**Modelo nuevo Fase 2 (`localStorage["sii_fodmap_fase2_v1"]`, `version:2`):**
```js
{ version: 2, pruebas: {
  "<nombre alimento>": {
    alimento: "<nombre>",
    agenda: "seguida" | "alterna",
    dias: [ { etiqueta:"Dosis 1", cantidad:"", fecha:"2026-06-01",
              dolor:0, hinchazon:0, gases:0, notas:"", registrado:false }, … (>=3) ],
    conclusion: { estado:"sin"|"tolera"|"limite"|"no", dosisIndex: <int|null> }
  }
}}
```
Cambios de nombre respecto al modelo viejo de día: `dosis`→`cantidad`, `guardado`→`registrado`.

**Modelo nuevo Fase 3 (`localStorage["sii_fodmap_fase3_v1"]`, `version:2`):**
```js
{ version: 2, manuales: {
    "<alimento o texto>": { estado:"tolera"|"limite"|"no", cantidad:"", nota:"" }
  }, verSegunTolerancia: false }
```
(El veredicto de los alimentos reintroducidos NO vive aquí: vive en `pruebas[x].conclusion`.)

**Mini-tabla de grupos (sustituye a `RETOS` como fuente):**
```js
var GRUPOS_META = {
  "Fructosa": { agenda:"seguida", nota:"La fructosa en exceso (sin glucosa que la acompañe) es la que da síntomas." },
  "Lactosa":  { agenda:"seguida", nota:"Prueba con un lácteo cuyo único FODMAP sea la lactosa." },
  "Sorbitol": { agenda:"seguida", nota:"Poliol presente en algunas frutas y edulcorantes 'sin azúcar'." },
  "Manitol":  { agenda:"seguida", nota:"Poliol presente en setas y algunas verduras." },
  "Fructanos":{ agenda:"alterna", nota:"El trigo y la verdura se toleran distinto; pruébalos por separado. Los síntomas pueden tardar hasta 48 h." },
  "GOS":      { agenda:"alterna", nota:"Galactanos de legumbres y algunos frutos secos; los síntomas pueden tardar hasta 48 h." }
};
```

**Comando de verificación (todas las tareas):** `node tools/run-tests.mjs`
Debe terminar con `Tests: N ✓ / 0 ✗` y **exit code 0**. Cualquier `✗` falla la tarea.

**Mapa de funciones/constantes que se JUBILAN** (se eliminan en la Fase 8, sus tests se quitan en la fase correspondiente): `RETOS`, `validarReto`, `iniciarReto`, `progresoDe`, `estadoReto`, `guardarDia`, `reiniciarReto`, `resumenFase2PorGrupo`, `sugerirLimiteDosis`, `bloqueDosisHTML`, `nivelPersonalizado`, `estadoFodmap`, `peorEstado`, `toleranciaDe`, `setTolerancia`, `hayAlgunaTolerancia` (se reescribe), `aplicarTolerancia` (se reescribe), `renderReto`, `renderResumen`, `renderFase3` (se reescriben).

---

## Phase 1 — Arnés de tests headless (Node)

Sin esto, el agente no puede verificar nada (los `?test` solo corren en navegador).

### Task 1: Crear el arnés Node

**Files:**
- Create: `tools/run-tests.mjs`

- [ ] **Step 1: Escribir el arnés**

Crea `tools/run-tests.mjs` con este contenido exacto:

```js
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
```

- [ ] **Step 2: Ejecutar el arnés contra el código ACTUAL**

Run: `node tools/run-tests.mjs`
Expected: `Tests: 103 ✓ / 0 ✗` y exit code 0. (Confirma que el arnés ejecuta los tests existentes tal cual, antes de tocar nada.)

- [ ] **Step 3: Commit**

```bash
git add tools/run-tests.mjs
git commit -m "test: arnés Node para ejecutar los tests inline sin navegador"
```

---

## Phase 2 — Datos, derivación y migración (Fase 2 v2)

### Task 2: Mini-tabla `GRUPOS_META` y helpers de derivación

**Files:**
- Modify: `index.html` (zona de datos Fase 2, donde hoy está `var RETOS`, ~líneas 958-1010, y zona de tests `registerTests`)

- [ ] **Step 1: Escribir los tests (fallan)**

En `registerTests`, justo después del bloque `// ---- FASE 2: cálculo de fechas ----`, añade:

```js
// ---- NUEVO FASE 2: derivación de grupo y agenda ----
assert(gruposDeAlimento({ fodmap: ["Fructanos","Fructosa"] }).join(",") === "Fructanos,Fructosa",
  "gruposDeAlimento devuelve los FODMAP del alimento");
assert(gruposDeAlimento({ fodmap: [] }).length === 0, "alimento verde no tiene grupos");
assert(agendaDeAlimento({ fodmap: ["Fructosa"] }) === "seguida", "fructosa -> agenda seguida");
assert(agendaDeAlimento({ fodmap: ["Fructanos"] }) === "alterna", "fructanos -> agenda alterna");
assert(agendaDeAlimento({ fodmap: ["GOS"] }) === "alterna", "GOS -> agenda alterna");
assert(agendaDeAlimento({ fodmap: ["Manitol","GOS"] }) === "alterna", "si algún FODMAP es lento, alterna");
assert(agendaDeAlimento({ fodmap: [] }) === "seguida", "verde -> agenda seguida por defecto");
assert(GRUPOS_META["Fructanos"].agenda === "alterna", "GRUPOS_META Fructanos es alterna");
assert(Object.keys(GRUPOS_META).length === 6, "hay 6 grupos FODMAP en GRUPOS_META");
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tools/run-tests.mjs`
Expected: FAIL — `gruposDeAlimento is not defined` (o similar) reflejado en exit 1.

- [ ] **Step 3: Implementar**

Reemplaza el bloque `var RETOS = [ … ];` (y su comentario de cabecera) por:

```js
  /* ============================================================
     FASE 2 · GRUPOS FODMAP (metadatos) + derivación desde el alimento
     ============================================================ */
  var GRUPOS_META = {
    "Fructosa": { agenda:"seguida", nota:"La fructosa en exceso (sin glucosa que la acompañe) es la que da síntomas." },
    "Lactosa":  { agenda:"seguida", nota:"Prueba con un lácteo cuyo único FODMAP sea la lactosa." },
    "Sorbitol": { agenda:"seguida", nota:"Poliol presente en algunas frutas y edulcorantes 'sin azúcar'." },
    "Manitol":  { agenda:"seguida", nota:"Poliol presente en setas y algunas verduras." },
    "Fructanos":{ agenda:"alterna", nota:"El trigo y la verdura se toleran distinto; pruébalos por separado. Los síntomas pueden tardar hasta 48 h." },
    "GOS":      { agenda:"alterna", nota:"Galactanos de legumbres y algunos frutos secos; los síntomas pueden tardar hasta 48 h." }
  };

  function gruposDeAlimento(a) {
    return (a && Array.isArray(a.fodmap)) ? a.fodmap.slice() : [];
  }

  function agendaDeAlimento(a) {
    var g = gruposDeAlimento(a);
    return (g.indexOf("Fructanos") !== -1 || g.indexOf("GOS") !== -1) ? "alterna" : "seguida";
  }
```

(Deja por ahora intactas `validarReto`, `iniciarReto`, etc.; se quitan en la Fase 8. Si `validarReto`/tests de `RETOS` rompen por la ausencia de `RETOS`, ve al Step siguiente.)

- [ ] **Step 4: Quitar los tests que dependían de `RETOS` como catálogo**

En `registerTests`, **elimina** estos bloques completos (ya no aplican): `// ---- FASE 2: definición de retos ----`, y `// ---- FASE 2: nuevos alimentos del catálogo ----` (la función `alimentoEn` y sus asserts). También elimina la constante `RETOS` y la función `validarReto`. (Sus reemplazos llegan en fases siguientes.)

- [ ] **Step 5: Ejecutar y ver pasar**

Run: `node tools/run-tests.mjs`
Expected: PASS — `Tests: N ✓ / 0 ✗` (N habrá bajado al quitar los tests de catálogo; debe ser 0 fallos).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(fase2): GRUPOS_META + derivación de grupo/agenda desde el alimento; retira RETOS como catálogo"
```

### Task 3: `calcularFechas` con N dosis

**Files:**
- Modify: `index.html` (`function calcularFechas`, ~línea 1035; y sus tests ~1792)

- [ ] **Step 1: Tests (fallan)**

Sustituye el bloque `// ---- FASE 2: cálculo de fechas ----` por:

```js
// ---- FASE 2: cálculo de fechas (N dosis) ----
assert(calcularFechas("2026-06-01", "seguida").join(",") === "2026-06-01,2026-06-02,2026-06-03",
  "seguida = 3 días consecutivos por defecto");
assert(calcularFechas("2026-06-01", "alterna").join(",") === "2026-06-01,2026-06-03,2026-06-05",
  "alterna = días 1,3,5 por defecto");
assert(calcularFechas("2026-06-01", "seguida", 5).join(",") === "2026-06-01,2026-06-02,2026-06-03,2026-06-04,2026-06-05",
  "seguida admite N=5 dosis");
assert(calcularFechas("2026-06-01", "alterna", 4).join(",") === "2026-06-01,2026-06-03,2026-06-05,2026-06-07",
  "alterna admite N=4 dosis");
assert(calcularFechas("2026-06-30", "seguida").join(",") === "2026-06-30,2026-07-01,2026-07-02",
  "cruza fin de mes");
assert(calcularFechas("fecha-mala", "seguida").length === 0, "fecha inválida devuelve []");
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tools/run-tests.mjs`
Expected: FAIL — la llamada con 3 argumentos da menos/más fechas de las esperadas.

- [ ] **Step 3: Implementar**

Reemplaza `function calcularFechas`:

```js
  function calcularFechas(inicioISO, agenda, n) {
    n = n || 3;
    var partes = String(inicioISO).split("-");
    if (partes.length !== 3) return [];
    var base = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    if (isNaN(base.getTime())) return [];
    var paso = agenda === "alterna" ? 2 : 1;
    var fechas = [];
    for (var i = 0; i < n; i++) {
      var d = new Date(base.getTime());
      d.setDate(base.getDate() + i * paso);
      fechas.push(aISO(d));
    }
    return fechas;
  }
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `node tools/run-tests.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(fase2): calcularFechas admite N dosis (no solo 3)"
```

### Task 4: Almacén v2 (`pruebas`) + migración v1→v2

**Files:**
- Modify: `index.html` (`var almacen = { … }`, ~líneas 1050-1086; tests de persistencia ~1801-1840)

- [ ] **Step 1: Tests (fallan)**

Sustituye TODOS los bloques de tests entre `// ---- FASE 2: persistencia …` y el final de `// ---- FASE 2: alimento personalizado ----` por:

```js
// ---- FASE 2 v2: persistencia por alimento ----
almacen._mem = null; store_clear_helper();
var d0 = almacen.cargar();
assert(d0 && d0.version === 2 && d0.pruebas && typeof d0.pruebas === "object",
  "cargar sin datos da estructura v2 vacía");

// migración desde formato viejo (retos por grupo)
almacen._mem = null;
localStorage.setItem("sii_fodmap_fase2_v1", JSON.stringify({
  version: 1, retos: { "fructosa": {
    alimentoElegido: "Miel", personalizado: false, fechaInicio: "2026-06-01",
    dias: [ { etiqueta:"Dosis 1", dosis:"1 cucharadita", fecha:"2026-06-01", dolor:3, hinchazon:5, gases:2, notas:"leve", guardado:true } ]
  } }
}));
var mig = almacen.cargar();
assert(mig.version === 2, "migración sube a version 2");
assert(mig.pruebas["Miel"], "migración crea pruebas['Miel'] desde el reto antiguo");
assert(mig.pruebas["Miel"].dias[0].cantidad === "1 cucharadita", "migración: dosis -> cantidad");
assert(mig.pruebas["Miel"].dias[0].registrado === true, "migración: guardado -> registrado");
assert(mig.pruebas["Miel"].dias[0].dolor === 3, "migración conserva los síntomas");
assert(mig.pruebas["Miel"].conclusion.estado === "sin", "migración: conclusión por defecto 'sin'");

// exportar/importar v2
almacen._mem = { version: 2, pruebas: {} }; localStorage.removeItem("sii_fodmap_fase2_v1");
almacen.guardar(almacen._mem);
almacen._mem = null;
iniciarPrueba("Leche normal", "2026-06-01", "seguida");
guardarDosis("Leche normal", 0, { dolor: 4, hinchazon: 0, gases: 1, notas: "ok" });
var exp = almacen.exportar();
almacen._mem = { version: 2, pruebas: {} };
assert(almacen.importar(exp) === true, "importar v2 válido funciona");
assert(pruebaDe("Leche normal").dias[0].dolor === 4, "importar restaura los datos");
var antes = almacen.exportar();
assert(almacen.importar("{ no es json") === false, "importar JSON inválido = false");
assert(almacen.importar('{"foo":1}') === false, "importar sin 'pruebas' ni 'retos' = false");
assert(almacen.exportar() === antes, "import inválido no pisa datos");
```

Y al principio de `registerTests`, justo tras `assert(true, "el motor de tests funciona");`, añade un helper local:

```js
function store_clear_helper() { try { localStorage.removeItem("sii_fodmap_fase2_v1"); } catch (e) {} }
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tools/run-tests.mjs`
Expected: FAIL — `iniciarPrueba`/`pruebaDe`/`guardarDosis` no existen y la migración no ocurre (se implementan aquí y en Task 5).

- [ ] **Step 3: Implementar el almacén v2 con migración**

Reemplaza el objeto `var almacen = { … };` por:

```js
  var STORAGE_KEY = "sii_fodmap_fase2_v1";

  function migrarFase2(p) {
    // v1 (retos por grupo) -> v2 (pruebas por alimento). Idempotente.
    if (!p || typeof p !== "object") return { version: 2, pruebas: {} };
    if (p.version === 2 && p.pruebas) return p;
    var out = { version: 2, pruebas: {} };
    var retos = p.retos && typeof p.retos === "object" ? p.retos : {};
    Object.keys(retos).forEach(function (gid) {
      var r = retos[gid];
      if (!r || !r.alimentoElegido) return;
      var dias = (Array.isArray(r.dias) ? r.dias : []).map(function (d, i) {
        return {
          etiqueta: d.etiqueta || ("Dosis " + (i + 1)),
          cantidad: d.dosis || d.cantidad || "",
          fecha: d.fecha || "",
          dolor: d.dolor || 0, hinchazon: d.hinchazon || 0, gases: d.gases || 0,
          notas: d.notas || "",
          registrado: (d.registrado != null) ? !!d.registrado : !!d.guardado
        };
      });
      out.pruebas[r.alimentoElegido] = {
        alimento: r.alimentoElegido,
        agenda: r.agenda || "seguida",
        dias: dias,
        conclusion: { estado: "sin", dosisIndex: null }
      };
    });
    return out;
  }

  var almacen = {
    _mem: null,
    disponible: function () {
      try { localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); return true; }
      catch (e) { return false; }
    },
    cargar: function () {
      if (this._mem) return this._mem;
      var base = { version: 2, pruebas: {} };
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          var p = JSON.parse(raw);
          base = migrarFase2(p);
        }
      } catch (e) {}
      this._mem = base;
      return base;
    },
    guardar: function (data) {
      this._mem = data;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
      catch (e) { return false; }
    },
    exportar: function () { return JSON.stringify(this.cargar(), null, 2); },
    importar: function (json) {
      var p;
      try { p = JSON.parse(json); } catch (e) { return false; }
      if (!p || typeof p !== "object") return false;
      if (!p.pruebas && !p.retos) return false;       // no reconocible
      this.guardar(migrarFase2(p));
      return true;
    }
  };
```

- [ ] **Step 4: Ejecutar (seguirá fallando por accesores)**

Run: `node tools/run-tests.mjs`
Expected: FAIL todavía — faltan `iniciarPrueba`, `guardarDosis`, `pruebaDe` (Task 5). La parte de migración del test ya debería pasar; las de `iniciarPrueba` no.

- [ ] **Step 5: Commit (parcial, almacén)**

```bash
git add index.html
git commit -m "feat(fase2): almacén v2 por alimento + migración v1->v2 automática"
```

### Task 5: Accesores de prueba por alimento

**Files:**
- Modify: `index.html` (justo debajo del `almacen`, donde estaban `progresoDe`/`iniciarReto`/`guardarDia`)

- [ ] **Step 1: Tests (fallan)**

Tras el bloque de persistencia v2 del Task 4, añade:

```js
// ---- FASE 2 v2: accesores por alimento ----
almacen._mem = { version: 2, pruebas: {} };
assert(pruebaDe("Cebolla") === null, "pruebaDe inexistente -> null");
assert(estadoPrueba("Cebolla") === "sin-iniciar", "sin prueba -> sin-iniciar");
iniciarPrueba("Cebolla", "2026-06-01", "alterna");
var pc = pruebaDe("Cebolla");
assert(pc && pc.dias.length === 3, "iniciarPrueba crea 3 dosis");
assert(pc.dias[2].fecha === "2026-06-05", "iniciarPrueba usa la agenda (alterna)");
assert(pc.dias[0].cantidad === "" && pc.dias[0].registrado === false, "dosis empieza vacía y sin registrar");
assert(estadoPrueba("Cebolla") === "encurso", "prueba iniciada sin conclusión -> encurso");
setCantidad("Cebolla", 0, "1 cucharadita");
assert(pruebaDe("Cebolla").dias[0].cantidad === "1 cucharadita", "setCantidad guarda la cantidad");
guardarDosis("Cebolla", 0, { dolor: 2, hinchazon: 1, gases: 0, notas: "ok" });
assert(pruebaDe("Cebolla").dias[0].registrado === true, "guardarDosis marca registrado");
assert(pruebaDe("Cebolla").dias[0].dolor === 2, "guardarDosis guarda el valor");
anadirDosis("Cebolla");
assert(pruebaDe("Cebolla").dias.length === 4, "anadirDosis añade una 4ª dosis");
assert(pruebaDe("Cebolla").dias[3].etiqueta === "Dosis 4", "la nueva dosis se etiqueta Dosis 4");
assert(pruebaDe("Cebolla").dias[3].fecha === "2026-06-07", "la nueva dosis sigue la agenda alterna");
setConclusion("Cebolla", "limite", 1);
assert(pruebaDe("Cebolla").conclusion.estado === "limite" && pruebaDe("Cebolla").conclusion.dosisIndex === 1,
  "setConclusion guarda estado y dosisIndex");
assert(estadoPrueba("Cebolla") === "hecho", "con conclusión != sin -> hecho");
reiniciarPrueba("Cebolla");
assert(pruebaDe("Cebolla") === null, "reiniciarPrueba borra la prueba");
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tools/run-tests.mjs`
Expected: FAIL — accesores no definidos.

- [ ] **Step 3: Implementar**

Sustituye las funciones viejas `progresoDe`, `iniciarReto`, `guardarDia`, `estadoReto`, `reiniciarReto` por estos accesores nuevos (misma zona):

```js
  function pruebaDe(nombre) {
    var d = almacen.cargar();
    return (d.pruebas && d.pruebas[nombre]) ? d.pruebas[nombre] : null;
  }

  function estadoPrueba(nombre) {
    var p = pruebaDe(nombre);
    if (!p) return "sin-iniciar";
    if (p.conclusion && p.conclusion.estado && p.conclusion.estado !== "sin") return "hecho";
    return "encurso";
  }

  function iniciarPrueba(nombre, fechaISO, agenda, n) {
    n = n || 3;
    var fechas = calcularFechas(fechaISO, agenda, n);
    var dias = [];
    for (var i = 0; i < n; i++) {
      dias.push({ etiqueta: "Dosis " + (i + 1), cantidad: "", fecha: fechas[i] || "",
        dolor: 0, hinchazon: 0, gases: 0, notas: "", registrado: false });
    }
    var data = almacen.cargar();
    data.pruebas[nombre] = { alimento: nombre, agenda: agenda, dias: dias,
      conclusion: { estado: "sin", dosisIndex: null } };
    almacen.guardar(data);
  }

  function setCantidad(nombre, idx, cantidad) {
    var data = almacen.cargar(); var p = data.pruebas[nombre];
    if (!p || !p.dias[idx]) return;
    p.dias[idx].cantidad = cantidad; p.dias[idx].registrado = true;
    almacen.guardar(data);
  }

  function guardarDosis(nombre, idx, valores) {
    var data = almacen.cargar(); var p = data.pruebas[nombre];
    if (!p || !p.dias[idx]) return;
    var d = p.dias[idx];
    if (valores.cantidad != null) d.cantidad = valores.cantidad;
    d.dolor = valores.dolor || 0; d.hinchazon = valores.hinchazon || 0; d.gases = valores.gases || 0;
    if (valores.notas != null) d.notas = valores.notas;
    d.registrado = true;
    almacen.guardar(data);
  }

  function anadirDosis(nombre) {
    var data = almacen.cargar(); var p = data.pruebas[nombre];
    if (!p) return;
    var n = p.dias.length;
    var fechas = calcularFechas(p.dias[0] ? p.dias[0].fecha : aISO(new Date()), p.agenda, n + 1);
    p.dias.push({ etiqueta: "Dosis " + (n + 1), cantidad: "", fecha: fechas[n] || "",
      dolor: 0, hinchazon: 0, gases: 0, notas: "", registrado: false });
    almacen.guardar(data);
  }

  function setConclusion(nombre, estado, dosisIndex) {
    var data = almacen.cargar(); var p = data.pruebas[nombre];
    if (!p) return;
    p.conclusion = { estado: estado, dosisIndex: (dosisIndex == null ? null : Number(dosisIndex)) };
    almacen.guardar(data);
  }

  function reiniciarPrueba(nombre) {
    var data = almacen.cargar();
    if (data.pruebas[nombre]) { delete data.pruebas[nombre]; almacen.guardar(data); }
  }
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `node tools/run-tests.mjs`
Expected: PASS — `Tests: N ✓ / 0 ✗`.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(fase2): accesores de prueba por alimento (iniciar/cantidad/dosis/añadir/conclusión/reiniciar)"
```

---

## Phase 3 — Reintroducción UI (lista por alimentos + detalle)

> Nota: en esta fase el render aún usa el estado JS directo (`estadoFase2`); la integración con el historial (botón atrás) llega en la Fase 7 y se enganchará a estos mismos render.

### Task 6: Orden de la lista (helper) + tests

**Files:**
- Modify: `index.html` (zona de render Fase 2; tests)

- [ ] **Step 1: Tests (fallan)**

Añade en `registerTests` (tras los accesores):

```js
// ---- REINTRO: orden de la lista (reintroducibles primero) ----
var listaOrd = ordenarParaReintro([
  { nombre:"Zanahoria", nivel:"verde", fodmap:[] },
  { nombre:"Cebolla", nivel:"rojo", fodmap:["Fructanos"] },
  { nombre:"Calabacin", nivel:"amarillo", fodmap:["Fructanos"] }
]);
assert(listaOrd[0].nombre !== "Zanahoria", "los verdes no van primero");
assert(listaOrd[listaOrd.length - 1].nombre === "Zanahoria", "el verde queda al final");
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tools/run-tests.mjs`
Expected: FAIL — `ordenarParaReintro` no existe.

- [ ] **Step 3: Implementar**

Añade junto a los helpers de render Fase 2:

```js
  // Reintroducibles (rojo/amarillo, con FODMAP) primero; verdes al final. Estable por nombre.
  function ordenarParaReintro(lista) {
    function rango(a) { return (a.fodmap && a.fodmap.length) ? 0 : 1; }
    return lista.slice().sort(function (a, b) {
      var r = rango(a) - rango(b);
      if (r !== 0) return r;
      return normalizar(a.nombre) < normalizar(b.nombre) ? -1 : 1;
    });
  }
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `node tools/run-tests.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(reintro): helper de orden (reintroducibles primero, verdes al final)"
```

### Task 7: Estado de Reintro + render de la LISTA

**Files:**
- Modify: `index.html` (`var estadoFase2`, `renderFase2`)

- [ ] **Step 1: Reescribir el estado y `renderFase2` (lista)**

Sustituye `var estadoFase2 = { retoAbierto: null, resumen: false };` por:

```js
  var estadoFase2 = { texto: "", grupo: null, alimentoAbierto: null, resumen: false };
```

Sustituye `function renderFase2() { … }` por:

```js
  function renderFase2() {
    var v = document.getElementById("vista");
    if (!v) return;
    if (estadoFase2.resumen) { renderResumen(); return; }
    if (estadoFase2.alimentoAbierto) { renderAlimentoReto(estadoFase2.alimentoAbierto); return; }

    var base = ordenarParaReintro(DATOS);
    var resultados = base.filter(function (a) {
      if (estadoFase2.grupo && gruposDeAlimento(a).indexOf(estadoFase2.grupo) === -1) return false;
      if (!estadoFase2.texto) return true;
      return buscar(estadoFase2.texto, [a], null, false).length === 1;
    });

    var chips = ["Fructosa","Lactosa","Sorbitol","Manitol","Fructanos","GOS"].map(function (g) {
      return '<button class="chip' + (estadoFase2.grupo === g ? " activo" : "") +
        '" data-fgrupo="' + escapeHTML(g) + '">' + escapeHTML(g) + "</button>";
    }).join("");

    var cards = resultados.map(function (a) {
      var est = estadoPrueba(a.nombre);
      var etiqueta = est === "hecho" ? "Completado" : est === "encurso" ? "En curso" : "";
      var cls = est === "hecho" ? "hecho" : est === "encurso" ? "encurso" : "";
      var grupos = gruposDeAlimento(a);
      var badge = grupos.length ? grupos.join(" · ") : "ya seguro 🟢";
      return '<button class="reto-card" data-alim="' + escapeHTML(a.nombre) + '">' +
        '<div class="reto-info"><span class="reto-grupo">' + emojiNivel(a.nivel) + ' ' + escapeHTML(a.nombre) + '</span>' +
        '<span class="reto-sub">' + escapeHTML(badge) + '</span></div>' +
        (etiqueta ? '<span class="estado ' + cls + '">' + etiqueta + '</span>' : '') + '</button>';
    }).join("");

    v.innerHTML =
      '<header><h1>🔄 Reintroducción</h1>' +
      '<p class="aviso">Busca el alimento que te indique tu dietista, mira a qué grupo FODMAP pertenece y registra el reto. ' +
      'La app <strong>solo registra</strong>; la interpretación la haces con tu dietista.</p></header>' +
      '<input id="qf2" type="search" inputmode="search" placeholder="Busca un alimento… (ej. cebolla)" ' +
      'value="' + escapeHTML(estadoFase2.texto) + '" autocomplete="off" autocapitalize="off">' +
      '<div class="chips"><button class="chip' + (estadoFase2.grupo === null ? " activo" : "") +
      '" data-fgrupo="">Todos</button>' + chips + "</div>" +
      '<p class="conteo">' + resultados.length + ' alimento' + (resultados.length === 1 ? "" : "s") + '</p>' +
      (cards || '<p class="vacio">No se ha encontrado nada.</p>') +
      '<div class="btn-row">' +
        '<button class="btn sec" data-accion="resumen">📋 Ver resumen</button>' +
        '<button class="btn sec" data-accion="exportar">⬇️ Exportar copia</button>' +
        '<button class="btn sec" data-accion="importar">⬆️ Importar copia</button>' +
      '</div>' +
      (almacen.disponible() ? '' :
        '<p class="aviso">⚠️ Tu navegador no permite guardar automáticamente. Usa "Exportar copia" para no perder los datos.</p>') +
      '<footer>Protocolo orientativo basado en Monash FODMAP. No sustituye a tu dietista.</footer>';

    var q = document.getElementById("qf2");
    if (q) q.addEventListener("input", function (e) {
      estadoFase2.texto = e.target.value; renderFase2();
      var n = document.getElementById("qf2"); if (n) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (x) {} }
    });
    Array.prototype.forEach.call(v.querySelectorAll("[data-fgrupo]"), function (b) {
      b.addEventListener("click", function () { estadoFase2.grupo = b.getAttribute("data-fgrupo") || null; renderFase2(); });
    });
    Array.prototype.forEach.call(v.querySelectorAll("[data-alim]"), function (b) {
      b.addEventListener("click", function () { irAlimentoReto(b.getAttribute("data-alim")); });
    });
    wireAcciones(v);
  }
```

- [ ] **Step 2: Añadir el navegador de apertura (provisional; la Fase 7 lo conecta al historial)**

Añade cerca de `renderFase2`:

```js
  function irAlimentoReto(nombre) { estadoFase2.alimentoAbierto = nombre; renderFase2(); window.scrollTo(0, 0); }
```

- [ ] **Step 3: Verificar que la app carga (lógica)**

Run: `node tools/run-tests.mjs`
Expected: PASS — los tests siguen en verde (esta tarea no añade tests; valida que no se rompió la carga del script). Si falla por `renderAlimentoReto`/`renderResumen` no definidos en tiempo de ejecución, recuerda que solo se invocan bajo interacción; en `?test` no se llaman. Debe pasar.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(reintro): lista de alimentos con búsqueda y filtros por grupo FODMAP"
```

### Task 8: Render del DETALLE (ficha + reto de dosis variables + autosave + conclusión)

**Files:**
- Modify: `index.html` (sustituye `renderReto`/`bloqueDosisHTML` por `renderAlimentoReto`)

- [ ] **Step 1: Implementar el detalle**

Elimina `bloqueDosisHTML` y `renderReto`. Añade:

```js
  function bloqueDosisHTML(nombre, i, d) {
    function slider(clave, label, val) {
      return '<div class="slider-row"><label>' + label +
        ' <span class="sval" data-sval="' + clave + '-' + i + '">' + val + '</span></label>' +
        '<input type="range" min="0" max="10" value="' + val +
        '" data-slider="' + clave + '" data-idx="' + i + '"></div>';
    }
    return '<div class="dosis' + (d.registrado ? " guardado" : "") + '">' +
      '<h4>' + escapeHTML(d.etiqueta) + '</h4>' +
      '<p class="fecha">📅 ' + escapeHTML(d.fecha || "sin fecha") + (d.registrado ? ' · ✅ guardado' : '') + '</p>' +
      '<label>Cantidad (la que te indique tu dietista)' +
      '<input type="text" class="alim" data-cant="' + i + '" value="' + escapeHTML(d.cantidad || "") +
      '" placeholder="ej. 1/2 tostada" autocomplete="off"></label>' +
      slider("dolor", "Dolor", d.dolor) +
      slider("hinchazon", "Hinchazón", d.hinchazon) +
      slider("gases", "Gases", d.gases) +
      '<textarea class="notas" data-notas="' + i + '" placeholder="Notas (opcional)">' +
      escapeHTML(d.notas || "") + '</textarea>' +
      '</div>';
  }

  var CONCL_ETIQUETAS = { sin:"Sin concluir", tolera:"Tolero", limite:"Tolero con límite", no:"No tolero" };

  function renderAlimentoReto(nombre) {
    var v = document.getElementById("vista");
    if (!v) return;
    var a = DATOS.filter(function (x) { return x.nombre === nombre; })[0];
    if (!a) { estadoFase2.alimentoAbierto = null; renderFase2(); return; }
    var grupos = gruposDeAlimento(a);
    var agenda = agendaDeAlimento(a);
    var prueba = pruebaDe(nombre);

    var avisoGrupo = grupos.length === 0
      ? '<div class="lavado">Este alimento ya es seguro 🟢; normalmente no necesita reintroducción, pero puedes registrarlo igualmente.</div>'
      : (grupos.length > 1
        ? '<div class="lavado">⚠️ Este alimento tiene varios FODMAP (' + escapeHTML(grupos.join(", ")) +
          '); una reacción puede deberse a cualquiera de ellos.</div>'
        : '<div class="lavado">' + escapeHTML((GRUPOS_META[grupos[0]] || {}).nota || "") + '</div>');
    var agendaTxt = '<div class="lavado">' + (agenda === "alterna"
      ? "Se prueba en <strong>días alternos</strong> (día 1, 3, 5…): los síntomas pueden tardar hasta 48 h."
      : "Se prueba en <strong>días seguidos</strong> con cantidades crecientes.") + '</div>';

    var cuerpo;
    if (!prueba) {
      var hoy = aISO(new Date());
      cuerpo = avisoGrupo + agendaTxt +
        '<label>Fecha de la primera dosis<input type="date" id="fechaSel" class="alim" value="' + hoy + '"></label>' +
        '<div class="btn-row"><button class="btn" data-empezar="1">Empezar registro</button></div>';
    } else {
      var dias = prueba.dias.map(function (d, i) { return bloqueDosisHTML(nombre, i, d); }).join("");
      var concl = prueba.conclusion || { estado: "sin", dosisIndex: null };
      var opcsEstado = ["sin","tolera","limite","no"].map(function (e) {
        return '<option value="' + e + '"' + (concl.estado === e ? " selected" : "") + '>' + CONCL_ETIQUETAS[e] + '</option>';
      }).join("");
      var opcsDosis = prueba.dias.map(function (d, i) {
        return '<option value="' + i + '"' + (concl.dosisIndex === i ? " selected" : "") + '>' +
          escapeHTML(d.etiqueta + (d.cantidad ? " — " + d.cantidad : "")) + '</option>';
      }).join("");
      cuerpo = avisoGrupo + agendaTxt + dias +
        '<div class="btn-row"><button class="btn sec" data-anadir="1">➕ Añadir dosis</button></div>' +
        '<div class="conclusion"><h4>Tu conclusión</h4>' +
        '<label>¿Lo toleras?<select class="alim" id="conclEstado">' + opcsEstado + '</select></label>' +
        '<label id="conclDosisWrap"' + (concl.estado === "limite" ? "" : " hidden") +
        '>¿Hasta qué cantidad?<select class="alim" id="conclDosis">' + opcsDosis + '</select></label></div>' +
        '<span class="autosave" id="autosave" hidden>guardado ✓</span>' +
        '<div class="btn-row"><button class="btn peligro" data-reiniciar="1">Reiniciar este alimento</button></div>';
    }

    v.innerHTML =
      '<button class="volver" data-volver-f2="1">‹ Volver a la lista</button>' +
      fichaHTML(a).replace('<button class="volver" data-volver="1">‹ Volver a la búsqueda</button>', '') +
      '<div class="ficha-cab"><h2>Reintroducción</h2>' +
      '<p class="ficha-cat">Grupo: ' + escapeHTML(grupos.length ? grupos.join(" · ") : "ninguno (ya seguro)") + '</p></div>' +
      cuerpo;

    wireDetalleReto(v, nombre, a, agenda);
  }

  function flashAutosave() {
    var s = document.getElementById("autosave");
    if (!s) return; s.hidden = false;
  }

  function wireDetalleReto(v, nombre, a, agenda) {
    var emp = v.querySelector("[data-empezar]");
    if (emp) emp.addEventListener("click", function () {
      var fch = document.getElementById("fechaSel");
      var fecha = (fch && fch.value) ? fch.value : aISO(new Date());
      iniciarPrueba(nombre, fecha, agenda, 3);
      renderFase2(); window.scrollTo(0, 0);
    });

    Array.prototype.forEach.call(v.querySelectorAll("input[data-slider]"), function (s) {
      s.addEventListener("input", function () {
        var idx = Number(s.getAttribute("data-idx"));
        var span = v.querySelector('[data-sval="' + s.getAttribute("data-slider") + "-" + idx + '"]');
        if (span) span.textContent = s.value;
        function valor(clave) { var el = v.querySelector('input[data-slider="' + clave + '"][data-idx="' + idx + '"]'); return el ? Number(el.value) : 0; }
        guardarDosis(nombre, idx, { dolor: valor("dolor"), hinchazon: valor("hinchazon"), gases: valor("gases") });
        flashAutosave();
      });
    });

    Array.prototype.forEach.call(v.querySelectorAll("[data-cant]"), function (inp) {
      inp.addEventListener("input", function () {
        setCantidad(nombre, Number(inp.getAttribute("data-cant")), inp.value); flashAutosave();
      });
    });

    Array.prototype.forEach.call(v.querySelectorAll("[data-notas]"), function (ta) {
      var t = null;
      ta.addEventListener("input", function () {
        if (t) clearTimeout(t);
        t = setTimeout(function () {
          guardarDosis(nombre, Number(ta.getAttribute("data-notas")), { notas: ta.value }); flashAutosave();
        }, 400);
      });
    });

    var anad = v.querySelector("[data-anadir]");
    if (anad) anad.addEventListener("click", function () { anadirDosis(nombre); renderFase2(); });

    var ce = document.getElementById("conclEstado");
    if (ce) ce.addEventListener("change", function () {
      var dosisWrap = document.getElementById("conclDosisWrap");
      var dosisSel = document.getElementById("conclDosis");
      var di = (ce.value === "limite" && dosisSel) ? Number(dosisSel.value) : null;
      if (dosisWrap) dosisWrap.hidden = (ce.value !== "limite");
      setConclusion(nombre, ce.value, di); flashAutosave();
      renderFase2();
    });
    var cd = document.getElementById("conclDosis");
    if (cd) cd.addEventListener("change", function () { setConclusion(nombre, "limite", Number(cd.value)); flashAutosave(); });

    var rei = v.querySelector("[data-reiniciar]");
    if (rei) rei.addEventListener("click", function () {
      if (window.confirm("¿Borrar los datos de este alimento y empezar de nuevo?")) { reiniciarPrueba(nombre); renderFase2(); window.scrollTo(0, 0); }
    });

    Array.prototype.forEach.call(v.querySelectorAll("[data-volver-f2]"), function (b) {
      b.addEventListener("click", function () { estadoFase2.alimentoAbierto = null; renderFase2(); window.scrollTo(0, 0); });
    });
  }
```

- [ ] **Step 2: Añadir CSS mínimo**

En el `<style>`, junto a los estilos de Fase 2, añade:

```css
    .conclusion{border:1px solid var(--linea);border-radius:12px;padding:12px;margin:12px 0;background:var(--sup)}
    .autosave{display:inline-block;color:var(--verde,#2F8F6B);font-size:.85rem;margin:4px 0}
```

- [ ] **Step 3: Verificar lógica**

Run: `node tools/run-tests.mjs`
Expected: PASS (sin tests nuevos; valida que el script carga sin errores de sintaxis).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(reintro): detalle con ficha completa, dosis variables, guardado automático y conclusión"
```

---

## Phase 4 — Resumen para la dietista

### Task 9: `resumenPorGrupo()` + `renderResumen`

**Files:**
- Modify: `index.html` (sustituye `resumenFase2PorGrupo`/`sugerirLimiteDosis`/`renderResumen`)

- [ ] **Step 1: Tests (fallan)**

Sustituye el bloque `// ---- FASE 3: resumen de Fase 2 …` por:

```js
// ---- REINTRO: resumen por grupo ----
almacen._mem = { version: 2, pruebas: {} };
iniciarPrueba("Cebolla", "2026-06-01", "alterna");
guardarDosis("Cebolla", 0, { dolor: 1, hinchazon: 2, gases: 0, notas: "" });
guardarDosis("Cebolla", 1, { dolor: 6, hinchazon: 3, gases: 1, notas: "" });
setConclusion("Cebolla", "limite", 0);
var rg = resumenPorGrupo(DATOS);
assert(rg["Fructanos"] && rg["Fructanos"].length >= 1, "Cebolla aparece bajo Fructanos");
var fila = rg["Fructanos"].filter(function (x) { return x.alimento === "Cebolla"; })[0];
assert(fila && fila.dias[0].pico === 2, "pico dosis 1 = max(1,2,0) = 2");
assert(fila.dias[1].pico === 6, "pico dosis 2 = 6");
assert(fila.conclusion.estado === "limite", "el resumen incluye la conclusión");
almacen._mem = { version: 2, pruebas: {} };
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tools/run-tests.mjs`
Expected: FAIL — `resumenPorGrupo` no existe.

- [ ] **Step 3: Implementar**

Sustituye `resumenFase2PorGrupo` y `sugerirLimiteDosis` por:

```js
  function pico(d) { return Math.max(d.dolor || 0, d.hinchazon || 0, d.gases || 0); }

  function resumenPorGrupo(datos) {
    var out = {};
    ["Fructosa","Lactosa","Sorbitol","Manitol","Fructanos","GOS","Otros"].forEach(function (g) { out[g] = []; });
    var data = almacen.cargar();
    Object.keys(data.pruebas || {}).forEach(function (nombre) {
      var p = data.pruebas[nombre];
      var al = datos.filter(function (x) { return x.nombre === nombre; })[0];
      var grupos = al ? gruposDeAlimento(al) : [];
      if (!grupos.length) grupos = ["Otros"];
      var fila = { alimento: nombre,
        dias: p.dias.map(function (d) { return { etiqueta: d.etiqueta, cantidad: d.cantidad, pico: pico(d), registrado: d.registrado }; }),
        conclusion: p.conclusion || { estado: "sin", dosisIndex: null } };
      grupos.forEach(function (g) { if (out[g]) out[g].push(fila); });
    });
    return out;
  }
```

Y sustituye `function renderResumen()` por:

```js
  function renderResumen() {
    var v = document.getElementById("vista");
    if (!v) return;
    var rg = resumenPorGrupo(DATOS);
    var bloques = Object.keys(rg).filter(function (g) { return rg[g].length; }).map(function (g) {
      var filas = rg[g].map(function (f) {
        var celdas = f.dias.map(function (d) {
          return '<td>' + escapeHTML(d.cantidad || d.etiqueta) + '<br><span class="' + (d.pico >= 4 ? "alto" : "") + '">pico ' + d.pico + '</span></td>';
        }).join("");
        return '<tr><th>' + escapeHTML(f.alimento) + '<br><small>' + escapeHTML(CONCL_ETIQUETAS[f.conclusion.estado]) + '</small></th>' + celdas + '</tr>';
      }).join("");
      return '<div class="resumen-grupo"><h3>' + escapeHTML(g) + '</h3><table>' + filas + '</table></div>';
    }).join("");
    v.innerHTML =
      '<button class="volver" data-volver-f2="1">‹ Volver</button>' +
      '<header><h1>📋 Resumen</h1><p class="aviso">Para enseñar a tu dietista. La app registra, no diagnostica.</p></header>' +
      (bloques || '<p class="vacio">Aún no has registrado ningún alimento.</p>') +
      '<footer>Picos 0-10 (máximo de dolor/hinchazón/gases por dosis).</footer>';
    Array.prototype.forEach.call(v.querySelectorAll("[data-volver-f2]"), function (b) {
      b.addEventListener("click", function () { estadoFase2.resumen = false; renderFase2(); window.scrollTo(0, 0); });
    });
  }
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `node tools/run-tests.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(reintro): resumen para la dietista por grupo -> alimentos -> picos + conclusión"
```

---

## Phase 5 — Personalización (Fase 3) por alimento

### Task 10: Almacén F3 v2 (manuales) + accesores

**Files:**
- Modify: `index.html` (`var almacenF3`, `toleranciaDe`/`setTolerancia`; tests Fase 3)

- [ ] **Step 1: Tests (fallan)**

Sustituye el bloque `// ---- FASE 3: persistencia ----` por:

```js
// ---- FASE 3 v2: manuales ----
almacenF3._mem = null; try { localStorage.removeItem("sii_fodmap_fase3_v1"); } catch (e) {}
var f3 = almacenF3.cargar();
assert(f3 && f3.version === 2 && f3.manuales && typeof f3.manuales === "object", "F3 v2 estructura vacía");
assert(f3.verSegunTolerancia === false, "verSegunTolerancia por defecto false");
setManual("Pasta", "tolera", "", "me sienta bien");
assert(manualDe("Pasta").estado === "tolera", "setManual guarda 'tolera'");
assert(manualesLista().length === 1, "manualesLista devuelve 1");
setManual("Pasta", "limite", "1 plato", "");
assert(manualDe("Pasta").estado === "limite" && manualDe("Pasta").cantidad === "1 plato", "setManual actualiza");
borrarManual("Pasta");
assert(manualDe("Pasta") === null, "borrarManual elimina");
// migración v1 (tolerancias por grupo) -> v2: se conservan pero no se usan
almacenF3._mem = null;
localStorage.setItem("sii_fodmap_fase3_v1", JSON.stringify({ version:1, tolerancias:{ "fructosa":{estado:"tolera"} }, verSegunTolerancia:true }));
var mg = almacenF3.cargar();
assert(mg.version === 2 && mg.manuales && Object.keys(mg.manuales).length === 0, "migración F3: manuales vacío");
assert(mg.verSegunTolerancia === true, "migración F3 conserva el interruptor");
assert(mg.tolerancias_legacy && mg.tolerancias_legacy.fructosa, "migración F3 conserva lo viejo en tolerancias_legacy");
almacenF3._mem = { version:2, manuales:{}, verSegunTolerancia:false };
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tools/run-tests.mjs`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Sustituye `var almacenF3` y las funciones `toleranciaDe`/`setTolerancia`/`hayAlgunaTolerancia`/`setVerSegunTolerancia` por:

```js
  var STORAGE_KEY_F3 = "sii_fodmap_fase3_v1";

  function migrarFase3(p) {
    if (!p || typeof p !== "object") return { version: 2, manuales: {}, verSegunTolerancia: false };
    if (p.version === 2 && p.manuales) return p;
    return { version: 2, manuales: {}, verSegunTolerancia: !!p.verSegunTolerancia,
      tolerancias_legacy: (p.tolerancias && typeof p.tolerancias === "object") ? p.tolerancias : undefined };
  }

  var almacenF3 = {
    _mem: null,
    cargar: function () {
      if (this._mem) return this._mem;
      var base = { version: 2, manuales: {}, verSegunTolerancia: false };
      try { var raw = localStorage.getItem(STORAGE_KEY_F3); if (raw) base = migrarFase3(JSON.parse(raw)); } catch (e) {}
      this._mem = base; return base;
    },
    guardar: function (data) { this._mem = data; try { localStorage.setItem(STORAGE_KEY_F3, JSON.stringify(data)); return true; } catch (e) { return false; } }
  };

  function manualDe(nombre) { var m = almacenF3.cargar().manuales; return (m && m[nombre]) ? m[nombre] : null; }
  function manualesLista() { var m = almacenF3.cargar().manuales || {}; return Object.keys(m).map(function (k) { return { nombre: k, estado: m[k].estado, cantidad: m[k].cantidad, nota: m[k].nota }; }); }
  function setManual(nombre, estado, cantidad, nota) {
    var d = almacenF3.cargar(); d.manuales[nombre] = { estado: estado, cantidad: cantidad || "", nota: nota || "" }; almacenF3.guardar(d);
  }
  function borrarManual(nombre) { var d = almacenF3.cargar(); if (d.manuales[nombre]) { delete d.manuales[nombre]; almacenF3.guardar(d); } }
  function setVerSegunTolerancia(on) { var d = almacenF3.cargar(); d.verSegunTolerancia = !!on; almacenF3.guardar(d); }
```

Elimina `exportarTodo`/`importarTodo` viejos y reescríbelos para el formato nuevo:

```js
  function exportarTodo() { return JSON.stringify({ app: "sii-fodmap", fase2: almacen.cargar(), fase3: almacenF3.cargar() }, null, 2); }
  function importarTodo(json) {
    var p; try { p = JSON.parse(json); } catch (e) { return false; }
    if (!p || typeof p !== "object") return false;
    if (p.fase2 && (p.fase2.pruebas || p.fase2.retos)) {
      almacen.guardar(migrarFase2(p.fase2));
      if (p.fase3 && typeof p.fase3 === "object") almacenF3.guardar(migrarFase3(p.fase3));
      return true;
    }
    if (p.pruebas || p.retos) { almacen.guardar(migrarFase2(p)); return true; } // copia "pelada" de Fase 2
    return false;
  }
```

- [ ] **Step 4: Actualizar los tests de copia unificada**

Sustituye el bloque `// ---- FASE 3: copia de seguridad unificada ----` por:

```js
// ---- COPIA unificada v2 ----
almacen._mem = { version: 2, pruebas: {} }; almacenF3._mem = { version: 2, manuales: {}, verSegunTolerancia: false };
iniciarPrueba("Leche normal", "2026-06-01", "seguida"); setManual("Pasta", "tolera", "", "");
var copia = exportarTodo();
almacen._mem = { version: 2, pruebas: {} }; almacenF3._mem = { version: 2, manuales: {}, verSegunTolerancia: false };
assert(importarTodo(copia) === true, "importarTodo v2 funciona");
assert(pruebaDe("Leche normal") && pruebaDe("Leche normal").alimento === "Leche normal", "restaura Fase 2");
assert(manualDe("Pasta") && manualDe("Pasta").estado === "tolera", "restaura Fase 3 manuales");
var viejo = JSON.stringify({ version: 1, retos: { "gos": { alimentoElegido: "Garbanzos de bote", dias: [] } } });
almacen._mem = { version: 2, pruebas: {} };
assert(importarTodo(viejo) === true, "importarTodo acepta copia antigua (v1)");
assert(pruebaDe("Garbanzos de bote"), "copia antigua migra a pruebas");
assert(importarTodo("{ no es json") === false, "JSON inválido -> false");
assert(importarTodo('{"foo":1}') === false, "sin secciones -> false");
almacen._mem = { version: 2, pruebas: {} }; almacenF3._mem = { version: 2, manuales: {}, verSegunTolerancia: false };
```

- [ ] **Step 5: Ejecutar y ver pasar**

Run: `node tools/run-tests.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(fase3): almacén v2 (manuales) + migración que conserva lo viejo + copia unificada v2"
```

### Task 11: Mapa de tolerancia por alimento + recolor (`aplicarTolerancia`)

**Files:**
- Modify: `index.html` (sustituye `peorEstado`/`estadoFodmap`/`nivelPersonalizado`/`aplicarTolerancia`/`hayAlgunaTolerancia`; tests de re-coloreado)

- [ ] **Step 1: Tests (fallan)**

Sustituye los bloques `// ---- FASE 3: lógica de re-coloreado (pura) ----` y `// ---- FASE 3: aplicarTolerancia …` por:

```js
// ---- FASE 3 v2: tolerancia por alimento + recolor ----
almacen._mem = { version: 2, pruebas: {} }; almacenF3._mem = { version: 2, manuales: {}, verSegunTolerancia: false };
// derivada: conclusión de una prueba
iniciarPrueba("Cebolla", "2026-06-01", "alterna"); setConclusion("Cebolla", "tolera", null);
var mapa = mapaToleranciaPorAlimento();
assert(mapa["Cebolla"] === "tolera", "la conclusión 'tolera' entra en el mapa");
// manual
setManual("Pasta", "limite", "1 plato", "");
assert(mapaToleranciaPorAlimento()["Pasta"] === "limite", "el manual entra en el mapa");
// fusión: la derivada manda sobre el manual del mismo alimento
setManual("Cebolla", "no", "", "");
assert(mapaToleranciaPorAlimento()["Cebolla"] === "tolera", "la derivada manda sobre el manual");
// recolor
assert(hayAlgunaTolerancia() === true, "hay tolerancias");
var muestra = [{ nombre:"Cebolla", nivel:"rojo", fodmap:["Fructanos"], categoria:"Verduras", sinonimos:[] }];
almacenF3._mem.verSegunTolerancia = false;
assert(aplicarTolerancia(muestra)[0].nivel === "rojo", "toggle off no cambia");
almacenF3._mem.verSegunTolerancia = true;
var ap = aplicarTolerancia(muestra);
assert(ap[0].nivel === "verde", "Cebolla tolerada -> verde");
assert(ap[0]._antes === "rojo", "guarda el nivel oficial en _antes");
assert(muestra[0].nivel === "rojo", "no muta el original");
var muestra2 = [{ nombre:"Pasta", nivel:"rojo", fodmap:["Fructanos"], categoria:"Cereales y pan", sinonimos:[] }];
assert(aplicarTolerancia(muestra2)[0].nivel === "amarillo", "límite -> amarillo");
var muestra3 = [{ nombre:"X", nivel:"verde", fodmap:[], categoria:"Verduras", sinonimos:[] }];
assert(aplicarTolerancia(muestra3)[0].nivel === "verde", "un verde sin marca no cambia");
almacen._mem = { version: 2, pruebas: {} }; almacenF3._mem = { version: 2, manuales: {}, verSegunTolerancia: false };
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tools/run-tests.mjs`
Expected: FAIL — `mapaToleranciaPorAlimento` no existe.

- [ ] **Step 3: Implementar**

Sustituye `peorEstado`, `estadoFodmap`, `nivelPersonalizado`, `aplicarTolerancia` y `hayAlgunaTolerancia` por:

```js
  // Une conclusiones de la reintroducción (mandan) + manuales. nombre -> "tolera"|"limite"|"no".
  function mapaToleranciaPorAlimento() {
    var mapa = {};
    var man = almacenF3.cargar().manuales || {};
    Object.keys(man).forEach(function (n) { if (man[n] && man[n].estado) mapa[n] = man[n].estado; });
    var pr = almacen.cargar().pruebas || {};
    Object.keys(pr).forEach(function (n) {
      var c = pr[n].conclusion;
      if (c && c.estado && c.estado !== "sin") mapa[n] = c.estado; // la derivada pisa al manual
    });
    return mapa;
  }

  function hayAlgunaTolerancia() {
    var mapa = mapaToleranciaPorAlimento();
    return Object.keys(mapa).some(function (n) { return mapa[n] === "tolera" || mapa[n] === "limite"; });
  }

  var ORDEN_NIVEL = { rojo: 0, amarillo: 1, verde: 2 };
  function aplicarTolerancia(lista) {
    var cfg = almacenF3.cargar();
    if (!cfg.verSegunTolerancia) return lista;
    var mapa = mapaToleranciaPorAlimento();
    return lista.map(function (a) {
      var est = mapa[a.nombre];
      if (!est || est === "no") return a;
      var destino = est === "tolera" ? "verde" : "amarillo";
      if (ORDEN_NIVEL[destino] <= ORDEN_NIVEL[a.nivel]) return a; // nunca empeorar
      var copia = {}; for (var k in a) { if (Object.prototype.hasOwnProperty.call(a, k)) copia[k] = a[k]; }
      copia.nivel = destino; copia._antes = a.nivel; return copia;
    });
  }
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `node tools/run-tests.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(fase3): tolerancia por alimento (derivada+manual, derivada manda) y recolor del Buscador"
```

### Task 12: `renderFase3` nueva (Parte 1 derivada + Parte 2 manual)

**Files:**
- Modify: `index.html` (sustituye `renderFase3`)

- [ ] **Step 1: Implementar**

Sustituye `function renderFase3()` por:

```js
  function renderFase3() {
    var v = document.getElementById("vista");
    if (!v) return;
    var pr = almacen.cargar().pruebas || {};
    var derivados = Object.keys(pr).filter(function (n) { var c = pr[n].conclusion; return c && c.estado && c.estado !== "sin"; });

    var parte1 = derivados.length ? derivados.map(function (n) {
      var p = pr[n]; var c = p.conclusion;
      var al = DATOS.filter(function (x) { return x.nombre === n; })[0];
      var grupos = al ? gruposDeAlimento(al) : [];
      var cant = (c.estado === "limite" && c.dosisIndex != null && p.dias[c.dosisIndex]) ? (p.dias[c.dosisIndex].cantidad || p.dias[c.dosisIndex].etiqueta) : "";
      return '<div class="tol-card"><h3>' + escapeHTML(n) + '</h3>' +
        '<p class="tol-picos">' + escapeHTML(grupos.join(" · ") || "sin grupo") + '</p>' +
        '<p><strong>' + escapeHTML(CONCL_ETIQUETAS[c.estado]) + (cant ? " — " + escapeHTML(cant) : "") + '</strong></p>' +
        '<button class="btn sec" data-abrir-alim="' + escapeHTML(n) + '">Ver / editar el reto</button></div>';
    }).join("") : '<p class="vacio">Aún no has concluido ninguna reintroducción.</p>';

    var manuales = manualesLista();
    var parte2 = manuales.length ? manuales.map(function (m) {
      return '<div class="tol-card"><h3>' + escapeHTML(m.nombre) + '</h3>' +
        '<p><strong>' + escapeHTML(CONCL_ETIQUETAS[m.estado] || m.estado) + (m.cantidad ? " — " + escapeHTML(m.cantidad) : "") + '</strong>' +
        (m.nota ? '<br><small>' + escapeHTML(m.nota) + '</small>' : '') + '</p>' +
        '<button class="btn sec peligro" data-del-manual="' + escapeHTML(m.nombre) + '">Quitar</button></div>';
    }).join("") : '<p class="vacio">No has añadido alimentos a mano.</p>';

    v.innerHTML =
      '<header><h1>🌱 Personalización</h1><p class="aviso">Lo que toleras, en personal. La app registra lo que tú decides; no diagnostica.</p></header>' +
      '<h2>1 · De tus reintroducciones</h2>' + parte1 +
      '<h2>2 · Añadidos a mano</h2>' +
      '<p class="intro">Alimentos que no pasaste por reintroducción y sabes por experiencia que toleras (o no).</p>' + parte2 +
      '<div class="btn-row"><button class="btn" data-add-manual="1">➕ Añadir alimento</button></div>' +
      '<div class="btn-row"><button class="btn sec" data-accion="exportar">⬇️ Exportar copia</button>' +
      '<button class="btn sec" data-accion="importar">⬆️ Importar copia</button></div>' +
      '<footer>En el Buscador puedes activar "🌱 Ver según mi tolerancia".</footer>';

    Array.prototype.forEach.call(v.querySelectorAll("[data-abrir-alim]"), function (b) {
      b.addEventListener("click", function () { navegar("fase2"); irAlimentoReto(b.getAttribute("data-abrir-alim")); });
    });
    Array.prototype.forEach.call(v.querySelectorAll("[data-del-manual]"), function (b) {
      b.addEventListener("click", function () { borrarManual(b.getAttribute("data-del-manual")); renderFase3(); });
    });
    var add = v.querySelector("[data-add-manual]");
    if (add) add.addEventListener("click", function () {
      var nombre = window.prompt("¿Qué alimento? (puedes escribir uno que no esté en el buscador)");
      if (!nombre) return;
      var estado = window.prompt("¿Lo toleras? escribe: tolera / limite / no", "tolera");
      if (["tolera","limite","no"].indexOf(estado) === -1) { window.alert("Escribe tolera, limite o no."); return; }
      var cantidad = (estado === "limite") ? (window.prompt("¿Hasta qué cantidad?", "") || "") : "";
      setManual(nombre, estado, cantidad, "");
      renderFase3();
    });
    wireAcciones(v);
  }
```

(Nota: el alta manual usa `window.prompt` por simplicidad y porque la app no tiene framework de formularios modales; respeta el estilo minimalista existente.)

- [ ] **Step 2: Verificar lógica**

Run: `node tools/run-tests.mjs`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(fase3): vista nueva por alimento (derivada de reintroducción + manual)"
```

### Task 13: Buscador — interruptor por alimento

**Files:**
- Modify: `index.html` (`render()` del Buscador, banner de tolerancia)

- [ ] **Step 1: Ajustar el texto del banner**

En `render()`, donde dice `'🌱 Viendo según tu tolerancia. Cada ficha mantiene su clasificación oficial.'`, déjalo igual (sigue valiendo). Verifica que el checkbox `verTol` aparece cuando `hayAlgunaTolerancia()` (ya lo hace). No hay cambio de lógica: `aplicarTolerancia` ya es por alimento.

- [ ] **Step 2: Verificar**

Run: `node tools/run-tests.mjs`
Expected: PASS.

- [ ] **Step 3: Commit (si hubo cambios)**

```bash
git add index.html
git commit -m "chore(buscador): el interruptor de tolerancia usa el recolor por alimento"
```

---

## Phase 6 — Navegación con el botón "atrás"

### Task 14: Reductor de navegación (puro) + "pulsa otra vez para salir"

**Files:**
- Modify: `index.html` (cerca de `var vistaActual`; tests)

- [ ] **Step 1: Tests (fallan)**

Añade en `registerTests` (al final, antes de las limpiezas finales):

```js
// ---- NAVEGACIÓN: lógica pura ----
assert(rutaInicial().tab === "buscador", "ruta inicial = buscador");
var r1 = aplicarRuta(rutaInicial(), { tab: "fase2" });
assert(r1.tab === "fase2" && r1.sub === null, "navegar a fase2 limpia subvista");
var r2 = aplicarRuta(r1, { tab: "fase2", sub: "alimento", alim: "Cebolla" });
assert(r2.sub === "alimento" && r2.alim === "Cebolla", "abrir alimento guarda parámetro");
// pulsa otra vez para salir
assert(decidirSalida(false, 1000, 0).armar === true, "primer back en la raíz: arma el aviso, no sale");
assert(decidirSalida(true, 1500, 1000).salir === true, "segundo back dentro de 2s: sale");
assert(decidirSalida(true, 4000, 1000).salir === false, "segundo back pasados >2s: no sale, re-arma");
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `node tools/run-tests.mjs`
Expected: FAIL.

- [ ] **Step 3: Implementar (funciones puras)**

Cerca de `var vistaActual = "buscador";` añade:

```js
  function rutaInicial() { return { tab: "buscador", sub: null, alim: null }; }
  function aplicarRuta(actual, cambio) {
    var r = { tab: cambio.tab || actual.tab, sub: (cambio.sub !== undefined ? cambio.sub : null),
              alim: (cambio.alim !== undefined ? cambio.alim : null) };
    return r;
  }
  // armado: si ya estaba armado el aviso de salida. ahora/ultimo: timestamps ms. Ventana 2s.
  function decidirSalida(armado, ahora, ultimo) {
    if (armado && (ahora - ultimo) <= 2000) return { armar: false, salir: true };
    return { armar: true, salir: false };
  }
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `node tools/run-tests.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(nav): reductor de ruta puro + lógica 'pulsa otra vez para salir' (testeable)"
```

### Task 15: Conectar el historial (pushState/popstate) a la UI

**Files:**
- Modify: `index.html` (`renderApp`, `navegar`, `irAlimentoReto`, sub-vistas, `init`)

- [ ] **Step 1: Implementar la capa de historial**

Añade un gestor de ruta y reescribe `navegar`:

```js
  var rutaActual = rutaInicial();
  var salirArmado = false, salirUltimo = 0, salirTimer = null;

  function pintarRuta(r) {
    rutaActual = r;
    vistaActual = r.tab;
    if (r.tab === "fase2") { estadoFase2.resumen = (r.sub === "resumen"); estadoFase2.alimentoAbierto = (r.sub === "alimento" ? r.alim : null); }
    renderApp();
    window.scrollTo(0, 0);
  }

  function irA(cambio) {
    var r = aplicarRuta(rutaActual, cambio);
    history.pushState(r, "");
    pintarRuta(r);
  }

  function navegar(tab) { irA({ tab: tab, sub: null, alim: null }); }
```

Reescribe `irAlimentoReto` para que use el historial:

```js
  function irAlimentoReto(nombre) { irA({ tab: "fase2", sub: "alimento", alim: nombre }); }
```

En `wireAcciones`, donde la acción `"resumen"` hace `estadoFase2.resumen = true; renderFase2();`, cámbialo por `irA({ tab:"fase2", sub:"resumen", alim:null });`.

En los handlers `[data-volver-f2]`, `[data-empezar]`, `[data-reiniciar]`, `[data-anadir]` y `[data-volver]` (Buscador), sustituye las llamadas a `renderFase2()`/`render()` que **vuelven atrás** por `history.back()`. Mantén `renderFase2()` (re-render en el sitio) en los que NO cambian de pantalla (sliders, conclusión). Concretamente:
- "Volver a la lista" / "Volver" del resumen / "Volver a la búsqueda" del Buscador → `history.back();`.
- "Empezar registro", "Reiniciar", "Añadir dosis" → tras modificar datos, `pintarRuta(rutaActual);` (re-render sin nuevo paso).

- [ ] **Step 2: Manejar `popstate` y la salida; arrancar con una ruta base**

Sustituye `function init()` por:

```js
  function init() {
    if (location.search.indexOf("test") !== -1) { runTests(); return; }
    history.replaceState(rutaInicial(), "");
    pintarRuta(rutaInicial());

    window.addEventListener("popstate", function (e) {
      if (e.state && e.state.tab) {
        salirArmado = false;
        pintarRuta(e.state);
        return;
      }
      // estado sin ruta = intento de salir desde la raíz
      var ahora = Date.now();
      var d = decidirSalida(salirArmado, ahora, salirUltimo);
      if (d.salir) { history.back(); return; }   // deja salir de verdad
      salirArmado = true; salirUltimo = ahora;
      history.pushState(rutaInicial(), "");        // re-arma el buffer
      mostrarToast("Pulsa atrás otra vez para salir");
      if (salirTimer) clearTimeout(salirTimer);
      salirTimer = setTimeout(function () { salirArmado = false; }, 2000);
    });
  }
```

Añade un toast mínimo:

```js
  function mostrarToast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.style.display = "block";
    setTimeout(function () { t.style.display = "none"; }, 1900);
  }
```

Y CSS:

```css
    .toast{position:fixed;bottom:72px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 16px;border-radius:20px;z-index:9998;font-size:.9rem}
```

- [ ] **Step 3: Verificar lógica + carga**

Run: `node tools/run-tests.mjs`
Expected: PASS (la lógica pura ya está cubierta; el wiring de historial no se ejercita en `?test`).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(nav): historial integrado (pushState/popstate); el botón atrás navega dentro de la app"
```

---

## Phase 7 — Cierre: limpieza, publicación y verificación final

### Task 16: Quitar código muerto y revisar referencias

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Buscar referencias colgantes**

Run: `git grep -nE "RETOS|progresoDe|iniciarReto|guardarDia|estadoReto|reiniciarReto|resumenFase2PorGrupo|sugerirLimiteDosis|toleranciaDe|setTolerancia|nivelPersonalizado|estadoFodmap|peorEstado|aplicarTolerancia\(|renderReto" -- index.html`
Expected: **sin resultados** salvo dentro de definiciones nuevas (`aplicarTolerancia` reescrita). Si aparece alguna referencia viva a algo eliminado, corrígela (eliminándola o apuntando a la función nueva).

- [ ] **Step 2: Verificar**

Run: `node tools/run-tests.mjs`
Expected: PASS.

- [ ] **Step 3: Commit (si hubo limpieza)**

```bash
git add index.html
git commit -m "chore: eliminar código muerto del modelo por grupo"
```

### Task 17: Subir versión del Service Worker

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Incrementar `VERSION`**

En `sw.js`, localiza la constante de versión (actual `v6`) y súbela a `v7`.

Run: `git grep -nE "v6|VERSION" -- sw.js`
Expected: ver la línea de versión; tras el cambio debe decir `v7`.

- [ ] **Step 2: Commit**

```bash
git add sw.js
git commit -m "chore(pwa): SW v7 para forzar el banner de actualización"
```

### Task 18: Actualizar `ESTADO.md` y verificación final

**Files:**
- Modify: `ESTADO.md`

- [ ] **Step 1: Actualizar el estado**

En `ESTADO.md`: actualizar la fecha; en "Módulos" reescribir Fase 2 (ahora por alimentos) y Fase 3 (por alimento, derivada + manual); añadir una fila al historial con fecha 2026-06-07 y el hito "Reestructuración por alimentos + botón atrás"; actualizar el nº de tests al valor real que reporte el arnés; en "Cómo trabajar", añadir que los tests se verifican con `node tools/run-tests.mjs`.

- [ ] **Step 2: Verificación final completa**

Run: `node tools/run-tests.mjs`
Expected: `Tests: N ✓ / 0 ✗` y exit 0.

- [ ] **Step 3: Commit**

```bash
git add ESTADO.md
git commit -m "docs: ESTADO al día tras la reestructuración por alimentos"
```

---

## Verificación manual recomendada (en móvil, tras publicar)

El arnés Node cubre la lógica, pero estas cosas dependen del navegador real y conviene probarlas a mano:

1. **Reintro**: buscar "cebolla", ver su grupo (Fructanos), abrir, empezar registro, mover deslizadores → comprobar "guardado ✓" sin pulsar nada; cerrar y reabrir la app → los datos siguen.
2. **Añadir dosis**: añadir una 4ª dosis y ver que aparece con su fecha.
3. **Conclusión**: marcar "Tolero con límite" → elegir cantidad → verla reflejada en Personalización (Parte 1).
4. **Fase 3 manual**: añadir un alimento a mano y verlo en la Parte 2.
5. **Buscador**: activar "🌱 Ver según mi tolerancia" → el alimento tolerado se ve 🟢 (con "antes 🔴").
6. **Botón atrás (Android)**: Buscador → Reintro → abrir alimento → atrás vuelve a la lista; atrás vuelve a Buscador; **atrás en Buscador** muestra "Pulsa atrás otra vez para salir"; pulsar de nuevo cierra.

---

## Self-Review (hecha al escribir el plan)

- **Cobertura del spec:** §3 Reintro (Tasks 2-9), §4 Fase 3 (Tasks 10-13), §5 Navegación (Tasks 14-15), §6 tests/SW/ESTADO (Tasks 1, 16-18), §7 jubilaciones (Task 16), §4.5 migración F3 (Task 10). ✓
- **Sin placeholders:** todos los pasos de código llevan código real; los comandos llevan salida esperada.
- **Consistencia de tipos/nombres:** modelo `pruebas[nombre]={alimento,agenda,dias[{etiqueta,cantidad,fecha,dolor,hinchazon,gases,notas,registrado}],conclusion{estado,dosisIndex}}` usado igual en Tasks 4/5/9/11/12; `mapaToleranciaPorAlimento` usado en Tasks 11/12; `aplicarTolerancia` por alimento coherente con `render()` (Task 13); rutas `{tab,sub,alim}` coherentes Tasks 14/15.
