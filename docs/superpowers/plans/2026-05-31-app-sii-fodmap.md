# App SII / FODMAP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una app de un único archivo HTML, offline y mobile-first, que permita a una persona con SII (fase 1 FODMAP) buscar alimentos y ver semáforo, ración, FODMAP responsable, alternativas y consejos, con datos curados y trazables.

**Architecture:** Un solo `SII-FODMAP.html` con `<style>`, `<body>` y `<script>` propios, sin CDNs ni librerías. La lógica pura (normalizar texto, validar datos, buscar) vive en funciones testables. Un `runTests()` integrado ejecuta aserciones sobre los datos y la búsqueda cuando se abre con `?test`, dando disciplina test-first sin toolchain externo.

**Tech Stack:** HTML5 + CSS3 + JavaScript vanilla (ES2015+). Sin Node, sin npm, sin frameworks. Git para control de versiones.

---

## Notas sobre TDD en este proyecto

No hay build ni framework de test (requisito: cero dependencias). El equivalente a "test rojo → verde" es:

1. Añadir una aserción en `runTests()` que falla (porque la función/dato no existe aún).
2. Abrir `SII-FODMAP.html?test` en el navegador → el panel de tests muestra el fallo.
3. Implementar lo mínimo.
4. Recargar `?test` → el panel muestra ✓ todos los tests en verde.
5. Commit.

`runTests()` escribe el resultado en un `<div id="test-output">` y en `console`. Cada test es `assert(condición, "mensaje")`. Un fallo NO debe romper la app normal (solo se ejecuta con `?test`).

---

## File Structure

- Create: `SII-FODMAP.html` — la app completa (estructura, estilos, datos, lógica, tests).
- Create: `FUENTES.md` — registro de fuentes consultadas por categoría (trazabilidad).
- Create: `README.md` — cómo abrir/instalar la app en el móvil y aviso médico.

Todo vive en `SII-FODMAP.html`; los `.md` son documentación de apoyo. El archivo HTML se construye por secciones en este orden: esqueleto → motor de tests → utilidades puras → datos → render/UI → estilos → verificación.

---

## Task 0: Inicializar repositorio

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Inicializar git**

Run:
```bash
git init
```
Expected: "Initialized empty Git repository"

- [ ] **Step 2: Crear `.gitignore`**

```
# Sistema
Thumbs.db
.DS_Store
desktop.ini
```

- [ ] **Step 3: Commit inicial**

```bash
git add .gitignore docs/
git commit -m "chore: init repo y spec de la app SII/FODMAP"
```

---

## Task 1: Esqueleto del HTML + motor de tests

**Files:**
- Create: `SII-FODMAP.html`

- [ ] **Step 1: Escribir el esqueleto con motor de tests (test-first del propio motor)**

Crear `SII-FODMAP.html` con esta estructura base. El motor de tests se prueba a sí mismo: incluye un test que comprueba que `assert` detecta fallos correctamente.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <meta name="theme-color" content="#2e7d32">
  <title>¿Puedo comerlo? · SII/FODMAP</title>
  <style>/* ESTILOS — Task 6 */</style>
</head>
<body>
  <div id="app"><!-- UI — Task 5 --></div>
  <div id="test-output" hidden></div>

  <script>
  "use strict";

  // ---------- DATOS (Task 4) ----------
  var DATOS = [];

  // ---------- UTILIDADES PURAS (Task 2-3) ----------

  // ---------- RENDER / UI (Task 5) ----------

  // ---------- MOTOR DE TESTS ----------
  function runTests() {
    var results = [];
    function assert(cond, msg) {
      results.push({ ok: !!cond, msg: msg });
    }
    try {
      registerTests(assert);
    } catch (e) {
      results.push({ ok: false, msg: "Excepción en tests: " + e.message });
    }
    var passed = results.filter(function (r) { return r.ok; }).length;
    var failed = results.length - passed;
    var out = document.getElementById("test-output");
    out.hidden = false;
    out.innerHTML =
      "<h2>" + passed + " ✓ / " + failed + " ✗</h2>" +
      results.map(function (r) {
        return '<div style="color:' + (r.ok ? "green" : "red") + '">' +
          (r.ok ? "✓ " : "✗ ") + r.msg + "</div>";
      }).join("");
    results.forEach(function (r) {
      if (!r.ok) console.error("TEST FAIL:", r.msg); else console.log("ok:", r.msg);
    });
    return { passed: passed, failed: failed };
  }

  // Aquí se acumulan los tests de cada tarea:
  function registerTests(assert) {
    // Meta-test: el motor detecta verdadero y falso correctamente.
    assert(true, "el motor de tests funciona (true pasa)");
    assert(1 + 1 === 2, "aritmética básica");
  }

  // ---------- ARRANQUE ----------
  function init() {
    if (location.search.indexOf("test") !== -1) {
      runTests();
      return;
    }
    render(); // definido en Task 5
  }
  // render placeholder hasta Task 5 para que ?test no rompa
  if (typeof render !== "function") { var render = function () {}; }

  document.addEventListener("DOMContentLoaded", init);
  </script>
</body>
</html>
```

- [ ] **Step 2: Verificar que los tests pasan**

Abrir en el navegador: `SII-FODMAP.html?test`
Expected: el panel muestra "2 ✓ / 0 ✗".

- [ ] **Step 3: Verificar que la app normal no muestra el panel**

Abrir `SII-FODMAP.html` (sin `?test`).
Expected: el `#test-output` permanece oculto, no hay errores en consola.

- [ ] **Step 4: Commit**

```bash
git add SII-FODMAP.html
git commit -m "feat: esqueleto HTML con motor de tests integrado"
```

---

## Task 2: Utilidad `normalizar()` (búsqueda tolerante a tildes/mayúsculas)

**Files:**
- Modify: `SII-FODMAP.html` (sección UTILIDADES y `registerTests`)

- [ ] **Step 1: Escribir los tests (rojo)**

Añadir dentro de `registerTests(assert)`:

```js
assert(normalizar("Plátano") === "platano", "normalizar quita tildes y minúsculas");
assert(normalizar("  CEBOLLA  ") === "cebolla", "normalizar recorta espacios");
assert(normalizar("Limón") === "limon", "normalizar ó->o");
assert(normalizar("") === "", "normalizar cadena vacía");
assert(normalizar(null) === "", "normalizar null no rompe");
```

- [ ] **Step 2: Ejecutar y ver el fallo**

Abrir `SII-FODMAP.html?test`.
Expected: fallos "normalizar is not defined" (excepción capturada → todos ✗).

- [ ] **Step 3: Implementar `normalizar()`**

En la sección UTILIDADES PURAS:

```js
function normalizar(texto) {
  if (typeof texto !== "string") return "";
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita diacríticos
    .toLowerCase()
    .trim();
}
```

- [ ] **Step 4: Verificar verde**

Abrir `SII-FODMAP.html?test`.
Expected: los 5 tests de `normalizar` en ✓.

- [ ] **Step 5: Commit**

```bash
git add SII-FODMAP.html
git commit -m "feat: normalizar() para búsqueda tolerante a tildes"
```

---

## Task 3: Utilidades `validarAlimento()` y `buscar()`

**Files:**
- Modify: `SII-FODMAP.html` (sección UTILIDADES y `registerTests`)

- [ ] **Step 1: Escribir los tests (rojo)**

Añadir en `registerTests(assert)` (usa datos de ejemplo locales, no `DATOS`):

```js
var ej = {
  nombre: "Cebolla", sinonimos: ["cebolleta"], categoria: "Verduras",
  nivel: "rojo", racion_segura: "Evitar en fase 1.", fodmap: ["Fructanos"],
  alternativas: ["Cebollino"], consejo: "Usa aceite infusionado.", fuente: "Monash"
};
assert(validarAlimento(ej).length === 0, "alimento bien formado no da errores");

var malo = { nombre: "X", categoria: "Verduras", nivel: "morado" };
assert(validarAlimento(malo).length > 0, "nivel inválido se detecta");

var verde = { nombre: "Arroz", sinonimos: [], categoria: "Cereales y pan",
  nivel: "verde", racion_segura: "Sin límite práctico.", fodmap: [],
  alternativas: [], consejo: "", fuente: "Monash" };
assert(validarAlimento(verde).length === 0, "verde con fodmap vacío es válido");
assert(validarAlimento({nombre:"Ajo",nivel:"rojo",categoria:"Verduras",sinonimos:[],racion_segura:"Evitar",fodmap:[],alternativas:[],consejo:"",fuente:"Monash"}).length > 0,
  "rojo/amarillo sin fodmap declarado se detecta como incoherencia");

// buscar()
var lista = [ej, verde];
assert(buscar("cebolla", lista, null, false).length === 1, "buscar por nombre");
assert(buscar("cebolleta", lista, null, false).length === 1, "buscar por sinónimo");
assert(buscar("CEBOLLA", lista, null, false).length === 1, "buscar ignora mayúsculas");
assert(buscar("", lista, "Verduras", false).length === 1, "filtra por categoría");
assert(buscar("", lista, null, true).length === 1, "filtro solo seguros deja solo verdes");
assert(buscar("nohaytal", lista, null, false).length === 0, "sin resultados devuelve []");
```

- [ ] **Step 2: Ejecutar y ver el fallo**

Abrir `SII-FODMAP.html?test`.
Expected: fallos por `validarAlimento`/`buscar` no definidos.

- [ ] **Step 3: Implementar las utilidades**

En UTILIDADES PURAS:

```js
var NIVELES = ["verde", "amarillo", "rojo"];

function validarAlimento(a) {
  var errores = [];
  if (!a || typeof a !== "object") return ["no es un objeto"];
  if (!a.nombre || typeof a.nombre !== "string") errores.push("nombre ausente");
  if (NIVELES.indexOf(a.nivel) === -1) errores.push("nivel inválido: " + a.nivel);
  if (typeof a.categoria !== "string" || !a.categoria) errores.push("categoria ausente");
  if (!Array.isArray(a.sinonimos)) errores.push("sinonimos debe ser array");
  if (!Array.isArray(a.fodmap)) errores.push("fodmap debe ser array");
  if (!Array.isArray(a.alternativas)) errores.push("alternativas debe ser array");
  if (typeof a.racion_segura !== "string") errores.push("racion_segura ausente");
  if (!a.fuente) errores.push("fuente ausente (trazabilidad)");
  // Coherencia: amarillo/rojo deben declarar al menos un FODMAP responsable.
  if ((a.nivel === "rojo" || a.nivel === "amarillo") &&
      Array.isArray(a.fodmap) && a.fodmap.length === 0) {
    errores.push("nivel " + a.nivel + " sin FODMAP declarado");
  }
  return errores;
}

function buscar(texto, lista, categoria, soloSeguros) {
  var q = normalizar(texto);
  return lista.filter(function (a) {
    if (categoria && a.categoria !== categoria) return false;
    if (soloSeguros && a.nivel !== "verde") return false;
    if (!q) return true;
    if (normalizar(a.nombre).indexOf(q) !== -1) return true;
    return (a.sinonimos || []).some(function (s) {
      return normalizar(s).indexOf(q) !== -1;
    });
  });
}
```

- [ ] **Step 4: Verificar verde**

Abrir `SII-FODMAP.html?test`.
Expected: todos los tests de validación y búsqueda en ✓.

- [ ] **Step 5: Commit**

```bash
git add SII-FODMAP.html
git commit -m "feat: validarAlimento() y buscar() con tests"
```

---

## Task 4: Base de datos de alimentos (curada y trazable)

Curar ~80-120 alimentos por lotes de categoría. Tras CADA lote, un test recorre `DATOS` y exige `validarAlimento(a).length === 0`. Así un dato mal formado se detecta de inmediato.

**Files:**
- Modify: `SII-FODMAP.html` (array `DATOS` y `registerTests`)
- Create: `FUENTES.md`

**Reglas de curación (aplicar a todos los lotes):**
- `nivel`: 🟢 verde = bajo FODMAP en ración normal; 🟡 amarillo = depende de la ración; 🔴 rojo = alto, evitar en fase 1.
- `racion_segura`: frase orientativa en español de España (ej. "hasta ~1 plátano firme"), NUNCA gramos exactos presentados como certificados.
- `fodmap`: subconjunto de `["Fructosa","Lactosa","Manitol","Sorbitol","GOS","Fructanos"]`.
- `fuente`: nombres de fuentes públicas (ej. "Monash FODMAP", "Cleveland Clinic", "Diet vs Disease").
- Verde sin matiz → `fodmap: []`. Amarillo/rojo → al menos un FODMAP.

- [ ] **Step 1: Escribir el test de integridad global (rojo)**

Añadir en `registerTests(assert)`:

```js
assert(DATOS.length >= 80, "hay al menos 80 alimentos (hay " + DATOS.length + ")");
var erroresDatos = [];
DATOS.forEach(function (a) {
  var e = validarAlimento(a);
  if (e.length) erroresDatos.push((a && a.nombre) + ": " + e.join(", "));
});
assert(erroresDatos.length === 0, "todos los alimentos son válidos. Errores: " + erroresDatos.join(" | "));

// Nombres únicos (evita duplicados)
var nombres = DATOS.map(function (a) { return normalizar(a.nombre); });
assert(new Set(nombres).size === nombres.length, "no hay nombres duplicados");

// Toda categoría usada existe en CATEGORIAS
assert(typeof CATEGORIAS !== "undefined" && Array.isArray(CATEGORIAS), "CATEGORIAS definido");
DATOS.forEach(function (a) {
  assert(CATEGORIAS.indexOf(a.categoria) !== -1, a.nombre + " usa categoría válida");
});
```

- [ ] **Step 2: Ejecutar y ver el fallo**

Abrir `SII-FODMAP.html?test`.
Expected: falla "al menos 80 alimentos" (DATOS vacío) y "CATEGORIAS definido".

- [ ] **Step 3: Definir CATEGORIAS y lote 1 — Verduras (~18)**

Antes de `DATOS`, añadir:

```js
var CATEGORIAS = ["Verduras","Frutas","Lácteos","Cereales y pan",
  "Proteínas","Legumbres","Frutos secos y semillas","Bebidas",
  "Condimentos y otros","Dulces y snacks"];
```

Poblar `DATOS` con verduras. Ejemplos concretos a incluir (formato completo):

```js
DATOS = [
  { nombre:"Cebolla", sinonimos:["cebolla blanca","cebolla morada"], categoria:"Verduras",
    nivel:"rojo", racion_segura:"Evitar en fase 1. Usa la parte verde de la cebolleta.",
    fodmap:["Fructanos"], alternativas:["Parte verde de cebolleta","Cebollino","Aceite de oliva infusionado"],
    consejo:"El sofrito suelta fructanos al aceite; mejor aceite infusionado y retirar la cebolla.",
    fuente:"Monash FODMAP / Noisy Guts" },
  { nombre:"Ajo", sinonimos:["diente de ajo"], categoria:"Verduras",
    nivel:"rojo", racion_segura:"Evitar en fase 1.",
    fodmap:["Fructanos"], alternativas:["Aceite de oliva infusionado con ajo","Asafétida (en polvo, pizca)","Cebollino"],
    consejo:"El ajo en aceite infusionado aporta sabor sin fructanos (los fructanos no pasan al aceite).",
    fuente:"Monash FODMAP / Noisy Guts" },
  { nombre:"Zanahoria", sinonimos:[], categoria:"Verduras",
    nivel:"verde", racion_segura:"Sin límite práctico en fase 1.",
    fodmap:[], alternativas:[], consejo:"", fuente:"Monash FODMAP" },
  { nombre:"Tomate", sinonimos:["tomate pera","tomate rama"], categoria:"Verduras",
    nivel:"verde", racion_segura:"~1 tomate mediano. En grandes cantidades sube la fructosa.",
    fodmap:[], alternativas:[], consejo:"El tomate seco y el concentrado son más altos: úsalos con moderación.",
    fuente:"Monash FODMAP" },
  // ...resto: pepino, calabacín (ración), pimiento rojo, berenjena, lechuga,
  // espinaca (baby), patata, boniato (ración), judía verde, calabaza kabocha,
  // brócoli (cabezas, ración), champiñón (ROJO, Manitol), coliflor (ROJO, Manitol),
  // espárrago (ROJO, Fructanos), alcachofa (ROJO, Fructanos)
];
```

Completar el lote hasta ~18 verduras siguiendo las reglas. Marcar rojo: champiñón/seta (Manitol), coliflor (Manitol), espárrago (Fructanos), alcachofa (Fructanos), puerro bulbo (Fructanos). Amarillo con ración: calabacín, brócoli, boniato, repollo.

- [ ] **Step 4: Verificar verde tras lote 1**

Abrir `SII-FODMAP.html?test`. Expected: tests de categoría/validez en ✓ (aún puede fallar "≥80" hasta completar lotes).

- [ ] **Step 5: Commit**

```bash
git add SII-FODMAP.html
git commit -m "feat: datos - categorías y lote verduras"
```

- [ ] **Step 6: Lote 2 — Frutas (~15)**

Incluir (con nivel y FODMAP correctos):
- Verde (ración): plátano firme (maduro = amarillo, Fructanos/Fructosa), arándanos, fresas, kiwi, naranja, mandarina, limón, lima, uva, piña, papaya, melón cantalupo.
- Rojo: manzana (Fructosa/Sorbitol), pera (Fructosa/Sorbitol), mango (Fructosa), sandía (Fructosa/Fructanos/Manitol), cerezas (Fructosa/Sorbitol), aguacate >1/8 (Sorbitol → amarillo con ración), albaricoque/melocotón (Sorbitol), ciruela (Sorbitol).

Cada fruta con `racion_segura` orientativa (ej. plátano "~1 firme"; arándanos "~1 puñado/20").
Commit: `git commit -am "feat: datos - lote frutas"`.

- [ ] **Step 7: Lote 3 — Lácteos (~10)**

- Verde: leche sin lactosa, bebida de almendras, queso curado (cheddar/manchego curado/parmesano), mozzarella (ración), mantequilla, queso brie/camembert (ración).
- Rojo: leche de vaca (Lactosa), yogur normal (Lactosa), queso fresco/requesón (Lactosa), nata (Lactosa).
- Alternativas siempre que sea rojo (ej. leche → leche sin lactosa / bebida de almendras).
Commit: `git commit -am "feat: datos - lote lácteos"`.

- [ ] **Step 8: Lote 4 — Cereales y pan (~12)**

- Verde: arroz (blanco/integral), avena (ración), quinoa, maíz/polenta, pan sin gluten, pasta sin gluten, tortita de arroz, trigo sarraceno.
- Rojo: pan de trigo (Fructanos), pasta de trigo (Fructanos), cuscús (Fructanos), centeno (Fructanos), cebada (Fructanos).
- Matiz: espelta masa madre (amarillo). Commit: `git commit -am "feat: datos - lote cereales"`.

- [ ] **Step 9: Lote 5 — Proteínas (~10)**

- Verde (sin FODMAP): pollo, pavo, ternera, cerdo, huevo, pescado blanco, salmón, atún, gambas, tofu firme.
- Aviso en `consejo`: cuidado con adobos/embutidos que llevan ajo/cebolla (esos serían rojos por aditivos). Tofu sedoso = amarillo.
Commit: `git commit -am "feat: datos - lote proteínas"`.

- [ ] **Step 10: Lote 6 — Legumbres (~6)**

- Rojo: garbanzos en remojo seco (GOS), lentejas (GOS, ración pequeña enlatada = amarillo), alubias rojas (GOS), soja en grano (GOS).
- Amarillo: garbanzos de bote enjuagados (ración ~1/4 taza), lenteja de bote (~1/4 taza).
- Alternativas: tofu firme, tempeh, ración pequeña enlatada/enjuagada.
Commit: `git commit -am "feat: datos - lote legumbres"`.

- [ ] **Step 11: Lote 7 — Frutos secos y semillas (~8)**

- Verde (ración): nueces, nueces de macadamia, cacahuetes, pipas de calabaza, semillas de chía, semillas de girasol.
- Rojo/amarillo: anacardos (rojo, GOS/Fructanos), pistachos (rojo, Fructanos/GOS), almendras (amarillo, ~10 uds).
Commit: `git commit -am "feat: datos - lote frutos secos"`.

- [ ] **Step 12: Lote 8 — Bebidas (~8)**

- Verde: agua, café solo (ración, sin leche normal), té negro/verde flojo, infusión de menta/jengibre, zumo de naranja (ración pequeña), vino tinto/blanco (1 copa).
- Rojo: zumo de manzana/pera (Fructosa), refrescos con HFCS/sirope de maíz (Fructosa), té de manzanilla/hinojo (Fructanos), ron con cola, cerveza (ración → amarillo).
Commit: `git commit -am "feat: datos - lote bebidas"`.

- [ ] **Step 13: Lote 9 — Condimentos y otros (~8)**

- Verde: aceite de oliva, sal, pimienta, vinagre normal, mostaza, mayonesa (sin ajo), hierbas frescas, jengibre.
- Rojo: miel (Fructosa), sirope de agave (Fructosa), ketchup (suele llevar cebolla/HFCS → amarillo/rojo), caldo/pastilla con cebolla-ajo (Fructanos), salsa de soja (ración → verde).
Commit: `git commit -am "feat: datos - lote condimentos"`.

- [ ] **Step 14: Lote 10 — Dulces y snacks (~7)**

- Verde (ración): chocolate negro (~30 g), chocolate con leche (ración pequeña), azúcar de mesa (sacarosa, moderado), sirope de arce.
- Rojo: chicles/caramelos "sin azúcar" (Sorbitol/Manitol/Xilitol → polioles), regaliz, productos con inulina/fibra añadida (Fructanos), fruta deshidratada (Fructosa/Fructanos).
Commit: `git commit -am "feat: datos - lote dulces"`.

- [ ] **Step 15: Verificación final de datos**

Abrir `SII-FODMAP.html?test`.
Expected: TODOS en ✓, incluido "≥80 alimentos", "todos válidos", "sin duplicados", "categorías válidas".

- [ ] **Step 16: Crear `FUENTES.md`**

Registrar las fuentes por categoría:

```markdown
# Fuentes de la base de datos

La clasificación FODMAP se basa en fuentes públicas reputadas. Los gramos exactos
certificados son propiedad de la Universidad de Monash y NO se reproducen aquí.

- Universidad de Monash (blog gratuito): https://www.monashfodmap.com/blog/
- Cleveland Clinic: https://my.clevelandclinic.org/health/treatments/22466-low-fodmap-diet
- UVA Digestive Health (PDF clínico)
- Diet vs Disease — listas FODMAP por categoría
- IBS Diets — FODMAP food list
- Noisy Guts — allium (ajo/cebolla) en dieta FODMAP

Última revisión: 2026-05-31. Revisar periódicamente: las clasificaciones se actualizan.
```

Commit: `git add FUENTES.md && git commit -m "docs: fuentes de la base de datos"`.

---

## Task 5: Render y UI

**Files:**
- Modify: `SII-FODMAP.html` (sección RENDER/UI, `registerTests`, `#app`)

- [ ] **Step 1: Test de funciones de render puras (rojo)**

`render()` toca el DOM, pero extraemos helpers puros testables. Añadir en `registerTests`:

```js
assert(emojiNivel("verde") === "🟢", "emoji verde");
assert(emojiNivel("amarillo") === "🟡", "emoji amarillo");
assert(emojiNivel("rojo") === "🔴", "emoji rojo");
assert(textoNivel("rojo").toLowerCase().indexOf("evita") !== -1, "texto rojo dice evitar");
assert(escapeHTML("<b>&") === "&lt;b&gt;&amp;", "escapeHTML evita inyección");
```

- [ ] **Step 2: Ver el fallo**

Abrir `?test`. Expected: `emojiNivel`/`escapeHTML` no definidos.

- [ ] **Step 3: Implementar helpers + render**

En RENDER/UI:

```js
function emojiNivel(n) {
  return n === "verde" ? "🟢" : n === "amarillo" ? "🟡" : n === "rojo" ? "🔴" : "⚪";
}
function textoNivel(n) {
  return n === "verde" ? "Puedes comerlo"
       : n === "amarillo" ? "Con cuidado: depende de la cantidad"
       : n === "rojo" ? "Evítalo en fase 1" : "Sin datos";
}
function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

var estado = { texto: "", categoria: null, soloSeguros: false };

function tarjetaHTML(a) {
  return '<button class="card nivel-' + a.nivel + '" data-nombre="' +
    escapeHTML(a.nombre) + '">' +
    '<span class="emoji">' + emojiNivel(a.nivel) + '</span>' +
    '<span class="card-nombre">' + escapeHTML(a.nombre) + '</span>' +
    '<span class="card-cat">' + escapeHTML(a.categoria) + '</span></button>';
}

function fichaHTML(a) {
  var alts = a.alternativas.length
    ? '<div class="bloque"><h4>Alternativas seguras</h4><ul>' +
      a.alternativas.map(function (x) { return "<li>" + escapeHTML(x) + "</li>"; }).join("") +
      "</ul></div>" : "";
  var fod = a.fodmap.length
    ? '<div class="bloque"><h4>FODMAP responsable</h4><p>' +
      a.fodmap.map(escapeHTML).join(", ") + "</p></div>" : "";
  var cons = a.consejo
    ? '<div class="bloque"><h4>Consejo</h4><p>' + escapeHTML(a.consejo) + "</p></div>" : "";
  return '<div class="ficha nivel-' + a.nivel + '">' +
    '<button class="volver" data-volver="1">‹ Volver</button>' +
    '<div class="ficha-cab"><span class="emoji-grande">' + emojiNivel(a.nivel) + '</span>' +
    '<h2>' + escapeHTML(a.nombre) + '</h2><p class="veredicto">' + textoNivel(a.nivel) + '</p></div>' +
    '<div class="bloque"><h4>Ración orientativa</h4><p>' + escapeHTML(a.racion_segura) + '</p></div>' +
    fod + alts + cons +
    '<p class="fuente">Fuente: ' + escapeHTML(a.fuente) + '</p></div>';
}

function render() {
  var app = document.getElementById("app");
  var resultados = buscar(estado.texto, DATOS, estado.categoria, estado.soloSeguros);
  var chips = CATEGORIAS.map(function (c) {
    return '<button class="chip' + (estado.categoria === c ? " activo" : "") +
      '" data-cat="' + escapeHTML(c) + '">' + escapeHTML(c) + "</button>";
  }).join("");
  var lista = resultados.length
    ? '<div class="grid">' + resultados.map(tarjetaHTML).join("") + "</div>"
    : '<p class="vacio">No encontrado. Prueba otro nombre o revisa por categoría.</p>';
  app.innerHTML =
    '<header><h1>¿Puedo comerlo?</h1>' +
    '<p class="aviso">Guía orientativa (fase 1, dieta FODMAP). No sustituye a tu dietista.</p></header>' +
    '<input id="q" type="search" placeholder="Busca un alimento… (ej. cebolla)" value="' +
      escapeHTML(estado.texto) + '" autocomplete="off">' +
    '<label class="seguros"><input type="checkbox" id="soloSeguros"' +
      (estado.soloSeguros ? " checked" : "") + '> Solo seguros 🟢</label>' +
    '<div class="chips"><button class="chip' + (estado.categoria === null ? " activo" : "") +
      '" data-cat="">Todas</button>' + chips + "</div>" +
    '<div id="contenido">' + lista + "</div>";
  enlazarEventos();
}

function mostrarFicha(nombre) {
  var a = DATOS.filter(function (x) { return x.nombre === nombre; })[0];
  if (!a) return;
  document.getElementById("contenido").innerHTML = fichaHTML(a);
  var v = document.querySelector("[data-volver]");
  if (v) v.addEventListener("click", render);
}

function enlazarEventos() {
  var q = document.getElementById("q");
  if (q) q.addEventListener("input", function (e) { estado.texto = e.target.value; render(); q2focus(); });
  var s = document.getElementById("soloSeguros");
  if (s) s.addEventListener("change", function (e) { estado.soloSeguros = e.target.checked; render(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-cat]"), function (b) {
    b.addEventListener("click", function () {
      estado.categoria = b.getAttribute("data-cat") || null; render();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-nombre]"), function (b) {
    b.addEventListener("click", function () { mostrarFicha(b.getAttribute("data-nombre")); });
  });
}
// Mantener el foco/caret tras re-render del input
function q2focus() {
  var q = document.getElementById("q");
  if (q) { var v = q.value; q.focus(); q.setSelectionRange(v.length, v.length); }
}
```

Eliminar el `render` placeholder de Task 1 (este lo sustituye).

- [ ] **Step 4: Verificar tests verdes**

Abrir `?test`. Expected: todos los tests (incluidos los nuevos de helpers) en ✓.

- [ ] **Step 5: Verificar la app a mano**

Abrir `SII-FODMAP.html`. Buscar "cebolla" → tarjeta roja; clic → ficha con alternativas y consejo; "Volver"; filtro "Solo seguros"; chip "Frutas".
Expected: todo responde sin errores en consola.

- [ ] **Step 6: Commit**

```bash
git add SII-FODMAP.html
git commit -m "feat: render, búsqueda en vivo y ficha de alimento"
```

---

## Task 6: Estilos mobile-first

**Files:**
- Modify: `SII-FODMAP.html` (bloque `<style>`)

- [ ] **Step 1: Escribir el CSS**

Reemplazar `/* ESTILOS — Task 6 */` por:

```css
:root{
  --verde:#2e7d32; --verde-bg:#e8f5e9;
  --amar:#f9a825; --amar-bg:#fff8e1;
  --rojo:#c62828; --rojo-bg:#ffebee;
  --txt:#1a1a1a; --gris:#666; --linea:#e0e0e0;
}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  color:var(--txt);background:#fafafa;line-height:1.4}
#app{max-width:560px;margin:0 auto;padding:16px 14px 48px}
header h1{font-size:1.5rem;margin:.2em 0}
.aviso{font-size:.8rem;color:var(--gris);background:#fff;border:1px solid var(--linea);
  padding:8px 10px;border-radius:8px;margin:0 0 12px}
#q{width:100%;font-size:1.1rem;padding:14px;border:2px solid var(--linea);
  border-radius:12px;outline:none}
#q:focus{border-color:var(--verde)}
.seguros{display:inline-flex;align-items:center;gap:6px;margin:10px 2px;font-size:.95rem}
.chips{display:flex;gap:8px;overflow-x:auto;padding:4px 0 8px;-webkit-overflow-scrolling:touch}
.chip{flex:0 0 auto;border:1px solid var(--linea);background:#fff;border-radius:999px;
  padding:8px 14px;font-size:.9rem;cursor:pointer}
.chip.activo{background:var(--verde);color:#fff;border-color:var(--verde)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:8px}
.card{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;
  border:1px solid var(--linea);border-radius:12px;padding:12px;background:#fff;cursor:pointer}
.card .emoji{font-size:1.5rem}
.card-nombre{font-weight:600}
.card-cat{font-size:.75rem;color:var(--gris)}
.card.nivel-verde{background:var(--verde-bg)} 
.card.nivel-amarillo{background:var(--amar-bg)}
.card.nivel-rojo{background:var(--rojo-bg)}
.vacio{color:var(--gris);text-align:center;padding:24px}
.ficha{background:#fff;border-radius:14px;padding:16px;border:1px solid var(--linea)}
.ficha.nivel-verde{border-top:6px solid var(--verde)}
.ficha.nivel-amarillo{border-top:6px solid var(--amar)}
.ficha.nivel-rojo{border-top:6px solid var(--rojo)}
.volver{background:none;border:none;color:var(--verde);font-size:1rem;cursor:pointer;padding:4px 0}
.ficha-cab{text-align:center;margin:8px 0}
.emoji-grande{font-size:3rem}
.veredicto{font-weight:700;margin:.2em 0}
.bloque{border-top:1px solid var(--linea);padding:10px 0}
.bloque h4{margin:0 0 4px;font-size:.85rem;text-transform:uppercase;color:var(--gris);letter-spacing:.03em}
.bloque ul{margin:.2em 0;padding-left:1.2em}
.fuente{font-size:.75rem;color:var(--gris);margin-top:12px}
@media(max-width:360px){.grid{grid-template-columns:1fr 1fr}}
```

- [ ] **Step 2: Verificar a mano en viewport móvil**

Abrir `SII-FODMAP.html`, activar vista móvil (DevTools, ~375px).
Expected: buscador grande, chips deslizables, tarjetas con color por nivel, ficha legible.

- [ ] **Step 3: Commit**

```bash
git add SII-FODMAP.html
git commit -m "style: diseño mobile-first con semáforo de color"
```

---

## Task 7: README e instalación en el móvil

**Files:**
- Create: `README.md`

- [ ] **Step 1: Escribir el README**

```markdown
# ¿Puedo comerlo? — App SII / FODMAP

App de un solo archivo para consultar alimentos en la dieta baja en FODMAP (SII), fase 1.

## Cómo usar
Abre `SII-FODMAP.html` con doble clic (funciona sin internet).

## Instalar en el móvil (icono en pantalla de inicio)
1. Envíate `SII-FODMAP.html` (WhatsApp/email) y ábrelo en el navegador del móvil.
2. **iPhone (Safari):** Compartir → "Añadir a pantalla de inicio".
3. **Android (Chrome):** menú ⋮ → "Añadir a pantalla de inicio".

## Aviso importante
Información **orientativa** basada en fuentes públicas fiables (ver `FUENTES.md`).
**No sustituye** el consejo de un dietista. Las cantidades exactas dependen de cada
persona. Ante dudas, consulta con un profesional.

## Tests
Abre `SII-FODMAP.html?test` para ejecutar la batería de auto-tests (datos + lógica).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README con instalación móvil y aviso"
```

---

## Task 8: Verificación final completa

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Tests automáticos**

Abrir `SII-FODMAP.html?test`.
Expected: "N ✓ / 0 ✗" — cero fallos.

- [ ] **Step 2: Pruebas manuales de búsqueda real**

Abrir `SII-FODMAP.html` y comprobar uno a uno:
- "cebolla" → 🔴 con alternativas y consejo del aceite infusionado.
- "ajo" → 🔴 con consejo del aceite infusionado.
- "platano" (sin tilde) → encuentra "Plátano".
- "pan" → pan de trigo 🔴, pan sin gluten 🟢.
- "leche" → leche de vaca 🔴, leche sin lactosa 🟢.
- "manzana" → 🔴 (Fructosa/Sorbitol).
- "arroz" → 🟢.
- Filtro "Solo seguros" → solo tarjetas verdes.
- Chip "Frutas" → solo frutas.
- Búsqueda sin resultado ("xyz") → mensaje útil, no pantalla vacía.

Expected: todo correcto, sin errores en consola.

- [ ] **Step 3: Verificación de robustez**

En consola del navegador, ejecutar: `DATOS.forEach(a=>{if(validarAlimento(a).length)console.error(a.nombre)})`
Expected: sin salida (todos válidos).

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "test: verificación final de la app SII/FODMAP"
```

---

## Self-Review (cobertura del spec)

- §1 Propósito → Tasks 4-6 (datos + UI). ✓
- §2 Decisiones (1 archivo, offline, móvil, español) → Task 1, 6. ✓
- §3 Base científica + limitación honesta → Task 4 (reglas, fuente) + aviso UI (Task 5) + FUENTES.md. ✓
- §4 Arquitectura (1 archivo sin deps) → Task 1. ✓
- §5 Modelo de datos → Task 3 (validación) + Task 4 (datos). ✓
- §6 Interfaz (búsqueda tolerante, semáforo, ficha, aviso) → Task 2, 5, 6. ✓
- §7 Errores/robustez (sin resultados, JS defensivo, contraste) → Task 3, 5, 6. ✓
- §8 Verificación → Task 8. ✓
- §9 Fuera de alcance → respetado (sin diario, sin fases 2-3, sin favoritos). ✓

Sin placeholders pendientes. Nombres de funciones consistentes (`normalizar`, `buscar`,
`validarAlimento`, `render`, `emojiNivel`, `textoNivel`, `escapeHTML`).
