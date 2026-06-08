# Catálogo ampliado (~400) + reintroducir alimento no listado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ampliar el catálogo de alimentos de 131 a ~400 (curado de fuentes públicas, criterio prudente) y añadir en Reintroducción una vía para reintroducir un alimento no listado, con el mismo flujo de reto que los listados.

**Architecture:** Todo vive en `index.html` (un único `<script>`). Los alimentos están en `DATOS[]`; todas las pestañas leen de ahí. Para los no-listados se añade un registro `manualReintro` en el almacén de Fase 2 y un resolvedor `alimentoReintro(nombre)` que devuelve el alimento de `DATOS` o uno sintético desde `manualReintro`. Tests inline en `registerTests`, ejecutables con `node tools/run-tests.mjs`.

**Tech Stack:** HTML/CSS/JS vanilla (ES5, sin dependencias), PWA con Service Worker, arnés de tests Node (`vm` + shims de DOM).

---

## Referencia — Contrato de un alimento de `DATOS[]`

Cada objeto debe pasar `validarAlimento` (los tests lo verifican sobre todo `DATOS`). Campos:

- `nombre`: string **único** (la prueba "no hay nombres duplicados" lo verifica con `normalizar`).
- `sinonimos`: array de strings (puede ser `[]`).
- `categoria`: string presente en `CATEGORIAS`.
- `nivel`: `"verde"` | `"amarillo"` | `"rojo"`.
- `racion_segura`: string **no vacío**.
- `fodmap`: array con valores de `["Fructosa","Lactosa","Manitol","Sorbitol","GOS","Fructanos"]`.
- `alternativas`: array de strings (puede ser `[]`).
- `consejo`: string (puede ser `""`).
- `fuente`: string no vacío (trazabilidad).
- `motivo` (opcional): string; usar cuando un 🟡/🔴 se limita por **carga total** sin un FODMAP único.
- **Regla:** un 🟡/🔴 debe tener `fodmap` no vacío **o** `motivo`. Un 🟢 lleva `fodmap:[]`.

**Criterio de clasificación (igual que los 131 actuales, ver `FUENTES.md`):** híbrido prudente entre
Monash (público) y guías AEG/SEEN. Ante datos públicos escasos (alimentos exóticos), ser conservador:
antes 🟡/🔴 que un 🟢 dudoso. Citar fuente pública en cada uno (p. ej. `"Monash FODMAP"`,
`"Cleveland Clinic · Monash FODMAP"`, `"AEG/SEEN · Monash FODMAP"`).

**Dos ejemplos ya en el código (copiar este nivel de detalle):**

```js
{ nombre:"Brócoli", sinonimos:["brecol","bróculi"], categoria:"Verduras",
  nivel:"amarillo", racion_segura:"Cabezas/floretes hasta ~¾ taza. Los tallos son más altos en fructanos.",
  fodmap:["Fructanos"], alternativas:["Judía verde","Pak choi","Espinaca baby"],
  consejo:"Prioriza las cabezas sobre el tronco.", fuente:"Monash FODMAP" },

{ nombre:"Zanahoria", sinonimos:["zanahorias"], categoria:"Verduras",
  nivel:"verde", racion_segura:"Sin límite práctico en fase 1.",
  fodmap:[], alternativas:[], consejo:"", fuente:"Monash FODMAP" },
```

## Referencia — Procedimiento de un lote de categoría (Tareas A1–A13)

Cada tarea de categoría sigue estos pasos (cambian solo la categoría, la lista de nombres y el commit):

1. Añadir los objetos al array `DATOS[]` (cerca del bloque de su categoría, respetando el comentario
   `/* ---------- CATEGORÍA ---------- */`). Para categorías nuevas, crear su propio bloque.
2. Cada objeto cumple el **Contrato** de arriba y se clasifica con el **criterio prudente**.
3. **Saltar duplicados:** si un nombre ya existe en los 131 actuales, no añadirlo (la prueba de
   duplicados lo detecta; ante duda, buscar el nombre antes de añadir).
4. Ejecutar: `node tools/run-tests.mjs` → debe imprimir `... ✓ / 0 ✗` y salir 0.
5. Commit del lote.

---

## PART A — Ampliación del catálogo

### Task A0: Registrar las 3 categorías nuevas

**Files:**
- Modify: `index.html` (`CATEGORIAS`, líneas 182-184)
- Modify: `index.html` (`registerTests`, añadir assert)

- [ ] **Step 1: Write the failing test**

En `registerTests` (después del bloque "Integridad global de DATOS", ~línea 1835) añadir:

```js
// ---- Categorías nuevas (ampliación 2026) ----
assert(CATEGORIAS.indexOf("Aceites y grasas") !== -1, "existe categoría Aceites y grasas");
assert(CATEGORIAS.indexOf("Edulcorantes y endulzantes") !== -1, "existe categoría Edulcorantes y endulzantes");
assert(CATEGORIAS.indexOf("Hierbas y especias") !== -1, "existe categoría Hierbas y especias");
assert(CATEGORIAS.length === 13, "hay 13 categorías tras la ampliación");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/run-tests.mjs`
Expected: FAIL — `... ✗` (las categorías aún no existen).

- [ ] **Step 3: Write minimal implementation**

Sustituir el array `CATEGORIAS` (líneas 182-184) por:

```js
  var CATEGORIAS = ["Verduras","Frutas","Lácteos","Cereales y pan",
    "Proteínas","Legumbres","Frutos secos y semillas","Bebidas",
    "Condimentos y otros","Dulces y snacks",
    "Aceites y grasas","Edulcorantes y endulzantes","Hierbas y especias"];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/run-tests.mjs`
Expected: PASS — `... ✓ / 0 ✗`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(catalogo): registra 3 categorías nuevas (aceites, edulcorantes, hierbas)"
```

---

### Task A1: Lote Verduras (+~35)

**Files:** Modify `index.html` (`DATOS[]`, bloque `/* ---------- VERDURAS ---------- */`).

**Nombres a añadir** (saltar los que ya existan; clasificar cada uno por el Contrato):
Achicoria, Acelga roja, Tupinambo (alcachofa de Jerusalén), Berro, Grelos, Brotes de bambú,
Calabaza moscada (butternut), Canónigos, Cardo, Castaña de agua, Cebolleta (parte verde),
Cebollino, Chalota, Kale (col rizada), Col lombarda, Coles de Bruselas, Colinabo, Daikon,
Endivia, Escarola, Hinojo (bulbo), Jengibre fresco, Nabo, Okra, Pepinillo en vinagre,
Pimiento verde, Pimiento amarillo, Rábano, Rúcula, Brotes de soja, Taro, Tirabeques,
Tomate seco, Yuca (mandioca), Chirivía.

- [ ] **Step 1:** Añadir los objetos al bloque Verduras (Procedimiento de lote, pasos 1-3).
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit:

```bash
git add index.html
git commit -m "feat(catalogo): amplía Verduras"
```

---

### Task A2: Lote Frutas (+~28)

**Files:** Modify `index.html` (`DATOS[]`, bloque `/* ---------- FRUTAS ---------- */`).

**Nombres a añadir:** Albaricoque, Arándano azul, Arándano rojo, Caqui (persimón), Cereza, Ciruela,
Coco fresco, Dátil, Frambuesa, Maracuyá (fruta de la pasión), Granada, Grosella, Guayaba, Higo,
Lichi, Lima, Limón, Mango, Manzana, Melocotón, Melón galia, Mora, Nectarina, Papaya, Pera, Pomelo,
Sandía, Uva pasa, Ciruela pasa, Plátano macho.

- [ ] **Step 1:** Añadir los objetos al bloque Frutas (Procedimiento de lote).
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): amplía Frutas"`

---

### Task A3: Lote Lácteos (+~16)

**Files:** Modify `index.html` (bloque Lácteos).

**Nombres a añadir:** Leche de cabra, Leche de oveja, Leche evaporada, Leche condensada,
Nata/crema de leche, Crème fraîche, Queso azul, Queso de cabra, Queso manchego curado,
Queso parmesano, Requesón, Quark, Kéfir, Yogur griego, Yogur natural, Helado de leche,
Mantequilla, Suero de leche (buttermilk).

- [ ] **Step 1:** Añadir los objetos (Procedimiento de lote).
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): amplía Lácteos"`

---

### Task A4: Lote Cereales y pan (+~26)

**Files:** Modify `index.html` (bloque Cereales y pan).

**Nombres a añadir:** Pan de espelta (masa madre), Pan de centeno, Pan multicereal, Pan sin gluten,
Bagel, Cuscús, Bulgur, Sémola de trigo, Trigo sarraceno (alforfón), Mijo, Sorgo, Teff, Amaranto,
Polenta, Tortilla de maíz, Wrap de trigo, Cracker salado, Pasta de trigo, Pasta sin gluten,
Noodles de arroz, Fideos soba, Copos de maíz (cornflakes), Muesli, Salvado de trigo, Salvado de avena,
Cebada, Crackers de arroz, Tortitas de arroz.

- [ ] **Step 1:** Añadir los objetos (Procedimiento de lote).
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): amplía Cereales y pan"`

---

### Task A5: Lote Proteínas (+~20)

**Files:** Modify `index.html` (bloque Proteínas).

**Nombres a añadir:** Pollo, Pavo, Ternera, Cerdo, Cordero, Conejo, Jamón serrano, Jamón cocido,
Bacon, Chorizo, Salchicha fresca, Huevo, Clara de huevo, Atún en lata, Salmón, Merluza, Bacalao,
Sardina, Boquerón, Gambas, Mejillones, Calamar, Pulpo, Tofu firme, Tempeh, Quorn.

- [ ] **Step 1:** Añadir los objetos (Procedimiento de lote). Las carnes/pescados sin procesar son 🟢
  (sin FODMAP); cuidado con embutidos que llevan ajo/cebolla → 🟡/🔴 con `motivo` o `fodmap:["Fructanos"]`.
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): amplía Proteínas"`

---

### Task A6: Lote Legumbres (+~12)

**Files:** Modify `index.html` (bloque Legumbres).

**Nombres a añadir:** Garbanzos en conserva (enjuagados), Lentejas en conserva, Lentejas rojas,
Alubia blanca, Alubia roja (kidney), Alubia negra, Alubia pinta, Soja en grano, Habas, Guisantes secos,
Cacahuete, Frijol mungo.

- [ ] **Step 1:** Añadir los objetos (Procedimiento de lote). La mayoría 🔴/🟡 por GOS/Fructanos;
  conservas enjuagadas toleran ración pequeña (🟡).
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): amplía Legumbres"`

---

### Task A7: Lote Frutos secos y semillas (+~14)

**Files:** Modify `index.html` (bloque Frutos secos y semillas).

**Nombres a añadir:** Almendra, Nuez, Nuez de Brasil, Anacardo, Pistacho, Avellana, Piñón,
Nuez de macadamia, Nuez pecana, Castaña, Semillas de chía, Semillas de lino, Semillas de sésamo,
Semillas de calabaza, Semillas de girasol, Tahini, Crema de cacahuete, Crema de almendra.

- [ ] **Step 1:** Añadir los objetos (Procedimiento de lote). Anacardo y pistacho 🔴 (GOS/Fructanos);
  macadamia, nuez, piñón 🟢/🟡 en ración pequeña.
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): amplía Frutos secos y semillas"`

---

### Task A8: Lote Bebidas (+~24)

**Files:** Modify `index.html` (bloque Bebidas).

**Nombres a añadir:** Café solo, Té negro, Té verde, Infusión de manzanilla, Té de menta poleo,
Agua con gas, Tónica, Refresco de cola, Zumo de manzana, Zumo de pera, Zumo de uva, Zumo de arándano,
Bebida de soja (de habas de soja), Bebida de soja (de proteína de soja), Bebida de almendra,
Bebida de arroz, Bebida de avena, Bebida de coco, Vino tinto, Vino blanco, Cerveza, Sidra,
Kombucha, Horchata de chufa.

- [ ] **Step 1:** Añadir los objetos (Procedimiento de lote). Distinguir "bebida de soja de habas" (🔴 GOS)
  vs "de proteína de soja" (🟢): es un matiz Monash importante.
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): amplía Bebidas"`

---

### Task A9: Lote Condimentos y otros (+~16)

**Files:** Modify `index.html` (bloque Condimentos y otros).

**Nombres a añadir:** Vinagre de vino, Vinagre balsámico, Vinagre de manzana, Salsa de soja,
Salsa Worcestershire, Mostaza, Mayonesa, Sofrito de tomate, Caldo con cebolla y ajo, Levadura nutricional,
Levadura de panadería, Gelatina, Maicena (almidón de maíz), Cacao en polvo puro, Pasta de miso,
Pasta de curry, Pesto, Alcaparras.

- [ ] **Step 1:** Añadir los objetos (Procedimiento de lote). Caldos/sofritos comerciales suelen llevar
  ajo/cebolla → 🟡/🔴 con `fodmap:["Fructanos"]`.
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): amplía Condimentos y otros"`

---

### Task A10: Lote Dulces y snacks (+~20)

**Files:** Modify `index.html` (bloque Dulces y snacks).

**Nombres a añadir:** Galletas tipo María, Magdalena, Bizcocho, Croissant, Donut, Patatas fritas (chips),
Palomitas, Gominolas, Regaliz, Turrón, Polo de hielo, Barrita de cereales, Crema de cacao (tipo Nutella),
Chocolate negro 85%, Chocolate blanco, Cacao soluble azucarado, Flan, Natillas, Tarta de queso,
Chicle sin azúcar.

- [ ] **Step 1:** Añadir los objetos (Procedimiento de lote). "Sin azúcar" suele llevar polioles
  (sorbitol/maltitol) → 🔴 con `fodmap:["Sorbitol"]` o `motivo`.
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): amplía Dulces y snacks"`

---

### Task A11: Lote Aceites y grasas (categoría nueva, +~12)

**Files:** Modify `index.html` (crear bloque `/* ---------- ACEITES Y GRASAS ---------- */`).

**Nombres a añadir:** Aceite de oliva virgen extra, Aceite de girasol, Aceite de coco, Aceite de sésamo,
Aceite de aguacate, Aceite infusionado de ajo, Aceite infusionado de cebolla, Margarina,
Manteca de cerdo, Ghee (mantequilla clarificada), Sebo de ternera.

- [ ] **Step 1:** Añadir los objetos con `categoria:"Aceites y grasas"`. Aceites puros = 🟢 (los FODMAP
  no pasan al aceite, incluidos los infusionados de ajo/cebolla — punto clave para SII).
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): añade Aceites y grasas"`

---

### Task A12: Lote Edulcorantes y endulzantes (categoría nueva, +~16)

**Files:** Modify `index.html` (crear bloque `/* ---------- EDULCORANTES Y ENDULZANTES ---------- */`).

**Nombres a añadir:** Miel, Sirope de agave, Sirope de arce, Estevia, Sacarina, Sucralosa, Aspartamo,
Eritritol, Xilitol, Sorbitol (E-420), Maltitol, Isomalt, Glucosa (dextrosa), Sirope de maíz alto en fructosa,
Azúcar glas, Panela, Melaza, Sirope de arroz.

- [ ] **Step 1:** Añadir los objetos con `categoria:"Edulcorantes y endulzantes"`. Miel y agave 🔴 (Fructosa);
  polioles (xilitol/maltitol/sorbitol/isomalt) 🔴 (Sorbitol/Manitol); estevia/sucralosa/eritritol/glucosa 🟢.
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): añade Edulcorantes y endulzantes"`

---

### Task A13: Lote Hierbas y especias (categoría nueva, +~28)

**Files:** Modify `index.html` (crear bloque `/* ---------- HIERBAS Y ESPECIAS ---------- */`).

**Nombres a añadir:** Albahaca, Perejil, Cilantro, Orégano, Tomillo, Romero, Salvia, Laurel, Eneldo,
Menta, Hierbabuena, Estragón, Comino, Cúrcuma, Pimentón dulce, Pimentón picante, Curry en polvo, Canela,
Clavo, Nuez moscada, Jengibre en polvo, Cardamomo, Azafrán, Anís estrellado, Semilla de hinojo,
Mostaza en grano, Ajo en polvo, Cebolla en polvo, Guindilla (cayena), Vainilla en vaina.

- [ ] **Step 1:** Añadir los objetos con `categoria:"Hierbas y especias"`. Hierbas frescas/secas en pizcas
  = 🟢. **Ajo en polvo** y **cebolla en polvo** = 🔴 (Fructanos concentrados) — aviso importante.
- [ ] **Step 2:** Run: `node tools/run-tests.mjs` — Expected: `... ✓ / 0 ✗`, exit 0.
- [ ] **Step 3:** Commit: `git add index.html && git commit -m "feat(catalogo): añade Hierbas y especias"`

---

### Task A14: Documentación y Service Worker

**Files:**
- Modify: `ESTADO.md`
- Modify: `FUENTES.md`
- Modify: `sw.js`

- [ ] **Step 1: Contar el catálogo final**

Run: `node -e "const h=require('fs').readFileSync('index.html','utf8');const m=h.match(/var DATOS = \[([\s\S]*?)\n  \];/);console.log((m[1].match(/\bnombre:/g)||[]).length)"`
Expected: imprime el número total de alimentos (objetivo ~400). Anótalo como `<N>`.

- [ ] **Step 2: Actualizar ESTADO.md**

Cambiar la línea "Alimentos en el buscador: 131" por `<N>`, la de "Reintroducción: por alimento (los 131)"
por `<N>`, el nº de tests (tras Part A y B), y añadir una fila al historial:

```markdown
| 2026-06-08 | Catálogo ampliado a ~400 alimentos (+3 categorías: aceites, edulcorantes, hierbas) y reintroducción de alimentos no listados. SW v8 |
```

- [ ] **Step 3: Actualizar FUENTES.md**

Añadir bajo "Mantenimiento" un párrafo:

```markdown
## Ampliación 2026-06-08

Catálogo ampliado de 131 a ~400 alimentos. Los alimentos añadidos en esta ampliación se han curado
con el mismo **criterio híbrido prudente** a partir de **fuentes públicas** (Monash público, Cleveland
Clinic, Diet vs Disease, IBS Diets, UVA), citando la fuente en cada ficha. Los 131 originales (cruzados
con la guía clínica AEG/SEEN) no se han modificado. Se añaden las categorías "Aceites y grasas",
"Edulcorantes y endulzantes" y "Hierbas y especias".
```

- [ ] **Step 4: Subir el Service Worker a v8**

En `sw.js`, incrementar `VERSION` a `v8` (era `v7`).

- [ ] **Step 5: Commit**

```bash
git add ESTADO.md FUENTES.md sw.js
git commit -m "docs: estado/fuentes del catálogo ampliado + SW v8"
```

---

## PART B — Reintroducir un alimento no listado

### Task B1: Modelo de datos + resolvedor `alimentoReintro`

**Files:**
- Modify: `index.html` (`migrarFase2` ~1038; helpers Fase 2 ~1102; tests ~1889)

- [ ] **Step 1: Write the failing tests**

En `registerTests`, tras el bloque de migración de Fase 2 (~línea 1889), añadir:

```js
// ---- FASE 2: alimentos no listados (manualReintro) ----
almacen._mem = null; store_clear_helper();
// migración inicializa manualReintro
var dmr = almacen.cargar();
assert(dmr.manualReintro && typeof dmr.manualReintro === "object", "cargar da manualReintro {}");
// alta de un no-listado y resolvedor
setManualReintro("Yaca", ["Fructanos"], "fruta tropical");
var res = alimentoReintro("Yaca");
assert(res && res.nombre === "Yaca" && res.manual === true, "alimentoReintro resuelve un no-listado");
assert(res.fodmap.join(",") === "Fructanos" && res.nivel === null, "no-listado: fodmap del grupo y nivel null");
assert(agendaDeAlimento(res) === "alterna", "Fructanos -> agenda alterna en no-listado");
// un listado se resuelve desde DATOS
var res2 = alimentoReintro("Cebolla");
assert(res2 && !res2.manual && res2.nivel === "rojo", "alimentoReintro resuelve un listado desde DATOS");
// 'no lo sé' -> sin grupo, agenda seguida
setManualReintro("Rambután", [], "");
var res3 = alimentoReintro("Rambután");
assert(res3.fodmap.length === 0 && agendaDeAlimento(res3) === "seguida", "no lo sé -> sin grupo, seguida");
// lista y borrado
assert(manualReintroLista().length === 2, "manualReintroLista devuelve 2");
borrarManualReintro("Rambután");
assert(manualReintroLista().length === 1, "borrarManualReintro quita uno");
almacen._mem = null; store_clear_helper();
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tools/run-tests.mjs`
Expected: FAIL — `setManualReintro`/`alimentoReintro` no definidos.

- [ ] **Step 3: Implementación mínima**

(a) En `migrarFase2`, garantizar el campo. Sustituir las dos salidas que devuelven la estructura v2
para que incluyan `manualReintro`. La función queda:

```js
  function migrarFase2(p) {
    if (!p || typeof p !== "object") return { version: 2, pruebas: {}, manualReintro: {} };
    if (p.version === 2 && p.pruebas) { if (!p.manualReintro) p.manualReintro = {}; return p; }
    var out = { version: 2, pruebas: {}, manualReintro: {} };
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
        alimento: r.alimentoElegido, agenda: r.agenda || "seguida",
        dias: dias, conclusion: { estado: "sin", dosisIndex: null }
      };
    });
    return out;
  }
```

También en `almacen.cargar`, cambiar el `base` por defecto a `{ version: 2, pruebas: {}, manualReintro: {} }`.

(b) Tras `reiniciarPrueba` (~línea 1173) añadir los helpers y el resolvedor:

```js
  function manualReintroLista() {
    var m = almacen.cargar().manualReintro || {};
    return Object.keys(m).map(function (k) { return { nombre: k, fodmap: m[k].fodmap || [], nota: m[k].nota || "" }; });
  }
  function setManualReintro(nombre, fodmap, nota) {
    var d = almacen.cargar();
    if (!d.manualReintro) d.manualReintro = {};
    d.manualReintro[nombre] = { fodmap: Array.isArray(fodmap) ? fodmap.slice() : [], nota: nota || "" };
    almacen.guardar(d);
  }
  function borrarManualReintro(nombre) {
    var d = almacen.cargar(); if (d.manualReintro && d.manualReintro[nombre]) { delete d.manualReintro[nombre]; almacen.guardar(d); }
  }
  // Resolvedor: alimento de DATOS, o sintético desde manualReintro.
  function alimentoReintro(nombre) {
    var a = DATOS.filter(function (x) { return x.nombre === nombre; })[0];
    if (a) return a;
    var m = (almacen.cargar().manualReintro || {})[nombre];
    if (!m) return null;
    return { nombre: nombre, fodmap: (m.fodmap || []).slice(), categoria: "No listado", nivel: null, manual: true };
  }
  // Alimentos no-listados como objetos (para mezclarlos en la lista de reintro).
  function manualReintroComoAlimentos() {
    return manualReintroLista().map(function (m) { return alimentoReintro(m.nombre); });
  }
  function listaReintro() { return DATOS.concat(manualReintroComoAlimentos()); }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tools/run-tests.mjs`
Expected: PASS — `... ✓ / 0 ✗`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(reintro): modelo manualReintro + resolvedor alimentoReintro"
```

---

### Task B2: La lista de Reintroducción incluye los no-listados

**Files:** Modify `index.html` (`renderFase2` ~1338; `bloqueDosisHTML`/cards; tests).

- [ ] **Step 1: Write the failing test**

En `registerTests`, tras los tests de B1, añadir:

```js
// ---- FASE 2: la lista de reintro incluye no-listados ----
almacen._mem = null; store_clear_helper();
var nBase = DATOS.length;
setManualReintro("Yaca", ["Fructanos"], "");
assert(listaReintro().length === nBase + 1, "listaReintro = DATOS + no-listados");
assert(listaReintro().filter(function (a){return a.nombre==="Yaca";}).length === 1, "Yaca está en listaReintro");
almacen._mem = null; store_clear_helper();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/run-tests.mjs`
Expected: PASS de hecho ya (listaReintro existe de B1). Si pasa, este test es de regresión; continuar.
Si por orden de tareas `listaReintro` no existiera, FAIL con "listaReintro no definido".

- [ ] **Step 3: Implementación**

En `renderFase2`, cambiar la base de la lista de `ordenarParaReintro(DATOS)` a `ordenarParaReintro(listaReintro())`
(línea 1338). En el `map` de cards (~1350-1360), tolerar `nivel === null` usando un marcador neutro:

```js
    var cards = resultados.map(function (a) {
      var est = estadoPrueba(a.nombre);
      var etiqueta = est === "hecho" ? "Completado" : est === "encurso" ? "En curso" : "";
      var cls = est === "hecho" ? "hecho" : est === "encurso" ? "encurso" : "";
      var grupos = gruposDeAlimento(a);
      var badge = a.manual ? (grupos.length ? grupos.join(" · ") : "Otros") + " · a mano"
                           : (grupos.length ? grupos.join(" · ") : "ya seguro 🟢");
      var icono = a.manual ? "➕" : emojiNivel(a.nivel);
      return '<button class="reto-card" data-alim="' + escapeHTML(a.nombre) + '">' +
        '<div class="reto-info"><span class="reto-grupo">' + icono + ' ' + escapeHTML(a.nombre) + '</span>' +
        '<span class="reto-sub">' + escapeHTML(badge) + '</span></div>' +
        (etiqueta ? '<span class="estado ' + cls + '">' + etiqueta + '</span>' : '') + '</button>';
    }).join("");
```

(Comprobar que `ordenarParaReintro` no asume `nivel` no nulo; si lo usa, tratar `null` como el de menor
prioridad para que los no-listados queden con los reintroducibles, no con los verdes.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/run-tests.mjs`
Expected: PASS — `... ✓ / 0 ✗`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(reintro): la lista incluye los no-listados con marcador a mano"
```

---

### Task B3: La pantalla del reto resuelve no-listados

**Files:** Modify `index.html` (`renderAlimentoReto` ~1424; cabecera; tests).

- [ ] **Step 1: Write the failing test**

```js
// ---- FASE 2: iniciar reto de un no-listado funciona igual ----
almacen._mem = null; store_clear_helper();
setManualReintro("Yaca", ["Fructanos"], "");
iniciarPrueba("Yaca", "2026-06-01", agendaDeAlimento(alimentoReintro("Yaca")), 3);
var py = pruebaDe("Yaca");
assert(py && py.dias.length === 3, "se inicia el reto del no-listado con 3 dosis");
assert(py.dias[0].fecha === "2026-06-01" && py.dias[1].fecha === "2026-06-03", "agenda alterna aplicada al no-listado");
assert(estadoPrueba("Yaca") === "encurso", "el no-listado pasa a en curso");
almacen._mem = null; store_clear_helper();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/run-tests.mjs`
Expected: PASS si B1 ya expone `alimentoReintro`/`iniciarPrueba` (es un test de integración). Si la cabecera
del reto aún hace `DATOS.filter` y se usara en el camino testado, no afecta a este test puro. Continuar.

- [ ] **Step 3: Implementación**

En `renderAlimentoReto` (línea 1424), sustituir:

```js
    var a = DATOS.filter(function (x) { return x.nombre === nombre; })[0];
    if (!a) { estadoFase2.alimentoAbierto = null; renderFase2(); return; }
```

por:

```js
    var a = alimentoReintro(nombre);
    if (!a) { estadoFase2.alimentoAbierto = null; renderFase2(); return; }
```

En la cabecera del reto, donde se pinta el nombre/semáforo, usar marcador neutro si `a.manual`
(p. ej. anteponer "➕ a mano · " al grupo en `avisoGrupo` y no llamar a `emojiNivel(null)`).
Revisar `renderAlimentoReto` para que no asuma `a.nivel`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/run-tests.mjs`
Expected: PASS — `... ✓ / 0 ✗`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(reintro): el reto resuelve no-listados (alimentoReintro)"
```

---

### Task B4: Resumen para la dietista agrupa los no-listados

**Files:** Modify `index.html` (`resumenPorGrupo` ~1245; tests).

- [ ] **Step 1: Write the failing test**

```js
// ---- FASE 2: resumen agrupa no-listados por su grupo / Otros ----
almacen._mem = null; store_clear_helper();
setManualReintro("Yaca", ["Fructanos"], "");
iniciarPrueba("Yaca", "2026-06-01", "alterna", 3);
setManualReintro("Rambután", [], "");
iniciarPrueba("Rambután", "2026-06-01", "seguida", 3);
var rg = resumenPorGrupo(DATOS);
assert(rg["Fructanos"].some(function(f){return f.alimento==="Yaca";}), "Yaca cae en Fructanos");
assert(rg["Otros"].some(function(f){return f.alimento==="Rambután";}), "sin grupo cae en Otros");
almacen._mem = null; store_clear_helper();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/run-tests.mjs`
Expected: FAIL — hoy `resumenPorGrupo` hace `datos.filter(...)` sobre `DATOS` y un no-listado no aparece,
luego `grupos = []` → "Otros". "Yaca" caería en "Otros" en vez de "Fructanos" → la primera aserción falla.

- [ ] **Step 3: Implementación**

En `resumenPorGrupo` (línea 1251), cambiar:

```js
      var al = datos.filter(function (x) { return x.nombre === nombre; })[0];
      var grupos = al ? gruposDeAlimento(al) : [];
```

por:

```js
      var al = alimentoReintro(nombre);
      var grupos = al ? gruposDeAlimento(al) : [];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/run-tests.mjs`
Expected: PASS — `... ✓ / 0 ✗`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(reintro): el resumen agrupa los no-listados por su grupo FODMAP"
```

---

### Task B5: Personalización (Parte 1) muestra el grupo de los no-listados

**Files:** Modify `index.html` (`renderFase3` Parte 1 ~1582; tests).

- [ ] **Step 1: Write the failing test**

```js
// ---- FASE 3: un no-listado concluido llega a la tolerancia con su grupo ----
almacen._mem = null; store_clear_helper(); almacenF3._mem = null;
try { localStorage.removeItem("sii_fodmap_fase3_v1"); } catch(e){}
setManualReintro("Yaca", ["Fructanos"], "");
iniciarPrueba("Yaca", "2026-06-01", "alterna", 3);
setConclusion("Yaca", "tolera", null);
assert(mapaToleranciaPorAlimento()["Yaca"] === "tolera", "el no-listado concluido entra en el mapa de tolerancia");
almacen._mem = null; store_clear_helper();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/run-tests.mjs`
Expected: PASS de hecho — `mapaToleranciaPorAlimento` lee `almacen.pruebas` por nombre, así que ya funciona.
Es un test de regresión que blinda el flujo. Continuar al Step 3 (mejora visual).

- [ ] **Step 3: Implementación**

En `renderFase3`, Parte 1 (línea 1582), cambiar:

```js
      var al = DATOS.filter(function (x) { return x.nombre === n; })[0];
      var grupos = al ? gruposDeAlimento(al) : [];
```

por:

```js
      var al = alimentoReintro(n);
      var grupos = al ? gruposDeAlimento(al) : [];
```

Así un no-listado concluido muestra su grupo correcto (no "sin grupo").

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/run-tests.mjs`
Expected: PASS — `... ✓ / 0 ✗`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(reintro): Personalización muestra el grupo de los no-listados concluidos"
```

---

### Task B6: Botón + formulario "Reintroducir un alimento no listado"

**Files:** Modify `index.html` (`estadoFase2` ~1278; `pintarRuta` ~978; `renderFase2` botones ~1372; nueva `renderReintroNuevo`; tests).

- [ ] **Step 1: Write the failing test (validación pura del alta)**

Extraer la validación a una función pura testeable. En `registerTests`:

```js
// ---- FASE 2: validación del alta de no-listado ----
almacen._mem = null; store_clear_helper();
assert(validarNuevoReintro("", DATOS).ok === false, "nombre vacío no es válido");
assert(validarNuevoReintro("Cebolla", DATOS).ok === false, "nombre ya en DATOS no es válido");
setManualReintro("Yaca", ["Fructanos"], "");
assert(validarNuevoReintro("Yaca", DATOS).ok === false, "nombre ya añadido no es válido");
assert(validarNuevoReintro("Durián", DATOS).ok === true, "nombre nuevo es válido");
almacen._mem = null; store_clear_helper();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/run-tests.mjs`
Expected: FAIL — `validarNuevoReintro` no definida.

- [ ] **Step 3: Implementación**

(a) Función pura (junto a los helpers de B1):

```js
  function validarNuevoReintro(nombre, datos) {
    var n = (nombre || "").trim();
    if (!n) return { ok: false, motivo: "Escribe un nombre." };
    var norm = normalizar(n);
    if (datos.some(function (a) { return normalizar(a.nombre) === norm; }))
      return { ok: false, motivo: "Ese alimento ya está en la lista; búscalo arriba." };
    if (manualReintroLista().some(function (m) { return normalizar(m.nombre) === norm; }))
      return { ok: false, motivo: "Ya lo has añadido a mano." };
    return { ok: true, motivo: "" };
  }
```

(b) Estado y ruta. En `estadoFase2` añadir `nuevo: false`. En `pintarRuta`, dentro del `if (r.tab === "fase2")`,
añadir: `estadoFase2.nuevo = (r.sub === "nuevo");`

(c) En `renderFase2`, al principio (tras la comprobación de `resumen`/`alimentoAbierto`):
`if (estadoFase2.nuevo) { renderReintroNuevo(); return; }`

(d) Botón en la `btn-row` de `renderFase2` (junto a "Ver resumen"):
`'<button class="btn sec" data-accion="nuevo-reintro">➕ Reintroducir un alimento no listado</button>'`
y su wiring: al click, `irA({ tab:"fase2", sub:"nuevo" })`.

(e) Nueva vista `renderReintroNuevo`:

```js
  function renderReintroNuevo() {
    var v = document.getElementById("vista");
    if (!v) return;
    var grupos = ["Fructosa","Lactosa","Sorbitol","Manitol","Fructanos","GOS"];
    var opcs = '<option value="">No lo sé</option>' + grupos.map(function (g) {
      return '<option value="' + g + '">' + g + '</option>';
    }).join("");
    v.innerHTML =
      '<button class="volver" data-volver-f2="1">‹ Volver</button>' +
      '<header><h1>➕ Alimento no listado</h1>' +
      '<p class="aviso">Para un alimento que no está en la lista. Indica su grupo FODMAP si lo conoces; ' +
      'define la agenda y el resumen para tu dietista. Luego se reintroduce igual que cualquier otro.</p></header>' +
      '<label>Nombre del alimento<input type="text" class="alim" id="nrNombre" placeholder="ej. Durián" autocomplete="off"></label>' +
      '<label>Grupo FODMAP<select class="alim" id="nrGrupo">' + opcs + '</select></label>' +
      '<label>Nota (opcional)<input type="text" class="alim" id="nrNota" autocomplete="off"></label>' +
      '<p class="err" id="nrErr" hidden></p>' +
      '<div class="btn-row"><button class="btn" data-nr-guardar="1">Empezar reintroducción</button>' +
      '<button class="btn sec" data-volver-f2="1">Cancelar</button></div>';
    var g = v.querySelector("[data-nr-guardar]");
    if (g) g.addEventListener("click", function () {
      var nombre = document.getElementById("nrNombre").value.trim();
      var val = validarNuevoReintro(nombre, DATOS);
      if (!val.ok) { var e = document.getElementById("nrErr"); e.textContent = val.motivo; e.hidden = false; return; }
      var grupo = document.getElementById("nrGrupo").value;
      var nota = document.getElementById("nrNota").value || "";
      setManualReintro(nombre, grupo ? [grupo] : [], nota);
      irA({ tab: "fase2", sub: "alimento", alim: nombre }); // mismo flujo de reto que un listado
    });
    Array.prototype.forEach.call(v.querySelectorAll("[data-volver-f2]"), function (b) {
      b.addEventListener("click", function () { history.back(); });
    });
  }
```

(f) En `wireAcciones`, mapear `data-accion="nuevo-reintro"` → `irA({ tab:"fase2", sub:"nuevo" })`
(o añadir el listener directo en `renderFase2`). Revisar cómo `wireAcciones` despacha `data-accion`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/run-tests.mjs`
Expected: PASS — `... ✓ / 0 ✗`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(reintro): botón + formulario para reintroducir un alimento no listado"
```

---

### Task B7: Verificación final completa

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Ejecutar toda la batería**

Run: `node tools/run-tests.mjs`
Expected: `Tests: <N> ✓ / 0 ✗`, exit 0.

- [ ] **Step 2: Smoke manual en el navegador**

Abrir `index.html` y comprobar a mano:
- Reintroducción → "➕ Reintroducir un alimento no listado" → crear "Durián" con grupo Fructanos →
  aparece la pantalla del reto idéntica → "Empezar registro" → fechas alternas → registrar una dosis →
  poner conclusión "Tolero".
- Volver a la lista: "Durián" sale con "➕" y badge "Fructanos · a mano", estado "Completado".
- Personalización → Parte 1 muestra "Durián — Fructanos — Tolero".
- Resumen → "Durián" bajo Fructanos.
- Repetir con grupo "No lo sé" → agenda seguida, aparece en "Otros".
- Buscador: "Durián" **no** aparece (correcto).

- [ ] **Step 3: Commit (si el smoke obliga a algún ajuste menor)**

```bash
git add index.html
git commit -m "fix(reintro): ajustes tras smoke manual del alimento no listado"
```

---

## Self-Review (rellenada al escribir el plan)

**Spec coverage:**
- Sección 1 (catálogo ~400, criterio prudente, fuente) → Tasks A0–A14. ✔
- 3 categorías nuevas → Task A0 + A11/A12/A13. ✔
- ESTADO/FUENTES/SW v8 → Task A14. ✔
- Sección 2 (botón + formulario, grupo FODMAP con "no lo sé", flujo idéntico) → Tasks B1, B3, B6. ✔
- Marcador neutro para `nivel:null` → Tasks B2, B3. ✔
- Sección 3 (campo `manualReintro`, migración, resolvedor, consumidores, export/import) → B1, B2, B3, B4, B5. ✔
- Sección 4 (tests + `node tools/run-tests.mjs`) → asserts en B1–B6, verificación en B7. ✔
- Fuera de alcance respetado (no NotebookLM, no ficha en Buscador). ✔

**Placeholder scan:** sin "TBD/TODO". Las tareas A1–A13 listan nombres concretos + criterio; el dato por
alimento se cura en ejecución con el contrato y las pruebas de validación como red de seguridad (estructura
correcta por construcción dada la naturaleza de un dataset de ~270 ítems).

**Type/nombre consistency:** `manualReintro`, `setManualReintro`, `borrarManualReintro`, `manualReintroLista`,
`manualReintroComoAlimentos`, `listaReintro`, `alimentoReintro`, `validarNuevoReintro`, ruta `sub:"nuevo"`,
`estadoFase2.nuevo`, `renderReintroNuevo` — usados de forma consistente en todas las tareas.
