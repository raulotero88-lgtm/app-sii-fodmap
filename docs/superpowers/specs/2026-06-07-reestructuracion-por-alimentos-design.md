# Diseño: Reestructuración por alimentos (app SII/FODMAP)

**Fecha:** 2026-06-07
**Estado:** Pendiente de revisión del usuario
**Amplía / modifica:** `2026-05-31-fase2-reintroduccion-design.md` (Reintroducción) y
`2026-06-04-fase3-personalizacion-design.md` (Personalización), ya implementados en `index.html`.

## 1. Propósito

Mejorar la utilidad real de la app para personas con SII a partir del uso con una paciente.
Tres cambios estructurales en un único plan:

1. **Reintroducción organizada por alimentos** (no por grupos): un índice de todos los
   alimentos, con los grupos FODMAP como filtros, igual que el Buscador. Así, cuando la
   dietista indica reintroducir "tal alimento" sin decir su grupo, la persona lo encuentra,
   ve a qué grupo pertenece y registra el reto, con toda la información a mano.
2. **Personalización (Fase 3) nueva**: una vista de tolerancia **por alimento**, con dos
   partes — la derivada de las conclusiones de la reintroducción, y otra manual para añadir
   alimentos que no se probaron de forma estructurada.
3. **Botón "atrás" del dispositivo**: que no cierre la app, sino que navegue dentro de ella
   a la pantalla/pestaña anterior, con doble pulsación para salir desde la pantalla inicial.

Se mantiene el principio de la app: **registra y refleja lo que la persona decide; no diagnostica.**
Y las restricciones técnicas: **un único archivo `index.html` offline, sin dependencias externas,
mobile-first, español de España, con auto-tests integrados.**

**Fuera de alcance (siguiente paso, no en este plan):** empaquetado y publicación en Google
Play y la arquitectura que eso requiera. Este plan se centra en resolver el problema de uso.

## 2. Decisiones tomadas (brainstorming 2026-06-07)

| Tema | Decisión |
|------|----------|
| Qué alimentos en Reintroducción | **Los 131 del Buscador** (incluidos los verdes) |
| Filtros | **Grupos FODMAP** (Fructosa, Lactosa, Sorbitol, Manitol, Fructanos, GOS) + "Todos" + búsqueda de texto |
| Orden de la lista | **Reintroducibles primero** (🔴🟡), verdes 🟢 al final |
| Info al abrir un alimento | **Toda la ficha del Buscador**, **sin** dosis recomendadas |
| Dosis del reto | **3 por defecto**, con botón **"➕ Añadir dosis"** (4ª, 5ª…). Cantidad la escribe la persona |
| Guardado | **Automático total** (sin botón "Guardar"); aviso sutil "guardado ✓"; debounce al escribir notas |
| Alimentos verdes | Muestran ficha + nota suave; **permiten registrar reto igualmente** |
| Conclusión de tolerancia | **La marca la persona al final del reto**: Tolero / Tolero con límite (cantidad) / No tolero / Sin concluir |
| Almacenamiento Fase 2 | Pasa de **por grupo** a **por alimento**; migración automática de datos antiguos |
| Fase 3 | **Por alimento**, en 2 partes: derivada (de la reintroducción) + manual |
| Recolor del Buscador | **Por alimento** según las conclusiones (antes era por grupo) |
| Migración Fase 3 antigua | **Conservar en la copia, empezar limpio** (no auto-convertir los veredictos por grupo) |
| Botón atrás | **History API**: navega dentro de la app; en la raíz, **"pulsa otra vez para salir"** |
| Formato técnico | Sigue siendo **un único HTML offline**, sin dependencias |

## 3. Cambio 1 — Reintroducción por alimentos

### 3.1 Modelo de datos

- La lista de alimentos sale de **`DATOS`** (los 131), no de `RETOS`.
- El **grupo/s FODMAP** de cada alimento se deriva de su campo `fodmap[]` (ya existe).
  - Verdes: `fodmap:[]` → sin grupo (solo aparecen bajo "Todos").
  - Multi-FODMAP (p. ej. Espárrago `["Fructanos","Fructosa"]`): aparecen bajo **cada** filtro.
- `RETOS` **se jubila como fuente de alimentos**. De él se conserva solo una **mini-tabla
  por grupo FODMAP** con metadatos educativos:
  - `agenda`: `"seguida"` (días 1-2-3) o `"alterna"` (días 1-3-5) — alterna para Fructanos y GOS.
  - `nota`: texto educativo del grupo (p. ej. "el trigo y la verdura se toleran distinto").
- **Se jubilan** las dosis recomendadas y el "alimento sugerido" por grupo.

### 3.2 Vista principal (lista)

Estructura "tipo Buscador":
- Cabecera con aviso (registra, no diagnostica) y resumen del protocolo.
- **Búsqueda por texto** (tolerante a tildes/mayúsculas y sinónimos; reutiliza `normalizar`/`buscar`).
- **Chips de filtro** por grupo FODMAP + "Todos".
- **Lista** ordenada: primero los que llevan FODMAP (🔴🟡), luego los verdes 🟢. Cada tarjeta:
  nombre + etiqueta de grupo/s + estado del reto (Sin empezar / En curso / Completado) + conclusión si la hay.

### 3.3 Detalle de un alimento

Al tocar un alimento se muestra:

1. **Ficha completa del Buscador** (reutiliza `fichaHTML` o equivalente): semáforo, ración
   orientativa, motivo del límite / FODMAP responsable, alternativas, consejo, fuente.
   **Sin** dosis recomendadas.
2. **Bloque de reintroducción**:
   - Grupo/s FODMAP y **agenda** (seguida/alterna) según su grupo. Si lleva varios FODMAP,
     la agenda es **alterna** si alguno es Fructanos/GOS; y se muestra el aviso:
     "este alimento tiene varios FODMAP; una reacción puede deberse a cualquiera de ellos".
   - Si es verde: nota "ya es seguro 🟢, normalmente no necesita reintroducción", pero se
     permite el reto igualmente.
   - **Empezar registro**: se elige la **fecha de la primera dosis**; las siguientes se
     sugieren según la agenda (editables).
   - **Diario de dosis** (≥3): cada dosis tiene **cantidad** (texto que escribe la persona),
     **fecha**, tres deslizadores 0-10 (dolor, hinchazón, gases) y **notas**. Botón
     **"➕ Añadir dosis"** para añadir más. Botón para **reiniciar** ese alimento.
   - **Guardado automático total**: cualquier cambio (deslizador, cantidad, nota, fecha) se
     persiste en el dispositivo al instante; aviso sutil "guardado ✓". Las notas se guardan
     con un pequeño retardo (debounce ~400 ms) para no escribir en cada tecla.
3. **Conclusión de tolerancia** (al final): selector que marca la persona —
   **Tolero · Tolero con límite (elige la dosis/cantidad registrada) · No tolero · Sin concluir** (por defecto).
   Esta conclusión es la que alimenta la Fase 3 (ver §4).

### 3.4 Almacenamiento (por alimento) y migración

- Clave `localStorage`: se reutiliza `sii_fodmap_fase2_v1` para no perder datos; sube a `version: 2`.
- Estructura nueva: `{ version:2, pruebas: { "<nombre alimento>": {
    dias: [ { etiqueta, cantidad, fecha, dolor, hinchazon, gases, notas, registrado } , … (≥3) ],
    conclusion: { estado: "tolera"|"limite"|"no"|"sin", dosisIndex: <n|null> }
  }, … } }`.
- **Migración v1 → v2 automática** al cargar: por cada `retos[<grupo>]` antiguo, se crea
  `pruebas[<alimentoElegido>]` con sus `dias` (y conclusión `"sin"`). Es transparente; no se
  pierde el diario de la persona.
- El flag `registrado` por dosis sustituye al antiguo `guardado` (ya no hay botón "Guardar";
  una dosis cuenta como registrada en cuanto se interactúa con ella).

### 3.5 Resumen para la dietista

Se reorganiza: **por grupo FODMAP → alimentos probados de ese grupo → picos por dosis +
conclusión marcada**. Mantiene el aviso "la app registra, no diagnostica". Reutiliza el cálculo
de pico (`max(dolor, hinchazon, gases)`).

## 4. Cambio 2 — Personalización (Fase 3) nueva

La Fase 3 deja de ser "7 grupos con veredicto manual" y pasa a ser **tolerancia por alimento**,
en dos partes.

### 4.1 Parte 1 — Derivada de la reintroducción (automática)

- Lista de los alimentos **con reto iniciado**, leídos de `pruebas` (§3.4).
- Por alimento: nombre, grupo/s, **conclusión** y **cantidad tolerada** (la dosis marcada),
  con acceso a su ficha/reto.
- La conclusión se puede **editar también aquí** (es el mismo dato `pruebas[x].conclusion`,
  sincronizado con la ficha de reintroducción).

### 4.2 Parte 2 — Manual y flexible

- Botón **"➕ Añadir alimento"**: se elige uno de los 131 **o se escribe a mano** uno que no
  esté, **que no se haya pasado por reintroducción**.
- Se marca **Tolero · Tolero con límite (cantidad que se escribe) · No tolero** + nota opcional.
- No llevan diario de síntomas: son una **nota de tolerancia personal** (experiencia real).
- Almacenamiento: clave `sii_fodmap_fase3_v1`, `version: 2`, estructura
  `{ version:2, manuales: { "<alimento o texto>": { estado, cantidad, nota } }, verSegunTolerancia }`.

### 4.3 Regla de fusión

Si un alimento está en la Parte 1 (reintroducido) y además se añade en la Parte 2, **manda la
Parte 1** (lo estructurado); no se duplica ni se muestra dos veces.

### 4.4 Efecto en el Buscador ("Ver según mi tolerancia")

- Pasa de recolorear **por grupo** a recolorear **por alimento**, leyendo las conclusiones de
  Parte 1 + Parte 2:
  - **Tolero** → se ve 🟢 (con nota "antes 🔴/🟡").
  - **Tolero con límite** → se ve 🟡.
  - **No tolero** / sin marcar → se mantiene la clasificación oficial.
- Solo cambian los alimentos que la persona ha marcado; el resto conserva su clasificación.
  La **ficha siempre muestra la clasificación oficial**.
- Sustituye a la lógica por grupo (regla "más restrictiva de fructanos", `nivelPersonalizado`
  por FODMAP), que se jubila.

### 4.5 Migración de la Fase 3 antigua

El modelo cambia de **grupo** a **alimento**, así que las tolerancias por grupo antiguas
(`tolerancias` en `sii_fodmap_fase3_v1` v1) **no se convierten automáticamente** (semántica
distinta). **Decisión cerrada (2026-06-07): conservar y empezar limpio** — las tolerancias por
grupo antiguas se **mantienen dentro del objeto guardado y en la copia de seguridad** (no se
borran), pero la nueva Personalización **parte vacía** y la persona marca con el modelo por
alimento. Se eligió por simplicidad y porque hay pocos datos antiguos (Fase 3 es del 2026-06-04).

## 5. Cambio 3 — Navegación y botón "atrás"

### 5.1 Problema

La navegación interna (pestañas, fichas, retos) es por estado de JavaScript y **no registra
pasos en el historial del navegador**. Por eso el botón atrás del dispositivo, al no tener
nada anterior, **cierra la app**.

### 5.2 Solución: integrar con el historial (History API)

- Se modela el **estado de vista completo** (pestaña + subvista + parámetros) en una pequeña
  **máquina de navegación**.
- Cada navegación hacia delante hace `history.pushState(estado, …)`:
  - Cambiar de pestaña (Buscador ↔ Reintroducción ↔ Personalización).
  - Abrir una ficha / un reto / el resumen.
- `popstate` (botón atrás del dispositivo o gesto) **restaura la vista anterior** sin hacer push.
- Los botones **"‹ Volver"** en pantalla llaman a `history.back()` (misma vía que el botón del
  móvil) y se hacen **más visibles y consistentes**. Igual en Android (botón) y iPhone (gesto).

### 5.3 Salir desde la pantalla inicial ("pulsa otra vez para salir")

- En la pantalla inicial (sin pasos anteriores), al pulsar atrás:
  - Se muestra un aviso tipo *toast* "Pulsa atrás otra vez para salir" y se **rearma** un paso
    de historial (buffer) durante ~2 s.
  - Si se vuelve a pulsar atrás dentro de esa ventana, **se sale** de la app.
  - Si no, el aviso desaparece y la app sigue abierta.

### 5.4 Diseño para que sea testeable

La lógica de navegación se separa en una **función pura / reductor** (estado actual + acción →
estado nuevo, y manejo de `popstate`) con un fino conector a `history`/DOM. Así la máquina de
navegación y el "pulsa otra vez para salir" se prueban con shims en Node, sin navegador.

## 6. Verificación (tests) y publicación

- **Adaptar** los tests existentes que dependen del modelo viejo (retos por grupo, 3 dosis
  fijas, `validarReto`, `calcularFechas`, `resumenFase2PorGrupo`, recolor por grupo).
- **Nuevos tests** (lógica pura):
  - Migración v1 → v2 de Fase 2 (retos por grupo → pruebas por alimento) sin pérdida.
  - Diario por alimento con **dosis variables** (≥3); cálculo de fechas para N dosis.
  - Derivación del grupo/s y de la agenda desde `DATOS.fodmap[]` (incl. multi-FODMAP y verdes).
  - Orden de la lista (reintroducibles primero).
  - Conclusiones y su lectura desde la Fase 3 (Parte 1).
  - Parte 2 manual + regla de fusión Parte 1/Parte 2.
  - Recolor por alimento (Tolero/límite/No tolero) y que la ficha conserva lo oficial.
  - Máquina de navegación: push/pop entre vistas y "pulsa otra vez para salir".
  - Import de copias **antiguas** (formato v1) migradas al vuelo.
- **Verificación headless por el asistente** con arnés Node (vm + shims de DOM/localStorage/
  history), porque los `?test` solo corren en navegador y el usuario no los abre. Objetivo:
  dejar el contador en `N ✓ / 0 ✗`.
- **Publicación**: incrementar `VERSION` en `sw.js` (actual `v6` → `v7`) para que aparezca el
  banner de actualización. Actualizar `ESTADO.md`.

## 7. Qué se jubila (para no dejar cosas a medias)

- `RETOS` como fuente de alimentos del reto (se conserva solo como mini-tabla grupo→agenda+nota).
- Dosis recomendadas y "alimento sugerido" por grupo.
- Botón "Guardar" por dosis (lo sustituye el guardado automático).
- Fase 3 por grupo: panel de 7 tarjetas, veredicto por grupo, `nivelPersonalizado` por FODMAP
  y la "regla más restrictiva de fructanos".

## 8. Riesgos y decisiones abiertas

- **Botón atrás**: es lo más delicado de afinar (que no se "atasque" ni salte pasos). Se mitiga
  con la máquina de navegación testeable + comprobación manual en móvil.
- **Migración Fase 3 antigua** (§4.5): **cerrado** — conservar los veredictos por grupo en el
  objeto guardado y en la copia, sin auto-convertir; la nueva Personalización parte vacía.
- **Mapeo Fructanos trigo/verdura**: en el nuevo modelo el filtro es "Fructanos" (los datos no
  distinguen trigo/verdura); el matiz vive como nota educativa en el detalle, no como filtro.
- **Tamaño de la lista**: 131 alimentos; el orden "reintroducibles primero" y los filtros
  evitan que los verdes entierren lo importante.

## 9. Orden de implementación sugerido

1. **Datos y almacenamiento** Fase 2 por alimento + migración v1→v2 (+ tests).
2. **Reintroducción**: lista por alimentos, filtros, detalle con ficha + reto de dosis variables
   + guardado automático + conclusión (+ tests).
3. **Resumen** para la dietista reorganizado (+ tests).
4. **Fase 3** nueva: Parte 1 derivada + Parte 2 manual + recolor por alimento (+ tests).
5. **Navegación**: History API + "pulsa otra vez para salir" + botones Volver consistentes (+ tests).
6. **Cierre**: subir `VERSION` del SW, actualizar `ESTADO.md`, verificación headless final.
