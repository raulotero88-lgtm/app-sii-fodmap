# Fase 3 — Personalización · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una tercera pestaña "🌱 Personalización" que resume el diario de Fase 2, deja que la usuaria marque qué FODMAPs tolera, y con eso ofrece un interruptor en el Buscador que re-colorea los alimentos que ya puede comer.

**Architecture:** Todo vive en el único archivo `index.html` (HTML+CSS+JS vanilla, sin dependencias). Se añade una capa de datos aislada (`almacenF3` sobre `localStorage`), funciones **puras** de re-coloreado (testables sin DOM), una vista nueva (`renderFase3`) y una capa de solo lectura (`aplicarTolerancia`) sobre `DATOS` que el Buscador usa cuando el interruptor está activo. No se muta `DATOS` ni se toca la lógica del Buscador ni de Fase 2 salvo los puntos de integración indicados.

**Tech Stack:** HTML5, CSS (variables nativas, modo claro/oscuro), JavaScript ES5 (estilo del archivo: `var`, funciones declaradas, sin librerías). Tests con el motor propio `?test` que se abre en el navegador. PWA con service worker (`sw.js`).

**Spec:** `docs/superpowers/specs/2026-06-04-fase3-personalizacion-design.md`

---

## Convención de verificación (importante)

El proyecto **no** tiene runner Node: los tests se ejecutan **en el navegador** abriendo el archivo
con el parámetro `?test` (p. ej. `index.html?test`). La cabecera muestra `N ✓ / M ✗`.

- **"Verificar que falla":** tras escribir los asserts nuevos de funciones aún no definidas, abrir
  `index.html?test`. El motor envuelve los tests en try/catch, así que aparecerá una línea roja del tipo
  `✗ Excepción en tests: <funcion> is not defined` (o un assert concreto en ✗). Eso confirma el rojo.
- **"Verificar que pasa":** volver a abrir `index.html?test`; debe marcar `0 ✗` y el total subir.
- El estado de partida es **`59 ✓ / 0 ✗`**.

Cada tarea termina con un commit. Mensajes en español, siguiendo el estilo del repo
(`datos:`, `docs:`, `estilo:`, `test:`, `feat:`).

---

## File Structure

Un solo archivo de aplicación. Estos son los puntos de inserción/modificación (las líneas son
orientativas respecto al estado actual; localizar por el nombre de la función):

- `index.html`
  - **`<style>`** (antes de `</style>`, ~línea 149): CSS nuevo (`.tol-card`, `.tol-picos`, `.tol-banner`, `.card-antes`, ajuste de `.tab`).
  - **Nueva sección "FASE 3 · DATOS Y LÓGICA"** tras `estadoReto()` (~línea 1113): `STORAGE_KEY_F3`, `almacenF3`, `toleranciaDe`, `setTolerancia`, `setVerSegunTolerancia`, `hayAlgunaTolerancia`, `rangoEstado`, `peorEstado`, `estadoFodmap`, `nivelPersonalizado`, `resumenFase2PorGrupo`, `sugerirLimiteDosis`, `exportarTodo`, `importarTodo`, `aplicarTolerancia`.
  - **Nueva sección "FASE 3 · RENDER"** tras `renderResumen()` (~línea 1392): `ETIQUETAS_ESTADO`, `renderFase3()`.
  - **`renderApp()`** (~líneas 908-921): añadir la tercera pestaña y el dispatch a `renderFase3`.
  - **`tarjetaHTML()`** (~línea 790): mostrar "antes 🔴".
  - **`render()`** (~línea 824): usar `aplicarTolerancia(DATOS)`, añadir el interruptor y el banner.
  - **`enlazarEventos()`** (~línea 869): enlazar el interruptor `verTol`.
  - **`wireAcciones()`** (~línea 1152): exportar usa `exportarTodo()`.
  - **`pedirImportar()`** (~línea 1140): importar usa `importarTodo()` y `renderApp()`.
  - **`registerTests()`** (antes de la línea de limpieza final `almacen._mem = ...`, ~línea 1565): bloques de tests de Fase 3.
- `sw.js` (línea 1): `VERSION` `v5` → `v6` (solo en la tarea de publicación).
- `README.md`, `ESTADO.md`: actualización de contador de tests y documentación (tarea final).

---

## Task 1: Capa de datos de Fase 3 (persistencia + setters)

**Files:**
- Modify: `index.html` — nueva sección "FASE 3 · DATOS Y LÓGICA" tras `estadoReto()` (~1113)
- Modify: `index.html` — `registerTests()` (~1565, antes de la limpieza final)

- [ ] **Step 1: Escribir los tests (rojo)**

En `registerTests`, justo antes de la última línea `almacen._mem = { version: 1, retos: {} }; // dejar limpio`, insertar:

```js
    // ---- FASE 3: persistencia ----
    almacenF3._mem = null;
    var f3 = almacenF3.cargar();
    assert(f3 && f3.tolerancias && typeof f3.tolerancias === "object", "F3 cargar sin datos da estructura vacía válida");
    assert(f3.verSegunTolerancia === false, "F3 verSegunTolerancia por defecto es false");
    assert(toleranciaDe("fructosa").estado === "sin_probar", "tolerancia por defecto es sin_probar");
    setTolerancia("fructosa", "tolera", null);
    assert(toleranciaDe("fructosa").estado === "tolera", "setTolerancia guarda 'tolera'");
    setTolerancia("lactosa", "limite", 2);
    assert(toleranciaDe("lactosa").estado === "limite" && toleranciaDe("lactosa").limiteDosis === 2, "setTolerancia 'limite' guarda la dosis");
    setTolerancia("lactosa", "sin_probar", null);
    assert(toleranciaDe("lactosa").estado === "sin_probar", "marcar sin_probar borra la tolerancia");
    assert(hayAlgunaTolerancia() === true, "hayAlgunaTolerancia detecta una tolerancia guardada");
    setVerSegunTolerancia(true);
    assert(almacenF3.cargar().verSegunTolerancia === true, "setVerSegunTolerancia persiste el toggle");
    almacenF3._mem = { version: 1, tolerancias: {}, verSegunTolerancia: false };
    assert(hayAlgunaTolerancia() === false, "sin tolerancias, hayAlgunaTolerancia es false");
```

- [ ] **Step 2: Verificar que falla**

Abrir `index.html?test`.
Esperado: línea roja `✗ Excepción en tests: almacenF3 is not defined` (o similar). Total con ✗ > 0.

- [ ] **Step 3: Implementar la capa de datos**

Insertar tras la función `estadoReto()` (~línea 1113), antes del comentario "FASE 2 · RENDER / UI":

```js
  /* ============================================================
     FASE 3 · DATOS Y LÓGICA (personalización / tolerancias)
     estado ∈ "sin_probar" | "tolera" | "limite" | "no"
     ============================================================ */
  var STORAGE_KEY_F3 = "sii_fodmap_fase3_v1";
  var almacenF3 = {
    _mem: null,
    cargar: function () {
      if (this._mem) return this._mem;
      var base = { version: 1, tolerancias: {}, verSegunTolerancia: false };
      try {
        var raw = localStorage.getItem(STORAGE_KEY_F3);
        if (raw) {
          var p = JSON.parse(raw);
          if (p && p.tolerancias && typeof p.tolerancias === "object") {
            base = { version: p.version || 1, tolerancias: p.tolerancias,
                     verSegunTolerancia: !!p.verSegunTolerancia };
          }
        }
      } catch (e) {}
      this._mem = base;
      return base;
    },
    guardar: function (data) {
      this._mem = data;
      try { localStorage.setItem(STORAGE_KEY_F3, JSON.stringify(data)); return true; }
      catch (e) { return false; }
    }
  };

  function toleranciaDe(id) {
    var t = almacenF3.cargar().tolerancias[id];
    return t || { estado: "sin_probar", limiteDosis: null };
  }

  function setTolerancia(id, estado, limiteDosis) {
    var data = almacenF3.cargar();
    if (estado === "sin_probar") {
      delete data.tolerancias[id];
    } else {
      data.tolerancias[id] = {
        estado: estado,
        limiteDosis: estado === "limite" ? (limiteDosis || 1) : null
      };
    }
    almacenF3.guardar(data);
  }

  function setVerSegunTolerancia(v) {
    var data = almacenF3.cargar();
    data.verSegunTolerancia = !!v;
    almacenF3.guardar(data);
  }

  function hayAlgunaTolerancia() {
    var t = almacenF3.cargar().tolerancias;
    return Object.keys(t).some(function (k) {
      return t[k] && t[k].estado && t[k].estado !== "sin_probar";
    });
  }
```

- [ ] **Step 4: Verificar que pasa**

Abrir `index.html?test`. Esperado: `0 ✗`, total subido en 9.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(fase3): capa de datos de tolerancias (almacenF3 + setters)"
```

---

## Task 2: Lógica pura de re-coloreado

**Files:**
- Modify: `index.html` — sección "FASE 3 · DATOS Y LÓGICA" (debajo de lo de Task 1)
- Modify: `index.html` — `registerTests()`

- [ ] **Step 1: Escribir los tests (rojo)**

En `registerTests`, tras el bloque de Task 1 (antes de la limpieza final), insertar:

```js
    // ---- FASE 3: lógica de re-coloreado (pura) ----
    assert(peorEstado("tolera", "limite") === "limite", "peorEstado: limite peor que tolera");
    assert(peorEstado("limite", "no") === "no", "peorEstado: no peor que limite");
    assert(peorEstado("tolera", "tolera") === "tolera", "peorEstado: dos tolera = tolera");
    var tolA = { "fructosa": { estado: "tolera" } };
    assert(estadoFodmap("Fructosa", tolA) === "tolera", "estadoFodmap mapea Fructosa->fructosa");
    var tolFr = { "fructanos-trigo": { estado: "tolera" }, "fructanos-verdura": { estado: "limite" } };
    assert(estadoFodmap("Fructanos", tolFr) === "limite", "estadoFodmap Fructanos usa el más restrictivo");
    assert(estadoFodmap("Fructanos", {}) === "sin_probar", "estadoFodmap Fructanos sin datos = sin_probar");

    var cebolla = { nombre: "Cebolla", nivel: "rojo", fodmap: ["Fructanos"] };
    assert(nivelPersonalizado(cebolla, {}) === null, "sin tolerancia no se re-colorea");
    assert(nivelPersonalizado(cebolla, { "fructanos-trigo": { estado: "tolera" }, "fructanos-verdura": { estado: "tolera" } }).nivel === "verde",
      "cebolla->verde si tolera ambos fructanos");
    assert(nivelPersonalizado(cebolla, { "fructanos-trigo": { estado: "tolera" }, "fructanos-verdura": { estado: "limite" } }).nivel === "amarillo",
      "cebolla->amarillo si un fructano es 'con límite'");
    assert(nivelPersonalizado(cebolla, { "fructanos-trigo": { estado: "tolera" } }) === null,
      "cebolla no cambia si el otro fructano está sin probar");
    var guisante = { nombre: "Guisantes", nivel: "rojo", fodmap: ["GOS", "Fructanos"] };
    assert(nivelPersonalizado(guisante, { "gos": { estado: "tolera" }, "fructanos-trigo": { estado: "tolera" }, "fructanos-verdura": { estado: "tolera" } }).nivel === "verde",
      "multi-FODMAP mejora solo si todos tolerados");
    assert(nivelPersonalizado(guisante, { "gos": { estado: "tolera" } }) === null,
      "multi-FODMAP no mejora si falta uno");
    var arroz = { nombre: "Arroz", nivel: "verde", fodmap: [] };
    assert(nivelPersonalizado(arroz, { "fructosa": { estado: "tolera" } }) === null, "alimento sin FODMAP no cambia");
    var ciruela = { nombre: "Ciruela", nivel: "rojo", fodmap: [], motivo: "carga total" };
    assert(nivelPersonalizado(ciruela, { "fructosa": { estado: "tolera" } }) === null, "alimento por 'motivo' (sin FODMAP) nunca cambia");
    var tomate = { nombre: "Tomate", nivel: "amarillo", fodmap: ["Fructosa"] };
    assert(nivelPersonalizado(tomate, { "fructosa": { estado: "tolera" } }).nivel === "verde", "amarillo->verde si tolera su único FODMAP");
    assert(nivelPersonalizado(tomate, { "fructosa": { estado: "limite" } }) === null, "amarillo con límite no cambia (ya es amarillo)");
```

- [ ] **Step 2: Verificar que falla**

Abrir `index.html?test`. Esperado: rojo `✗ Excepción en tests: peorEstado is not defined` (o similar).

- [ ] **Step 3: Implementar la lógica pura**

Añadir en la sección "FASE 3 · DATOS Y LÓGICA", debajo de `hayAlgunaTolerancia()`:

```js
  // Severidad: tolera (mejor) < limite < no/sin_probar (peor)
  function rangoEstado(e) {
    return e === "tolera" ? 0 : e === "limite" ? 1 : 2;
  }
  function peorEstado(a, b) {
    return rangoEstado(a) >= rangoEstado(b) ? a : b;
  }

  // Estado fase3 ("sin_probar"|"tolera"|"limite"|"no") de un FODMAP de alimento.
  // "Fructanos" toma el más restrictivo de trigo y verdura.
  function estadoFodmap(fodmapNombre, tolerancias) {
    function est(id) { return (tolerancias[id] && tolerancias[id].estado) || "sin_probar"; }
    if (fodmapNombre === "Fructanos") {
      return peorEstado(est("fructanos-trigo"), est("fructanos-verdura"));
    }
    var mapa = { "Fructosa": "fructosa", "Lactosa": "lactosa", "Sorbitol": "sorbitol",
                 "Manitol": "manitol", "GOS": "gos" };
    return est(mapa[fodmapNombre] || "");
  }

  // Nivel personalizado de un alimento dado el mapa de tolerancias.
  // Devuelve { nivel, nota } o null si el alimento NO cambia.
  function nivelPersonalizado(alimento, tolerancias) {
    if (!alimento || !Array.isArray(alimento.fodmap) || alimento.fodmap.length === 0) return null;
    var estados = alimento.fodmap.map(function (f) { return estadoFodmap(f, tolerancias); });
    var hayBloqueante = estados.some(function (e) { return e !== "tolera" && e !== "limite"; });
    if (hayBloqueante) return null;                 // algún FODMAP no tolerado o sin probar
    var hayLimite = estados.some(function (e) { return e === "limite"; });
    if (hayLimite) {
      if (alimento.nivel === "amarillo") return null; // ya es amarillo, no aporta
      return { nivel: "amarillo", nota: "Según tu tolerancia, con moderación." };
    }
    if (alimento.nivel === "verde") return null;      // ya es verde
    return { nivel: "verde", nota: "Según tu tolerancia." };
  }
```

- [ ] **Step 4: Verificar que pasa**

Abrir `index.html?test`. Esperado: `0 ✗`, total subido en 16.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(fase3): lógica pura de re-coloreado (nivelPersonalizado)"
```

---

## Task 3: Lectura del diario de Fase 2 (resumen + sugerencia)

**Files:**
- Modify: `index.html` — sección "FASE 3 · DATOS Y LÓGICA"
- Modify: `index.html` — `registerTests()`

- [ ] **Step 1: Escribir los tests (rojo)**

En `registerTests`, tras el bloque de Task 2, insertar:

```js
    // ---- FASE 3: resumen de Fase 2 + sugerencia de dosis ----
    almacen._mem = { version: 1, retos: {} };
    almacenF3._mem = { version: 1, tolerancias: {}, verSegunTolerancia: false };
    assert(resumenFase2PorGrupo("fructosa") === null, "resumenFase2PorGrupo sin diario devuelve null");
    iniciarReto("fructosa", "Miel", "2026-06-01");
    guardarDia("fructosa", 0, { dolor: 1, hinchazon: 2, gases: 0, notas: "" });
    guardarDia("fructosa", 1, { dolor: 6, hinchazon: 3, gases: 1, notas: "" });
    var rs = resumenFase2PorGrupo("fructosa");
    assert(rs && rs.alimento === "Miel", "resumenFase2PorGrupo devuelve el alimento probado");
    assert(rs.dias[0].pico === 2, "pico de la dosis 1 = máximo de los 3 síntomas");
    assert(rs.dias[1].pico === 6, "pico de la dosis 2 = máximo (6)");
    assert(sugerirLimiteDosis("fructosa") === 1, "sugiere la última dosis sin síntomas altos (dosis 1)");
    reiniciarReto("fructosa");
    assert(sugerirLimiteDosis("fructosa") === 1, "sin diario, la sugerencia por defecto es 1");
```

- [ ] **Step 2: Verificar que falla**

Abrir `index.html?test`. Esperado: rojo `✗ Excepción en tests: resumenFase2PorGrupo is not defined`.

- [ ] **Step 3: Implementar**

Añadir en la sección "FASE 3 · DATOS Y LÓGICA", debajo de `nivelPersonalizado()`:

```js
  // Lee el diario de Fase 2 de un grupo y devuelve el pico de síntomas por dosis.
  function resumenFase2PorGrupo(id) {
    var p = (almacen.cargar().retos || {})[id];
    if (!p) return null;
    return {
      alimento: p.alimentoElegido,
      dias: p.dias.map(function (d) {
        return {
          etiqueta: d.etiqueta,
          dosis: d.dosis,
          guardado: d.guardado,
          pico: Math.max(d.dolor || 0, d.hinchazon || 0, d.gases || 0)
        };
      })
    };
  }

  // Sugerencia (NO veredicto) de hasta qué dosis llegó sin síntomas altos (pico < 4).
  function sugerirLimiteDosis(id) {
    var r = resumenFase2PorGrupo(id);
    if (!r) return 1;
    var sug = 0;
    r.dias.forEach(function (d, i) {
      if (d.guardado && d.pico < 4) sug = i + 1;
    });
    return sug || 1;
  }
```

- [ ] **Step 4: Verificar que pasa**

Abrir `index.html?test`. Esperado: `0 ✗`, total subido en 6.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(fase3): lectura del diario de Fase 2 (resumen y sugerencia de dosis)"
```

---

## Task 4: Copia de seguridad unificada (Fase 2 + Fase 3)

**Files:**
- Modify: `index.html` — sección "FASE 3 · DATOS Y LÓGICA" (`exportarTodo`, `importarTodo`)
- Modify: `index.html` — `wireAcciones()` (~1152) y `pedirImportar()` (~1140)
- Modify: `index.html` — `registerTests()`

- [ ] **Step 1: Escribir los tests (rojo)**

En `registerTests`, tras el bloque de Task 3, insertar:

```js
    // ---- FASE 3: copia de seguridad unificada ----
    almacen._mem = { version: 1, retos: {} };
    almacenF3._mem = { version: 1, tolerancias: {}, verSegunTolerancia: false };
    iniciarReto("lactosa", "Leche normal", "2026-06-01");
    setTolerancia("lactosa", "tolera", null);
    var copia = exportarTodo();
    almacen._mem = { version: 1, retos: {} };
    almacenF3._mem = { version: 1, tolerancias: {}, verSegunTolerancia: false };
    assert(importarTodo(copia) === true, "importarTodo (formato nuevo) funciona");
    assert(progresoDe("lactosa") && progresoDe("lactosa").alimentoElegido === "Leche normal", "importarTodo restaura Fase 2");
    assert(toleranciaDe("lactosa").estado === "tolera", "importarTodo restaura Fase 3");
    // formato antiguo: solo Fase 2 "pelado" ({version, retos})
    almacen._mem = { version: 1, retos: {} };
    almacenF3._mem = { version: 1, tolerancias: { "manitol": { estado: "no" } }, verSegunTolerancia: false };
    var viejo = JSON.stringify({ version: 1, retos: { "gos": { alimentoElegido: "Garbanzos de bote", personalizado: false, fechaInicio: "2026-06-01", dias: [] } } });
    assert(importarTodo(viejo) === true, "importarTodo acepta copia antigua (solo Fase 2)");
    assert(progresoDe("gos") && progresoDe("gos").alimentoElegido === "Garbanzos de bote", "copia antigua restaura Fase 2");
    assert(toleranciaDe("manitol").estado === "no", "copia antigua NO pisa las tolerancias de Fase 3");
    assert(importarTodo("{ no es json") === false, "importarTodo con JSON inválido devuelve false");
    assert(importarTodo('{"foo":1}') === false, "importarTodo sin secciones reconocibles devuelve false");
    almacen._mem = { version: 1, retos: {} };
    almacenF3._mem = { version: 1, tolerancias: {}, verSegunTolerancia: false };
```

- [ ] **Step 2: Verificar que falla**

Abrir `index.html?test`. Esperado: rojo `✗ Excepción en tests: exportarTodo is not defined`.

- [ ] **Step 3: Implementar `exportarTodo` / `importarTodo`**

Añadir en la sección "FASE 3 · DATOS Y LÓGICA", debajo de `sugerirLimiteDosis()`:

```js
  // Copia de seguridad unificada: Fase 2 + Fase 3 en un solo objeto.
  function exportarTodo() {
    return JSON.stringify({
      app: "sii-fodmap",
      fase2: almacen.cargar(),
      fase3: almacenF3.cargar()
    }, null, 2);
  }

  // Importa el formato nuevo {app, fase2, fase3} o el antiguo {version, retos}.
  // Devuelve true si aplicó algo; false si el JSON no es reconocible (no pisa nada).
  function importarTodo(json) {
    var p;
    try { p = JSON.parse(json); } catch (e) { return false; }
    if (!p || typeof p !== "object") return false;
    // Formato nuevo
    if (p.fase2 && typeof p.fase2 === "object" && p.fase2.retos && typeof p.fase2.retos === "object") {
      almacen.guardar({ version: p.fase2.version || 1, retos: p.fase2.retos });
      if (p.fase3 && typeof p.fase3 === "object" && p.fase3.tolerancias && typeof p.fase3.tolerancias === "object") {
        almacenF3.guardar({
          version: p.fase3.version || 1,
          tolerancias: p.fase3.tolerancias,
          verSegunTolerancia: !!p.fase3.verSegunTolerancia
        });
      }
      return true;
    }
    // Formato antiguo (solo Fase 2): no toca Fase 3
    if (p.retos && typeof p.retos === "object") {
      almacen.guardar({ version: p.version || 1, retos: p.retos });
      return true;
    }
    return false;
  }
```

- [ ] **Step 4: Conectar la UI a las funciones unificadas**

En `wireAcciones()` (~línea 1152), cambiar la acción "exportar":

```js
        if (a === "exportar") descargar("diario-fodmap.json", exportarTodo());
```

En `pedirImportar()` (~línea 1140), cambiar el callback de carga:

```js
      fr.onload = function () {
        if (importarTodo(fr.result)) { alert("Copia importada correctamente."); renderApp(); }
        else alert("El archivo no es una copia válida. No se ha cambiado nada.");
      };
```

(Los tests `almacen.exportar`/`almacen.importar` de Fase 2 siguen intactos; la UI ahora usa las versiones unificadas.)

- [ ] **Step 5: Verificar que pasa**

Abrir `index.html?test`. Esperado: `0 ✗`, total subido en 8.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(fase3): copia de seguridad unificada (Fase 2 + Fase 3)"
```

---

## Task 5: Vista del panel de Personalización + tercera pestaña

**Files:**
- Modify: `index.html` — `<style>` (~149)
- Modify: `index.html` — nueva sección "FASE 3 · RENDER" tras `renderResumen()` (~1392)
- Modify: `index.html` — `renderApp()` (~908-921)

> Esta tarea es de UI; la verificación es **manual en el navegador** (no añade asserts).

- [ ] **Step 1: Añadir el CSS**

En el `<style>`, justo antes de `</style>` (tras la línea de `.resumen-grupo th{...}`), añadir:

```css
    /* ---- Fase 3 (personalización) ---- */
    .tol-card{border:1px solid var(--linea);border-radius:var(--radio);padding:14px;margin-bottom:12px;background:var(--sup);box-shadow:var(--sombra)}
    .tol-card h3{margin:0 0 4px;font-size:1.05rem}
    .tol-card label{display:block;font-size:.85rem;color:var(--gris);margin-top:6px}
    .tol-picos{font-size:.78rem;color:var(--gris);margin:2px 0 6px}
    .tol-picos .alto{color:var(--rojo);font-weight:700}
    .tol-picos-ley{opacity:.8}
    .tol-banner{font-size:.8rem;color:var(--verde);background:var(--verde-bg);border:1px solid var(--verde-borde);border-radius:10px;padding:8px 10px;margin:10px 0}
    .card-antes{font-size:.72rem;color:var(--gris)}
    @media(max-width:380px){.tab{font-size:.82rem;padding:10px 4px}}
```

- [ ] **Step 2: Implementar `renderFase3`**

Insertar tras la función `renderResumen()` (~línea 1392), antes del comentario "MOTOR DE TESTS":

```js
  /* ============================================================
     FASE 3 · RENDER (panel de personalización)
     ============================================================ */
  var ETIQUETAS_ESTADO = {
    sin_probar: "Sin probar",
    tolera: "Tolero",
    limite: "Tolero con límite",
    no: "No tolero"
  };

  function renderFase3() {
    var v = document.getElementById("vista");
    if (!v) return;
    var tol = almacenF3.cargar().tolerancias;
    var nTolera = 0;
    RETOS.forEach(function (r) {
      var e = (tol[r.id] || {}).estado;
      if (e === "tolera" || e === "limite") nTolera++;
    });

    var cards = RETOS.map(function (r) {
      var t = toleranciaDe(r.id);
      var resumen = resumenFase2PorGrupo(r.id);
      var picos = resumen
        ? '<p class="tol-picos">Fase 2 · ' + escapeHTML(resumen.alimento) + ': ' +
          resumen.dias.map(function (d) {
            return d.etiqueta.replace("Dosis ", "D") + ' ' +
              '<span class="' + (d.pico >= 4 ? "alto" : "") + '">' + d.pico + '</span>';
          }).join(" · ") + ' <span class="tol-picos-ley">(pico 0-10)</span></p>'
        : '<p class="tol-picos">Sin diario en Fase 2 (puedes marcarlo igualmente).</p>';

      var opcs = ["sin_probar", "tolera", "limite", "no"].map(function (e) {
        return '<option value="' + e + '"' + (t.estado === e ? " selected" : "") + '>' +
          ETIQUETAS_ESTADO[e] + '</option>';
      }).join("");

      var sugerida = t.limiteDosis || sugerirLimiteDosis(r.id);
      var limOpcs = [1, 2, 3].map(function (n) {
        return '<option value="' + n + '"' + (sugerida === n ? " selected" : "") + '>Hasta la dosis ' + n + '</option>';
      }).join("");
      var limWrap = '<label class="tol-lim"' + (t.estado === "limite" ? "" : " hidden") +
        ' data-limwrap="' + escapeHTML(r.id) + '">Cantidad que toleras' +
        '<select class="alim" data-limite="' + escapeHTML(r.id) + '">' + limOpcs + '</select></label>';

      return '<div class="tol-card"><h3>' + escapeHTML(r.grupo) + '</h3>' +
        picos +
        '<label>¿Lo toleras?' +
        '<select class="alim" data-tol="' + escapeHTML(r.id) + '">' + opcs + '</select></label>' +
        limWrap + '</div>';
    }).join("");

    v.innerHTML =
      '<header><h1>🌱 Personalización</h1>' +
      '<p class="aviso">Fase 3: marca qué toleras (lo decides tú con tu dietista a partir de tu diario de Fase 2). ' +
      'La app <strong>no diagnostica</strong>: solo guarda lo que tú indicas.</p></header>' +
      '<p class="intro">Toleras <strong>' + nTolera + ' de ' + RETOS.length + '</strong> grupos. ' +
      'En el Buscador puedes activar “🌱 Ver según mi tolerancia”.</p>' +
      cards +
      '<div class="btn-row">' +
        '<button class="btn sec" data-accion="exportar">⬇️ Exportar copia</button>' +
        '<button class="btn sec" data-accion="importar">⬆️ Importar copia</button>' +
      '</div>' +
      (almacenF3.disponible && almacenF3.disponible() === false
        ? '<p class="aviso">⚠️ Tu navegador no permite guardar automáticamente. Usa "Exportar copia".</p>' : '') +
      '<footer>Tú marcas la tolerancia; la app solo la registra. Coméntalo siempre con tu dietista.</footer>';

    Array.prototype.forEach.call(v.querySelectorAll("[data-tol]"), function (sel) {
      sel.addEventListener("change", function () {
        var id = sel.getAttribute("data-tol");
        var limSel = v.querySelector('[data-limite="' + id + '"]');
        var lim = limSel ? Number(limSel.value) : null;
        setTolerancia(id, sel.value, lim);
        renderFase3();
        window.scrollTo(0, 0);
      });
    });
    Array.prototype.forEach.call(v.querySelectorAll("[data-limite]"), function (sel) {
      sel.addEventListener("change", function () {
        setTolerancia(sel.getAttribute("data-limite"), "limite", Number(sel.value));
      });
    });
    wireAcciones(v);
  }
```

> Nota: `almacenF3` no define `disponible()`; la condición `almacenF3.disponible && ...` lo deja inerte
> (no muestra el aviso). Es intencional para no duplicar la comprobación; el aviso de almacenamiento ya
> existe en Fase 2. Si se quiere el aviso también aquí, reutilizar `almacen.disponible()`.

- [ ] **Step 3: Añadir la tercera pestaña en `renderApp()`**

En `renderApp()` (~línea 911), cambiar el bloque de pestañas para incluir la tercera y el dispatch:

```js
    app.innerHTML =
      '<div class="tabs">' +
      '<button class="tab' + (vistaActual === "buscador" ? " activo" : "") + '" data-tab="buscador">🔍 Buscador</button>' +
      '<button class="tab' + (vistaActual === "fase2" ? " activo" : "") + '" data-tab="fase2">🔄 Reintroducción</button>' +
      '<button class="tab' + (vistaActual === "fase3" ? " activo" : "") + '" data-tab="fase3">🌱 Personalización</button>' +
      '</div><div id="vista"></div>';
    Array.prototype.forEach.call(app.querySelectorAll("[data-tab]"), function (b) {
      b.addEventListener("click", function () { navegar(b.getAttribute("data-tab")); });
    });
    if (vistaActual === "fase2") renderFase2();
    else if (vistaActual === "fase3") renderFase3();
    else render();
```

(Opcional: actualizar el comentario de `vistaActual` en ~línea 906 a `"buscador" | "fase2" | "fase3"`.)

- [ ] **Step 4: Verificación manual**

Abrir `index.html` en el navegador (vista móvil):
- Aparece la pestaña **🌱 Personalización**; las tres pestañas caben.
- El panel muestra 7 tarjetas. Las que tengan diario de Fase 2 muestran los picos por dosis (en rojo si ≥4).
- Cambiar un grupo a **Tolero con límite** muestra el selector "Hasta la dosis N" con la sugerencia.
- El contador "Toleras X de 7" se actualiza al marcar.
- Recargar la página: los veredictos persisten.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(fase3): panel de personalización y tercera pestaña"
```

---

## Task 6: Integración en el Buscador (interruptor + re-coloreado)

**Files:**
- Modify: `index.html` — `aplicarTolerancia()` en sección "FASE 3 · DATOS Y LÓGICA"
- Modify: `index.html` — `tarjetaHTML()` (~790), `render()` (~824), `enlazarEventos()` (~869)
- Modify: `index.html` — `registerTests()`

- [ ] **Step 1: Escribir el test de `aplicarTolerancia` (rojo)**

En `registerTests`, tras el bloque de Task 4, insertar:

```js
    // ---- FASE 3: aplicarTolerancia (capa sobre DATOS) ----
    almacenF3._mem = { version: 1, tolerancias: {}, verSegunTolerancia: false };
    var muestra = [{ nombre: "X", nivel: "rojo", fodmap: ["Fructosa"], categoria: "Frutas", sinonimos: [] }];
    assert(aplicarTolerancia(muestra)[0].nivel === "rojo", "toggle off: no cambia los niveles");
    almacenF3._mem = { version: 1, tolerancias: { "fructosa": { estado: "tolera" } }, verSegunTolerancia: true };
    var ap = aplicarTolerancia(muestra);
    assert(ap[0].nivel === "verde", "toggle on: re-colorea a verde");
    assert(ap[0]._antes === "rojo", "toggle on: guarda el nivel oficial en _antes");
    assert(muestra[0].nivel === "rojo", "aplicarTolerancia no muta el alimento original");
    almacenF3._mem = { version: 1, tolerancias: {}, verSegunTolerancia: false };
```

- [ ] **Step 2: Verificar que falla**

Abrir `index.html?test`. Esperado: rojo `✗ Excepción en tests: aplicarTolerancia is not defined`.

- [ ] **Step 3: Implementar `aplicarTolerancia`**

Añadir en la sección "FASE 3 · DATOS Y LÓGICA", debajo de `importarTodo()`:

```js
  // Capa de SOLO LECTURA sobre una lista de alimentos. Si el interruptor está activo,
  // devuelve copias con el nivel personalizado y el nivel oficial en _antes. No muta los originales.
  function aplicarTolerancia(lista) {
    var cfg = almacenF3.cargar();
    if (!cfg.verSegunTolerancia) return lista;
    var tol = cfg.tolerancias;
    return lista.map(function (a) {
      var np = nivelPersonalizado(a, tol);
      if (!np) return a;
      var copia = {};
      for (var k in a) { if (Object.prototype.hasOwnProperty.call(a, k)) copia[k] = a[k]; }
      copia.nivel = np.nivel;
      copia._antes = a.nivel;
      return copia;
    });
  }
```

- [ ] **Step 4: Verificar que pasa**

Abrir `index.html?test`. Esperado: `0 ✗`, total subido en 4.

- [ ] **Step 5: Mostrar "antes 🔴" en la tarjeta**

Reemplazar `tarjetaHTML()` (~línea 790) por:

```js
  function tarjetaHTML(a) {
    var antes = a._antes
      ? '<span class="card-antes">antes ' + emojiNivel(a._antes) + '</span>' : "";
    return '<button class="card nivel-' + a.nivel + '" data-nombre="' +
      escapeHTML(a.nombre) + '">' +
      '<span class="emoji">' + emojiNivel(a.nivel) + '</span>' +
      '<span class="card-nombre">' + escapeHTML(a.nombre) + '</span>' +
      '<span class="card-cat">' + escapeHTML(a.categoria) + '</span>' +
      antes + '</button>';
  }
```

- [ ] **Step 6: Usar `aplicarTolerancia` y añadir interruptor + banner en `render()`**

En `render()` (~línea 824), cambiar la línea de resultados:

```js
    var base = aplicarTolerancia(DATOS);
    var resultados = buscar(estado.texto, base, estado.categoria, estado.soloSeguros);
```

En el mismo `render()`, justo después de la `<label class="seguros">…Mostrar solo seguros 🟢</label>`, añadir el interruptor:

```js
      (hayAlgunaTolerancia()
        ? '<label class="seguros"><input type="checkbox" id="verTol"' +
          (almacenF3.cargar().verSegunTolerancia ? " checked" : "") +
          '> 🌱 Ver según mi tolerancia</label>'
        : '') +
```

Y justo antes de `'<p class="conteo">'`, añadir el banner informativo:

```js
      (almacenF3.cargar().verSegunTolerancia
        ? '<p class="tol-banner">🌱 Viendo según tu tolerancia. Cada ficha mantiene su clasificación oficial.</p>'
        : '') +
```

- [ ] **Step 7: Enlazar el interruptor en `enlazarEventos()`**

En `enlazarEventos()` (~línea 869), tras el bloque del checkbox `soloSeguros`, añadir:

```js
    var vt = document.getElementById("verTol");
    if (vt) vt.addEventListener("change", function (e) {
      setVerSegunTolerancia(e.target.checked);
      render();
    });
```

- [ ] **Step 8: Verificación manual**

Abrir `index.html`:
- Sin tolerancias marcadas, el interruptor "🌱 Ver según mi tolerancia" **no** aparece en el Buscador.
- Marcar en Fase 3 "Tolero" en Fructanos (trigo) **y** (verdura). Volver al Buscador: aparece el interruptor.
- Activarlo: **Cebolla/Ajo/Puerro** pasan a 🟢 con "antes 🔴"; aparece el banner. "Champiñón" (manitol, sin tolerar) sigue 🔴.
- Abrir la ficha de Cebolla: la ficha mantiene la **clasificación oficial** (🔴) y su fuente.
- "Mostrar solo seguros 🟢" con el interruptor activo incluye los alimentos re-coloreados a verde.
- Desactivar el interruptor: vuelve todo a la clasificación oficial. La preferencia persiste al recargar.

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat(fase3): interruptor 'ver según mi tolerancia' en el Buscador"
```

---

## Task 7: Publicación (service worker, docs, verificación final)

**Files:**
- Modify: `sw.js` (línea 1)
- Modify: `README.md`
- Modify: `ESTADO.md`

- [ ] **Step 1: Subir la versión del service worker**

En `sw.js` línea 1, cambiar:

```js
const VERSION = 'v6';
```

- [ ] **Step 2: Ejecutar la batería de tests y anotar el total**

Abrir `index.html?test`. Confirmar `0 ✗`. Anotar el total de ✓ (debería ser **102** = 59 previos + 43 nuevos; si difiere, usar el número real mostrado).

- [ ] **Step 3: Actualizar `README.md`**

- Cambiar las dos menciones de `59 ✓` (sección de cabecera implícita y sección "Tests", ~línea 68) por el número real.
- Añadir tras la sección "🔄 Fase 2 — Reintroducción" una sección "🌱 Fase 3 — Personalización" describiendo el panel de tolerancias y el interruptor "Ver según mi tolerancia" del Buscador. Texto sugerido:

```markdown
## 🌱 Fase 3 — Personalización

La pestaña **Personalización** resume tu diario de Fase 2 (picos de síntomas por dosis) y te
deja marcar, por cada grupo FODMAP, si lo toleras: *Sin probar / Tolero / Tolero con límite / No tolero*.
**Tú marcas la tolerancia; la app no diagnostica.**

Con eso, en el **Buscador** aparece el interruptor **"🌱 Ver según mi tolerancia"**: al activarlo,
los alimentos que solo estaban limitados por un FODMAP que ahora toleras cambian de color
(con la nota "antes 🔴"). La ficha de cada alimento mantiene siempre su clasificación oficial.
La copia de seguridad (Exportar/Importar) incluye también esta información.
```

- [ ] **Step 4: Actualizar `ESTADO.md`**

- Cabecera: fecha de última actualización → 2026-06-04; nº de tests al real.
- Resumen: mencionar las 3 fases completadas.
- Sección "Módulos": añadir "### 3. Personalización (Fase 3) — ✅ Completado" con bullets (panel de tolerancias leyendo Fase 2; 4 estados + dosis-límite; interruptor de re-coloreado en el Buscador con reglas conservadoras; copia de seguridad unificada; no diagnostica).
- "Historial de avances": añadir fila `| 2026-06-04 | Fase 3: panel de personalización + Buscador personalizado (SW v6) |`.
- "Backlog": quitar/parcar como hecho la línea de Fase 3.
- "Versión del SW": reflejar v6.

- [ ] **Step 5: Verificación final (verification-before-completion)**

- `index.html?test` → `0 ✗`, total = el anotado.
- Recorrido manual de las 3 pestañas en vista móvil (claro y oscuro): Buscador, Reintroducción, Personalización.
- Exportar copia → borrar datos (DevTools › Application › Local Storage) → Importar → comprobar que se restauran Fase 2 y Fase 3.

- [ ] **Step 6: Commit**

```bash
git add sw.js README.md ESTADO.md
git commit -m "docs+pwa: Fase 3 (personalización), SW v6 y actualización de estado"
```

- [ ] **Step 7 (opcional): Publicar**

Si la usuaria lo pide, `git push`. GitHub Pages actualiza en ~1 min y Laura verá el banner de actualización.

---

## Self-Review (cobertura del spec)

- **§1 Propósito (resumen + veredicto + interruptor):** Tasks 3, 5, 6. ✓
- **§2 Decisiones (ambas, manual, 3 estados + dosis, interruptor, nombre, fructanos restrictivo, backup unificado):** Tasks 1-6. ✓
- **§3 Navegación (tercera pestaña):** Task 5. ✓
- **§4 Panel de tolerancias (tarjeta por grupo, resumen Fase 2, selector, dosis-límite sugerida, sin diario):** Tasks 3, 5. ✓
- **§5 Modelo de datos y persistencia (clave `sii_fodmap_fase3_v1`, estados, backup unificado con compat. antigua):** Tasks 1, 4. ✓
- **§6 Re-coloreado (función pura, reglas conservadoras, motivo nunca cambia, multi-FODMAP, fructanos restrictivo, interruptor, "antes 🔴", solo seguros, ficha oficial):** Tasks 2, 6. ✓
- **§7 Arquitectura (funciones puras aisladas, capa de solo lectura, estados separados):** Tasks 1, 2, 6. ✓
- **§8 Errores y robustez (try/catch, importar valida, copia antigua no rompe, no muta DATOS):** Tasks 1, 4, 6. ✓
- **§9 Verificación (auto-tests de nivelPersonalizado, severidadFructanos→peorEstado, almacenF3, export/import unificado, sugerencia; manual):** Tasks 1-7. ✓
- **§10 Fuera de alcance:** respetado (sin re-challenge, sin diagnóstico, sin sub-clasificar fructanos por alimento). ✓
