# PWA + GitHub Pages + Tutorial — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la app de un solo HTML en una PWA instalable publicada en GitHub Pages, con actualización automática avisada por un banner, e incorporar un tutorial interactivo lanzable con un botón.

**Architecture:** Se renombra `SII-FODMAP.html` a `index.html` y se añaden `manifest.json`, `sw.js` y `icons/`. El service worker cachea los assets (offline) y, cuando hay versión nueva, queda en espera y dispara un banner que el usuario aplica con un botón. El tutorial es un tour vanilla JS (overlay + tooltip) embebido en el propio HTML, dirigido por un array de pasos validado con tests.

**Tech Stack:** HTML/CSS/JS vanilla (sin dependencias, sin build), Service Worker API, Web App Manifest, GitHub Pages, `gh` CLI.

**Verificación de tests:** Este proyecto verifica abriendo `index.html?test` en un navegador → debe mostrar `N ✓ / 0 ✗`. No hay runner de consola. Tras cada tarea que toque lógica, abrir esa URL y confirmar verde antes de commitear.

---

## Estructura de archivos

```
index.html                  (renombrado desde SII-FODMAP.html; + links head, + SW reg, + banner, + tutorial)
manifest.json               (nuevo)
sw.js                       (nuevo)
icons/icon-192.png          (nuevo, binario)
icons/icon-512.png          (nuevo, binario)
tools/generar-iconos.html   (nuevo, utilidad de un uso para generar los PNG sin dependencias)
README.md                   (modificado: instrucciones de instalación PWA)
ESTADO.md                   (modificado: nuevo hito)
```

---

## Task 1: Renombrar el archivo a index.html

**Files:**
- Rename: `SII-FODMAP.html` → `index.html`

- [ ] **Step 1: Renombrar con git para preservar historial**

```bash
cd "c:/Users/raulo/OneDrive/Escritorio/COWORD LOCAL/07-APP SII (LAURA)"
git mv SII-FODMAP.html index.html
```

- [ ] **Step 2: Verificar que los tests siguen verdes**

Abrir en el navegador: `index.html?test`
Esperado: `59 ✓ / 0 ✗` (el contenido no ha cambiado, solo el nombre).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: renombrar SII-FODMAP.html a index.html para GitHub Pages"
```

---

## Task 2: manifest.json

**Files:**
- Create: `manifest.json`

- [ ] **Step 1: Crear el manifest**

```json
{
  "name": "App SII / FODMAP",
  "short_name": "SII FODMAP",
  "description": "Buscador de alimentos y guia de reintroduccion FODMAP",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#2e7d32",
  "lang": "es",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Nota: `theme_color` `#2e7d32` coincide con el verde real de la app (`--verde` en el `<style>`, y el `<meta name="theme-color">` existente).

- [ ] **Step 2: Commit**

```bash
git add manifest.json
git commit -m "feat: añadir manifest.json para PWA"
```

---

## Task 3: Iconos (sin dependencias)

Generamos los PNG con una utilidad HTML que dibuja en `<canvas>` y descarga los archivos. No requiere instalar nada.

**Files:**
- Create: `tools/generar-iconos.html`
- Create: `icons/icon-192.png` (generado)
- Create: `icons/icon-512.png` (generado)

- [ ] **Step 1: Crear la utilidad generadora**

```html
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Generar iconos SII/FODMAP</title></head>
<body style="font-family:system-ui;padding:20px">
  <h1>Iconos de la app</h1>
  <p>Pulsa el boton. Se descargaran <code>icon-192.png</code> y <code>icon-512.png</code>.
     Muevelos a la carpeta <code>icons/</code> del proyecto.</p>
  <div id="prev"></div>
  <button id="go" style="font-size:1.1rem;padding:10px 18px;margin-top:12px">Generar y descargar</button>
  <script>
  function dibujar(size){
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#2e7d32";              // verde de la app
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + Math.round(size * 0.34) + "px system-ui, sans-serif";
    ctx.fillText("SII", size / 2, size * 0.5);
    return c;
  }
  function descargar(canvas, nombre){
    canvas.toBlob(function(blob){
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = nombre;
      a.click();
    }, "image/png");
  }
  var prev = document.getElementById("prev");
  [192, 512].forEach(function(s){ prev.appendChild(dibujar(s)); });
  document.getElementById("go").addEventListener("click", function(){
    descargar(dibujar(192), "icon-192.png");
    descargar(dibujar(512), "icon-512.png");
  });
  </script>
</body>
</html>
```

- [ ] **Step 2: Generar los PNG**

Abrir `tools/generar-iconos.html` en el navegador, pulsar "Generar y descargar", y mover los dos archivos descargados a `icons/`.

- [ ] **Step 3: Verificar**

Comprobar que existen `icons/icon-192.png` y `icons/icon-512.png` y que se ven (fondo verde, "SII" en blanco).

```bash
ls icons/
```
Esperado: `icon-192.png  icon-512.png`

- [ ] **Step 4: Commit**

```bash
git add tools/generar-iconos.html icons/icon-192.png icons/icon-512.png
git commit -m "feat: iconos PWA y utilidad generadora sin dependencias"
```

---

## Task 4: Enlazar manifest e iconos en el head

**Files:**
- Modify: `index.html` (head, tras la línea `<title>...`)

- [ ] **Step 1: Añadir los links en el `<head>`**

Localizar en `index.html`:
```html
  <title>¿Puedo comerlo? · SII/FODMAP</title>
```

Insertar justo debajo:
```html
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
```

- [ ] **Step 2: Verificar tests**

Abrir `index.html?test` → `59 ✓ / 0 ✗` (los links en head no afectan a la lógica).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: enlazar manifest e icono en el head"
```

---

## Task 5: Service worker + registro + banner de actualización

El SW cachea los assets y, al detectar versión nueva, queda en espera. La página detecta el SW en espera y muestra el banner; el botón aplica la actualización.

**Files:**
- Create: `sw.js`
- Modify: `index.html` (CSS del banner en `<style>`; registro + banner JS antes de `document.addEventListener("DOMContentLoaded", init);`)

- [ ] **Step 1: Crear `sw.js`**

```js
// Incrementar VERSION en cada publicacion para forzar actualizacion.
const VERSION = 'v1';
const CACHE = 'sii-fodmap-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  // No llamamos skipWaiting: el SW nuevo queda en espera para que la pagina avise.
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cacheado) {
      return cacheado || fetch(e.request);
    })
  );
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
```

- [ ] **Step 2: Añadir el CSS del banner**

En `index.html`, localizar el final del `<style>` (la línea `</style>`) e insertar justo antes:
```css
    /* ---- Banner de actualizacion ---- */
    #banner-update{position:fixed;left:0;right:0;bottom:0;z-index:9000;background:var(--verde);
      color:#fff;padding:12px 14px;box-shadow:0 -2px 10px rgba(0,0,0,.18);
      display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    #banner-update .bu-txt{flex:1;min-width:180px;font-size:.9rem;line-height:1.3}
    #banner-update .bu-txt strong{display:block;font-size:.98rem}
    #banner-update button{background:#fff;color:var(--verde);border:none;border-radius:8px;
      padding:10px 16px;font-size:.95rem;font-family:inherit;font-weight:700;cursor:pointer}
```

- [ ] **Step 3: Añadir el registro del SW y el banner**

En `index.html`, localizar:
```js
  document.addEventListener("DOMContentLoaded", init);
```

Insertar **justo antes** de esa línea:
```js
  /* ============================================================
     SERVICE WORKER + BANNER DE ACTUALIZACION
     ============================================================ */
  function mostrarBannerActualizacion(worker) {
    if (document.getElementById("banner-update")) return;
    var b = document.createElement("div");
    b.id = "banner-update";
    b.innerHTML =
      '<div class="bu-txt"><strong>🔄 Nueva versión disponible</strong>' +
      'Tus datos NO se perderán al actualizar.</div>' +
      '<button type="button">Actualizar ahora</button>';
    document.body.appendChild(b);
    b.querySelector("button").addEventListener("click", function () {
      worker.postMessage({ type: "SKIP_WAITING" });
    });
  }

  function registrarSW() {
    if (!("serviceWorker" in navigator)) return;
    if (location.search.indexOf("test") !== -1) return; // no interferir con ?test
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) {
        mostrarBannerActualizacion(reg.waiting);
      }
      reg.addEventListener("updatefound", function () {
        var nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener("statechange", function () {
          if (nuevo.state === "installed" && navigator.serviceWorker.controller) {
            mostrarBannerActualizacion(nuevo);
          }
        });
      });
    });
    var recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (recargando) return;
      recargando = true;
      window.location.reload();
    });
  }
```

- [ ] **Step 4: Llamar a `registrarSW()` en el arranque**

Localizar la función `init`:
```js
  function init() {
    if (location.search.indexOf("test") !== -1) {
      runTests();
      return;
    }
    renderApp();
  }
```

Sustituir por:
```js
  function init() {
    if (location.search.indexOf("test") !== -1) {
      runTests();
      return;
    }
    renderApp();
    registrarSW();
  }
```

- [ ] **Step 5: Verificar tests**

Abrir `index.html?test` → `59 ✓ / 0 ✗` (el registro se salta en modo test).

- [ ] **Step 6: Verificación manual del SW (servidor local)**

Los service workers requieren http(s), no `file://`. Levantar un servidor local:
```bash
cd "c:/Users/raulo/OneDrive/Escritorio/COWORD LOCAL/07-APP SII (LAURA)"
python -m http.server 8000
```
Abrir `http://localhost:8000/`. En DevTools → Application → Service Workers debe aparecer `sw.js` activado. Recargar offline (DevTools → Network → Offline) y comprobar que la app sigue cargando.

- [ ] **Step 7: Commit**

```bash
git add sw.js index.html
git commit -m "feat: service worker con cache offline y banner de actualización"
```

---

## Task 6a: Datos del tutorial + tests (TDD)

Definimos el array de pasos y su validador, con tests, antes de la UI.

**Files:**
- Modify: `index.html` (array `TUTORIAL_PASOS` + `validarPaso` antes de `document.addEventListener`; tests en `registerTests`)

- [ ] **Step 1: Escribir los tests primero**

En `index.html`, dentro de `registerTests(assert)`, localizar la última línea antes del cierre de la función:
```js
    almacen._mem = { version: 1, retos: {} }; // dejar limpio
  }
```

Insertar **antes** de esa línea:
```js
    // ---- TUTORIAL: pasos ----
    assert(TUTORIAL_PASOS.length === 8, "el tutorial tiene 8 pasos (hay " + TUTORIAL_PASOS.length + ")");
    var errPasos = [];
    TUTORIAL_PASOS.forEach(function (p, i) {
      var e = validarPaso(p);
      if (e.length) errPasos.push("paso " + (i + 1) + ": " + e.join(", "));
    });
    assert(errPasos.length === 0, "todos los pasos del tutorial son válidos" +
      (errPasos.length ? " — " + errPasos.join(" | ") : ""));
    assert(TUTORIAL_PASOS.every(function (p) { return p.tab === "buscador" || p.tab === "fase2"; }),
      "cada paso apunta a una pestaña válida");
```

- [ ] **Step 2: Ejecutar y ver que falla**

Abrir `index.html?test`.
Esperado: FALLA con excepción `TUTORIAL_PASOS is not defined` (mostrada como "Excepción en tests: ...").

- [ ] **Step 3: Implementar `TUTORIAL_PASOS` y `validarPaso`**

En `index.html`, insertar **antes** de `document.addEventListener("DOMContentLoaded", init);` (junto al resto de bloques nuevos):
```js
  /* ============================================================
     TUTORIAL INTERACTIVO · datos
     Cada paso: tab destino, selector a resaltar (null = centrado),
     titulo y texto. Si el selector no encuentra elemento, el tooltip
     se centra sin foco (robusto ante estados sin datos).
     ============================================================ */
  var TUTORIAL_PASOS = [
    { tab: "buscador", sel: "header",
      titulo: "Bienvenida",
      texto: "Esta app te ayuda a saber qué alimentos tolerar mejor con SII y a hacer la reintroducción. Es orientativa, no sustituye a tu dietista." },
    { tab: "buscador", sel: "#q",
      titulo: "Busca tu alimento",
      texto: "Escribe aquí. Entiende tildes, mayúsculas y sinónimos (ej. 'cebolleta' encuentra cebolla)." },
    { tab: "buscador", sel: ".grid .card",
      titulo: "El semáforo FODMAP",
      texto: "Cada alimento tiene un color: 🟢 seguro, 🟡 con moderación, 🔴 mejor evitar. Toca uno para ver ración, alternativas y consejo." },
    { tab: "buscador", sel: ".chips",
      titulo: "Filtra la lista",
      texto: "Filtra por categoría con estos botones, o marca 'Mostrar solo seguros 🟢' justo encima para ver solo los verdes." },
    { tab: "buscador", sel: "[data-tab=\"fase2\"]",
      titulo: "Fase 2: Reintroducción",
      texto: "Cuando tu dietista lo indique, esta pestaña te guía para reintroducir grupos de alimentos uno a uno." },
    { tab: "fase2", sel: ".reto-card",
      titulo: "Elige el reto",
      texto: "Elige el grupo FODMAP a probar (fructosa, lactosa…) y el alimento. También puedes añadir uno personalizado." },
    { tab: "fase2", sel: null,
      titulo: "Registra tus síntomas",
      texto: "Durante el reto anotarás cada día tu dolor, hinchazón y gases (0-10) y notas. Se guarda solo en tu móvil." },
    { tab: "fase2", sel: "[data-accion=\"resumen\"]",
      titulo: "Resumen para tu dietista",
      texto: "Cuando termines, aquí ves y exportas un resumen para enseñárselo a tu dietista." }
  ];

  function validarPaso(p) {
    var e = [];
    if (!p || typeof p !== "object") { return ["no es un objeto"]; }
    if (p.tab !== "buscador" && p.tab !== "fase2") e.push("tab inválida");
    if (typeof p.titulo !== "string" || !p.titulo) e.push("falta título");
    if (typeof p.texto !== "string" || !p.texto) e.push("falta texto");
    if (p.sel !== null && typeof p.sel !== "string") e.push("sel debe ser string o null");
    return e;
  }
```

- [ ] **Step 4: Ejecutar y ver verde**

Abrir `index.html?test`.
Esperado: `62 ✓ / 0 ✗` (59 previos + 3 nuevos).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: datos del tutorial (pasos) con validación y tests"
```

---

## Task 6b: UI del tutorial (overlay, tooltip, botón ?)

**Files:**
- Modify: `index.html` (CSS del tour en `<style>`; función `iniciarTutorial` y botón `?`; llamada en `init`)

- [ ] **Step 1: Añadir el CSS del tour**

En `index.html`, antes de `</style>`, insertar:
```css
    /* ---- Tutorial interactivo ---- */
    #tut-btn{position:fixed;top:10px;right:10px;z-index:8000;width:38px;height:38px;border-radius:50%;
      border:none;background:var(--verde);color:#fff;font-size:1.2rem;font-weight:700;cursor:pointer;
      box-shadow:0 2px 6px rgba(0,0,0,.2)}
    #tut-overlay{position:fixed;inset:0;z-index:8500;background:rgba(0,0,0,.55)}
    #tut-overlay .tut-foco{position:absolute;border-radius:10px;box-shadow:0 0 0 3px var(--verde),0 0 0 9999px rgba(0,0,0,.55);
      transition:all .2s ease;pointer-events:none}
    #tut-tooltip{position:fixed;left:12px;right:12px;bottom:14px;z-index:8600;background:#fff;border-radius:14px;
      padding:16px;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:540px;margin:0 auto}
    #tut-tooltip h3{margin:0 0 6px;font-size:1.05rem;color:var(--verde)}
    #tut-tooltip p{margin:0 0 12px;font-size:.92rem}
    #tut-tooltip .tut-nav{display:flex;align-items:center;gap:8px}
    #tut-tooltip .tut-paso{font-size:.78rem;color:var(--gris);margin-right:auto}
    #tut-tooltip button{border:none;border-radius:8px;padding:9px 14px;font-size:.9rem;font-family:inherit;cursor:pointer}
    #tut-tooltip .tut-sec{background:#fff;color:var(--verde);border:1px solid var(--verde)}
    #tut-tooltip .tut-pri{background:var(--verde);color:#fff}
    #tut-tooltip .tut-skip{background:none;color:var(--gris);padding:9px 6px}
```

- [ ] **Step 2: Implementar el tour**

En `index.html`, antes de `document.addEventListener("DOMContentLoaded", init);`, insertar:
```js
  /* ============================================================
     TUTORIAL INTERACTIVO · motor
     ============================================================ */
  var tutIndice = 0;

  function cerrarTutorial() {
    var o = document.getElementById("tut-overlay");
    var t = document.getElementById("tut-tooltip");
    if (o) o.parentNode.removeChild(o);
    if (t) t.parentNode.removeChild(t);
  }

  function iniciarTutorial() {
    tutIndice = 0;
    cerrarTutorial();
    var overlay = document.createElement("div");
    overlay.id = "tut-overlay";
    overlay.innerHTML = '<div class="tut-foco" hidden></div>';
    document.body.appendChild(overlay);
    var tip = document.createElement("div");
    tip.id = "tut-tooltip";
    document.body.appendChild(tip);
    mostrarPasoTutorial();
  }

  function mostrarPasoTutorial() {
    var paso = TUTORIAL_PASOS[tutIndice];
    if (vistaActual !== paso.tab) navegar(paso.tab); // cambia de pestaña si hace falta
    // Esperar al re-render antes de medir el elemento
    setTimeout(function () { pintarPasoTutorial(paso); }, 30);
  }

  function pintarPasoTutorial(paso) {
    var overlay = document.getElementById("tut-overlay");
    var tip = document.getElementById("tut-tooltip");
    if (!overlay || !tip) return;
    var foco = overlay.querySelector(".tut-foco");
    var el = paso.sel ? document.querySelector(paso.sel) : null;
    if (el) {
      var r = el.getBoundingClientRect();
      var pad = 6;
      foco.hidden = false;
      foco.style.top = (r.top - pad) + "px";
      foco.style.left = (r.left - pad) + "px";
      foco.style.width = (r.width + pad * 2) + "px";
      foco.style.height = (r.height + pad * 2) + "px";
    } else {
      foco.hidden = true; // sin elemento: solo overlay + tooltip centrado
    }
    var esPrimero = tutIndice === 0;
    var esUltimo = tutIndice === TUTORIAL_PASOS.length - 1;
    tip.innerHTML =
      "<h3>" + escapeHTML(paso.titulo) + "</h3>" +
      "<p>" + escapeHTML(paso.texto) + "</p>" +
      '<div class="tut-nav">' +
      '<span class="tut-paso">' + (tutIndice + 1) + " / " + TUTORIAL_PASOS.length + "</span>" +
      '<button type="button" class="tut-skip" data-tut="salir">Saltar</button>' +
      (esPrimero ? "" : '<button type="button" class="tut-sec" data-tut="prev">← Anterior</button>') +
      '<button type="button" class="tut-pri" data-tut="next">' +
      (esUltimo ? "Terminar" : "Siguiente →") + "</button>" +
      "</div>";
    Array.prototype.forEach.call(tip.querySelectorAll("[data-tut]"), function (b) {
      b.addEventListener("click", function () {
        var accion = b.getAttribute("data-tut");
        if (accion === "salir") { cerrarTutorial(); return; }
        if (accion === "prev") { tutIndice--; mostrarPasoTutorial(); return; }
        if (esUltimo) { cerrarTutorial(); return; }
        tutIndice++;
        mostrarPasoTutorial();
      });
    });
  }

  function montarBotonTutorial() {
    if (document.getElementById("tut-btn")) return;
    var b = document.createElement("button");
    b.id = "tut-btn";
    b.type = "button";
    b.title = "Cómo funciona la app";
    b.textContent = "?";
    b.addEventListener("click", iniciarTutorial);
    document.body.appendChild(b);
  }
```

- [ ] **Step 3: Montar el botón en el arranque**

Localizar `init` (ya modificada en Task 5):
```js
  function init() {
    if (location.search.indexOf("test") !== -1) {
      runTests();
      return;
    }
    renderApp();
    registrarSW();
  }
```

Sustituir por:
```js
  function init() {
    if (location.search.indexOf("test") !== -1) {
      runTests();
      return;
    }
    renderApp();
    montarBotonTutorial();
    registrarSW();
  }
```

- [ ] **Step 4: Verificar tests**

Abrir `index.html?test` → `62 ✓ / 0 ✗` (la UI no afecta a la lógica; el botón no se monta en modo test).

- [ ] **Step 5: Verificación manual del tour**

Abrir `index.html` (o `http://localhost:8000/`). Pulsar el botón `?` arriba a la derecha. Recorrer los 8 pasos con "Siguiente": debe resaltar la búsqueda, una tarjeta, los filtros, cambiar a la pestaña Reintroducción en el paso 6, etc. "Saltar" cierra. "Anterior" retrocede.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: tutorial interactivo con overlay, tooltip y botón ?"
```

---

## Task 7: Publicar en GitHub Pages

**Files:** ninguno (operaciones de repositorio remoto)

- [ ] **Step 1: Comprobar que `gh` está autenticado**

```bash
gh auth status
```
Si no lo está: `gh auth login` (seguir el flujo del navegador). Si `gh` no está instalado, crear el repo manualmente en github.com y añadir el remoto con `git remote add origin <url>`.

- [ ] **Step 2: Crear el repositorio público y subir**

```bash
cd "c:/Users/raulo/OneDrive/Escritorio/COWORD LOCAL/07-APP SII (LAURA)"
gh repo create sii-fodmap --public --source=. --remote=origin --push
```

- [ ] **Step 3: Activar GitHub Pages sobre la rama master, carpeta raíz**

```bash
gh api -X POST repos/{owner}/sii-fodmap/pages -f "source[branch]=master" -f "source[path]=/"
```
Si la rama por defecto del remoto fuese `main`, usar `source[branch]=main`. (El repo local usa `master`.)

- [ ] **Step 4: Obtener la URL publicada**

```bash
gh api repos/{owner}/sii-fodmap/pages --jq .html_url
```
Esperado (ejemplo): `https://<usuario>.github.io/sii-fodmap/`

- [ ] **Step 5: Verificación de despliegue**

Esperar ~1 min y abrir la URL en el móvil. En Chrome Android: menú → "Añadir a pantalla de inicio". Confirmar que se instala con icono propio y abre sin barra del navegador.

- [ ] **Step 6: Verificación del ciclo de actualización (end-to-end)**

1. Subir el `sw.js` actual con la URL ya abierta una vez (cacheada).
2. Editar `sw.js`: cambiar `const VERSION = 'v1';` a `'v2';`. Commit y push.
3. Esperar ~1 min, reabrir la app: debe aparecer el banner "Nueva versión disponible".
4. Pulsar "Actualizar ahora": la app recarga con la versión nueva. Confirmar que cualquier dato del diario introducido antes sigue presente (no se ha perdido).

---

## Task 8: Documentación

**Files:**
- Modify: `README.md`
- Modify: `ESTADO.md`

- [ ] **Step 1: Actualizar README con instalación PWA**

Añadir al `README.md` una sección (ajustar `<usuario>` por el real):
```markdown
## Instalar en el móvil (PWA)

La app está publicada en: `https://<usuario>.github.io/sii-fodmap/`

1. Abre ese enlace en Chrome (Android) o Safari (iPhone).
2. Menú del navegador → **Añadir a pantalla de inicio**.
3. Ábrela desde el icono: funciona offline y a pantalla completa.

### Actualizaciones automáticas
Cuando se publica una mejora, al abrir la app aparece un banner
**"Nueva versión disponible"**. Pulsa **Actualizar ahora**.
Tus datos (diario, síntomas) **no se pierden** al actualizar: se guardan
solo en tu dispositivo.

## Publicar cambios (para el mantenedor)

1. Edita `index.html`.
2. Si quieres que salte el banner de actualización, sube el número en
   `sw.js`: `const VERSION = 'vN';`.
3. `git commit` y `git push`. GitHub Pages despliega en ~1 minuto.
```

- [ ] **Step 2: Actualizar ESTADO.md**

Añadir una fila a la tabla "Historial de avances":
```markdown
| 2026-05-31 | PWA + GitHub Pages: instalable, actualización por banner, tutorial interactivo |
```
Y marcar en el backlog el ítem de recordatorios/PWA como parcialmente desbloqueado (la base PWA ya existe). Actualizar la fecha de "Última actualización" si procede.

- [ ] **Step 3: Commit y push**

```bash
git add README.md ESTADO.md
git commit -m "docs: instrucciones de instalación PWA y actualización"
git push
```

---

## Self-review (cobertura del spec)

- **PWA + GitHub Pages** → Tasks 1, 2, 4, 7. ✓
- **Service worker / caché offline** → Task 5 (`sw.js`, estrategia cache-first, limpieza de cachés antiguas). ✓
- **Detección de updates con `VERSION`** → Task 5 (`sw.js`) + Task 7 step 6 (prueba e2e). ✓
- **Banner de actualización (verde, abajo, "datos no se perderán", botón aplica `skipWaiting` + recarga)** → Task 5. ✓
- **Manifest (nombre, short_name, iconos, colores)** → Task 2. ✓
- **Iconos 192/512** → Task 3. ✓
- **Tutorial: botón `?`, 8 pasos, overlay + foco verde, tooltip abajo con nav/saltar, cambio de tab automático, sin persistencia** → Tasks 6a + 6b. ✓
- **Privacidad (localStorage local)** → reflejado en textos de banner y README; sin cambios de almacenamiento. ✓
- **Los 59 tests siguen verdes tras renombrar; tutorial añade 3 → 62** → Tasks 1, 6a. ✓

Sin placeholders. Nombres consistentes entre tareas: `TUTORIAL_PASOS`, `validarPaso`, `iniciarTutorial`, `mostrarPasoTutorial`, `pintarPasoTutorial`, `montarBotonTutorial`, `cerrarTutorial`, `registrarSW`, `mostrarBannerActualizacion`, `VERSION`/`CACHE`.
