# Diseño — Catálogo ampliado (~400) + reintroducir un alimento no listado

Fecha: **2026-06-08**. Estado: aprobado, pendiente de plan de implementación.

## Contexto y motivo

Un alimento que la pareja del usuario quería reintroducir **no estaba en la lista**, así que no
pudo iniciar el registro. De ahí dos necesidades:

1. **Ampliar el catálogo** de 131 a **~400 alimentos** (estilo exhaustivo Monash), curados con el
   mismo criterio híbrido prudente y con su `fuente` citada.
2. Añadir en **Reintroducción** una vía para **reintroducir un alimento no listado**, por si aun
   tras la ampliación hay algo muy exótico que no esté. El patrón de referencia es el "añadir a mano"
   de Personalización (Fase 3).

Todas las pestañas (Buscador, Reintroducción, picker de Personalización) leen de `DATOS[]`, así que
los alimentos nuevos aparecen automáticamente en las tres.

## Decisiones tomadas (brainstorming)

- **Alcance:** catálogo exhaustivo, objetivo **~400** alimentos (≈ +270 nuevos).
- **Verificación:** curado de **fuentes públicas** (Monash público, Cleveland, Diet vs Disease,
  IBS Diets, UVA) + **criterio prudente**. Cada alimento cita su fuente. Los **131 actuales no se
  tocan** (ya verificados contra la guía clínica AEG/SEEN). No se cruzan los nuevos con la guía
  privada ni se marcan como "sin verificar".
- **Reintro no listada:** se pide el **grupo FODMAP** (los 6 + "no lo sé"). El grupo define la agenda
  (alterna para Fructanos/GOS, seguida el resto) y agrupa el alimento en el resumen para la dietista.
  "No lo sé" → grupo *Otros*, agenda *seguida*.
- **UI de reintro no listada:** **botón + formulario corto** (no un buscador redundante: los listados
  ya están en la lista de reintro). Tras añadirlo, la interacción del reto es **idéntica** a la de
  cualquier alimento listado.
- **Categorías:** se añaden **3 categorías nuevas** — "Aceites y grasas", "Edulcorantes y
  endulzantes", "Hierbas y especias" — para que navegar ~400 alimentos sea cómodo.

## Contrato de datos de un alimento (sin cambios)

Cada objeto de `DATOS[]` debe pasar `validarAlimento`:

- `nombre`: string único.
- `sinonimos`: array (puede estar vacío).
- `categoria`: string, debe estar en `CATEGORIAS`.
- `nivel`: `"verde"` | `"amarillo"` | `"rojo"`.
- `racion_segura`: string no vacío.
- `fodmap`: array de valores de `FODMAPS_VALIDOS` (`Fructosa, Lactosa, Manitol, Sorbitol, GOS, Fructanos`).
- `alternativas`: array.
- `consejo`: string (puede ser vacío).
- `fuente`: truthy (trazabilidad).
- `motivo` (opcional): cuando un 🟡/🔴 se limita por **carga total** sin un FODMAP único responsable.
- Regla: un 🟡/🔴 debe tener **o** `fodmap` no vacío **o** `motivo`.

## Sección 1 — Ampliación del catálogo (Punto 1)

- Añadir objetos a `DATOS[]` por **lotes de categoría** hasta ~400, sin tocar los 131 existentes.
- Criterio híbrido prudente; ante datos públicos escasos (alimentos exóticos), ser conservador
  (antes 🟡/🔴 que un 🟢 dudoso). `fuente` pública en cada uno.
- Registrar las 3 categorías nuevas en `CATEGORIAS` (`index.html`). Los chips de filtro del Buscador
  y del picker se generan a partir de ese array, así que aparecen solas.
- Cierre documental: actualizar `ESTADO.md` (nº de alimentos, hito) y `FUENTES.md` (nota de la
  ampliación 2026 + fuentes). Subir el Service Worker a **v8** (`sw.js`) para disparar el banner.

## Sección 2 — Reintroducir un alimento no listado (Punto 2)

- En la lista de Reintroducción (`renderFase2`), botón **"➕ Reintroducir un alimento no listado"**,
  consistente con el estilo de la app (junto a "Ver resumen / Exportar / Importar").
- Abre un **formulario corto**: `nombre` + selector de **grupo FODMAP** (Fructosa, Lactosa, Sorbitol,
  Manitol, Fructanos, GOS, "no lo sé") + **nota opcional**. Validación: nombre no vacío y que no
  coincida con un alimento ya existente en `DATOS` ni con otro no-listado ya añadido.
- Al guardar, el alimento se registra en `manualReintro` y entra en la **lista de reintroducción**
  como uno más, marcado discretamente "añadido a mano", en estado *sin iniciar*.
- A partir de ahí, **misma pantalla y mismo flujo** que un listado: "Empezar registro" (fecha de
  inicio + dosis ≥3, agenda derivada del grupo), diario 0-10 (dolor/hinchazón/gases), fecha por dosis
  editable, "➕ Añadir dosis", y conclusión (Sin concluir / Tolero / Tolero con límite / No tolero).
- Un no-listado **no tiene `nivel`** (no está clasificado): en la tarjeta de la lista de reintro y en
  la cabecera del reto se muestra un **marcador neutro** (p. ej. "➕ a mano") en lugar del semáforo
  🟢🟡🔴, y el subtítulo es el grupo FODMAP elegido (o "Otros"). El resto de la pantalla es idéntico.
- Al concluir, fluye **automáticamente** a Personalización → Parte 1 ("de tus reintroducciones"),
  igual que los listados (esa parte ya lee `almacen.pruebas`). **No** aparece en el Buscador (no tiene
  ficha clínica), que es lo correcto.

## Sección 3 — Datos y persistencia

- Nuevo campo en el almacén de Fase 2 (`sii_fodmap_fase2_v1`):
  `manualReintro: { "<nombre>": { fodmap: ["<grupo>"]|[], nota: "" } }`.
  `migrarFase2` lo inicializa a `{}` si falta (compatibilidad total con copias antiguas; sin subir la
  versión del modelo).
- **Resolvedor** `alimentoReintro(nombre)`: devuelve el objeto de `DATOS` si existe; si no, sintetiza
  un alimento mínimo `{ nombre, fodmap: manualReintro[nombre].fodmap, categoria: "No listado",
  nivel: null, manual: true }`. El objeto sintético **no** pasa por `validarAlimento` (no se mete en
  `DATOS`); `nivel: null` señala "sin semáforo" para que la UI muestre el marcador neutro.
  Consumidores que pasan a usarlo:
  - `renderFase2` (la lista incluye `DATOS` + los no-listados).
  - `renderAlimentoReto` (hoy hace `DATOS.filter`; pasará por el resolvedor para no salirse).
  - `resumenPorGrupo` (agrupa por grupo; "no lo sé" → "Otros").
  - Parte 1 de `renderFase3` (para mostrar el grupo correcto del no-listado concluido).
- `gruposDeAlimento` / `agendaDeAlimento` no cambian: operan sobre `.fodmap` del objeto resuelto.
- La **copia de seguridad unificada** (`exportarTodo`/`importarTodo`) ya serializa todo el almacén de
  Fase 2, así que `manualReintro` entra en export/import sin cambios adicionales.

## Sección 4 — Tests y verificación

- Las validaciones existentes cubren el catálogo nuevo: `validarAlimento` (formato), sin nombres
  duplicados, categorías válidas. Son la red de seguridad de la ampliación.
- Asserts nuevos:
  - `alimentoReintro` resuelve un listado y un no-listado.
  - Agenda derivada del grupo manual (p. ej. Fructanos → "alterna"; "no lo sé"/Otros → "seguida").
  - Un no-listado iniciado aparece en la lista de reintro y, al concluir, en
    `mapaToleranciaPorAlimento` (llega a Fase 3).
  - `migrarFase2` produce `manualReintro: {}` desde una copia antigua que no lo tenía.
- Verificación final: `node tools/run-tests.mjs` en verde (exit 0) antes de dar nada por bueno.

## Fuera de alcance (YAGNI)

- No se cruza el catálogo nuevo con la guía clínica privada (AEG/SEEN) ni se usa NotebookLM.
- No se añade ficha clínica completa a los no-listados (no van al Buscador).
- No se reproducen los gramos de corte exactos propietarios de Monash (se mantiene la ración
  orientativa, como hasta ahora).

## Riesgos

- **Volumen/calidad:** ~270 alimentos nuevos es la mayor parte del esfuerzo; los exóticos con datos
  públicos escasos se clasifican de forma conservadora. Mitigación: validaciones automáticas + criterio
  prudente.
- **Categorías nuevas:** bajo riesgo; solo hay que registrar las 3 en `CATEGORIAS` y revisar que los
  chips de filtro siguen cabiendo en móvil.
