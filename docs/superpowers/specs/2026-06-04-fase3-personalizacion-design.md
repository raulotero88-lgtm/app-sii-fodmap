# Diseño: Módulo Fase 3 — Personalización (app SII/FODMAP)

**Fecha:** 2026-06-04
**Estado:** Aprobado por el usuario
**Amplía:** `2026-05-31-app-sii-fodmap-design.md` (Buscador) y
`2026-05-31-fase2-reintroduccion-design.md` (Reintroducción), ya implementados en `index.html`.

## 1. Propósito

Añadir a la app existente un módulo para la **fase 3 (personalización)** de la dieta
FODMAP: la fase de mantenimiento en la que se reintroduce todo lo que la persona tolera
y se mantiene solo la restricción de los FODMAPs que le dan síntomas.

El módulo:

1. **Resume el diario de Fase 2** por cada grupo FODMAP (picos de síntomas por dosis), como ayuda visual.
2. Deja que **Laura marque su veredicto** de tolerancia por grupo.
3. Con esos veredictos, ofrece un **interruptor en el Buscador** que re-colorea los alimentos que ya puede comer.

Sigue el principio de la app: **registra y refleja lo que Laura decide; no diagnostica**.
La app nunca marca un veredicto por sí sola.

## 2. Decisiones tomadas (brainstorming 2026-06-04)

| Decisión | Elección |
|----------|----------|
| Alcance | **Ambas cosas**: panel de tolerancias **+** Buscador personalizado a partir de él |
| Veredicto | **Lo marca Laura** (manual). La app muestra el resumen de síntomas como ayuda, no decide |
| Estados | **3 estados + dosis-límite**: Sin probar · Tolero · Tolero con límite (hasta dosis 1/2/3) · No tolero |
| UX en el Buscador | **Interruptor "Ver según mi tolerancia"** que re-colorea en sitio; la clasificación oficial siempre recuperable |
| Nombre de la pestaña | **🌱 Personalización** |
| Regla de fructanos | **Más restrictiva**: un alimento de fructanos solo mejora si Laura tolera fructanos de trigo **y** de verdura |
| Copia de seguridad | **Unificada**: el Exportar/Importar existente incluye también los datos de Fase 3 |
| Formato técnico | Sigue siendo **un único archivo HTML offline**, sin dependencias |

## 3. Navegación

Tercera pestaña junto a 🔍 Buscador y 🔄 Reintroducción.

- `vistaActual` admite el valor `"fase3"`.
- `renderApp()` añade el botón `🌱 Personalización` y, si `vistaActual === "fase3"`, llama a `renderFase3()`.
- No se tocan las vistas de Buscador ni de Fase 2.

## 4. Panel de tolerancias (vista Fase 3)

Cabecera con:
- **Aviso médico** visible: la app registra/refleja, no diagnostica; la tolerancia se interpreta con el dietista.
- **Resumen breve** tipo "Toleras 4 de 7 grupos" (cuenta de estados `tolera` + `limite`).

Una **tarjeta por cada uno de los 7 grupos** de `RETOS`. Cada tarjeta muestra:

- **Resumen leído de Fase 2** (si existe diario para ese grupo): nombre del alimento probado
  y el **pico de síntomas** (máximo de dolor / hinchazón / gases) por cada dosis registrada.
  Es ayuda visual, **no** un veredicto.
- **Selector de veredicto** con 4 estados: *Sin probar · Tolero · Tolero con límite · No tolero*.
- Si elige **Tolero con límite**, aparece un segundo selector de **dosis-límite (1/2/3)**.
  Se rellena por defecto con la última dosis que registró sin síntomas altos
  (sugerencia editable; nunca se interpreta como veredicto automático).
- Si un grupo **no tiene diario** en Fase 2, sale como *Sin probar* pero Laura puede marcarlo
  igualmente (p. ej. si lo probó por su cuenta o se lo indicó el dietista).

Los cambios se guardan automáticamente al marcarlos.

## 5. Modelo de datos y persistencia

### 5.1 Tolerancias (persistido en localStorage)

```js
// clave: "sii_fodmap_fase3_v1"
{
  version: 1,
  tolerancias: {
    // clave = id del reto en RETOS
    "fructosa":          { estado: "tolera",     limiteDosis: null },
    "lactosa":           { estado: "limite",     limiteDosis: 2 },
    "sorbitol":          { estado: "no",         limiteDosis: null },
    "manitol":           { estado: "sin_probar", limiteDosis: null },
    "fructanos-trigo":   { estado: "tolera",     limiteDosis: null },
    "fructanos-verdura": { estado: "limite",     limiteDosis: 1 },
    "gos":               { estado: "sin_probar", limiteDosis: null }
  },
  verSegunTolerancia: false   // preferencia del interruptor del Buscador
}
```

- `estado` ∈ `"sin_probar" | "tolera" | "limite" | "no"`.
- `limiteDosis` ∈ `1 | 2 | 3 | null` (solo relevante con `estado === "limite"`).
- Se usa la misma capa `almacen` que Fase 2 (try/catch, memoria de respaldo si `localStorage` falla).

### 5.2 Copia de seguridad unificada

Hoy `almacen.exportar()` devuelve el objeto de Fase 2 "pelado" (`{ version, retos }`) en el
archivo `diario-fodmap.json`, e `importar()` valida que el JSON tenga la clave `retos`.

El **Exportar/Importar existente** se amplía para que un único archivo `.json` respalde
**Fase 2 + Fase 3** (el Buscador no guarda datos de la usuaria, así que no entra en el backup).

- **Formato nuevo exportado:** objeto envolvente con una sección por módulo, cada una con su `version`:
  `{ app: "sii-fodmap", fase2: { version, retos }, fase3: { version, tolerancias, verSegunTolerancia } }`.
- **Compatibilidad al importar** (se detecta la forma del JSON):
  - Si trae las claves `fase2`/`fase3` → formato nuevo; restaura ambas secciones.
  - Si trae `retos` en la raíz → copia **antigua** (solo Fase 2): se restaura Fase 2 y las
    tolerancias quedan vacías (todo *Sin probar*), sin pisar lo que hubiera en Fase 3.
  - Cualquier otra cosa → inválida, no pisa datos (igual que hoy).
- No es necesario que las copias **nuevas** se puedan importar en versiones **antiguas** de la app
  (la PWA se actualiza sola y la versión vieja deja de usarse).

## 6. Lógica de re-coloreado del Buscador (parte delicada)

Función **pura** `nivelPersonalizado(alimento, tolerancias)` → devuelve un objeto
`{ nivel, nota }` con el nivel personalizado, o `null` si el alimento **no cambia**.

Reglas conservadoras (pensadas para la seguridad de la persona con SII):

1. Solo se evalúa si `alimento.fodmap.length > 0`. Los alimentos limitados por **carga total**
   (`fodmap: []` + campo `motivo`) **nunca** se re-colorean: no hay un FODMAP único al que atribuir la mejora.
2. Un alimento mejora **solo si TODOS sus FODMAPs responsables están tolerados**.
   (Ej.: `["GOS","Fructanos"]` requiere tolerar GOS **y** fructanos.)
3. Combinación de estados de los FODMAPs responsables:
   - Todos `tolera` → **🟢 verde**, nota "según tu tolerancia".
   - Alguno `limite` y ninguno `no`/`sin_probar` → **🟡 amarillo**, nota "según tu tolerancia, con moderación".
   - Cualquiera `no` o `sin_probar` → **no cambia** (se queda con el nivel oficial).
4. **Fructanos** (los alimentos solo etiquetan `"Fructanos"`, pero Fase 2 separa trigo y verdura):
   se aplica el **estado más restrictivo** de `fructanos-trigo` y `fructanos-verdura`.
   Orden de severidad: `no`/`sin_probar` > `limite` > `tolera`. Así una cebolla solo mejora
   si Laura tolera **ambos** tipos de fructanos. (Si en el futuro se quisiera distinguir
   cebolla/ajo —verdura— de pan/pasta —trigo—, habría que etiquetar cada alimento; queda fuera de alcance.)

### Interfaz en el Buscador

- **Interruptor "Ver según mi tolerancia"**, que solo aparece si existe **algún** veredicto
  guardado distinto de *Sin probar*.
- **Activado:** los alimentos elegibles se re-colorean y muestran "(antes 🔴)" / "(antes 🟡)".
  El filtro "Mostrar solo seguros 🟢" respeta los colores personalizados.
  El estado del interruptor se persiste en `verSegunTolerancia`.
- **Desactivado (por defecto):** se muestra la clasificación oficial.
- **La ficha del alimento siempre conserva visible su clasificación oficial** y su fuente,
  para no perder la referencia base.

## 7. Arquitectura (dentro del único archivo)

Se añaden secciones al `<script>` existente, sin tocar la lógica del Buscador ni de Fase 2:

```
STORAGE_KEY_F3 = "sii_fodmap_fase3_v1"
almacenF3 (o reuso de almacen)   capa de persistencia de tolerancias
resumenFase2PorGrupo(id)         lee el diario de Fase 2 y devuelve picos de síntomas por dosis
sugerirLimiteDosis(id)           última dosis sin síntomas altos (sugerencia, no veredicto)
nivelPersonalizado(alimento, tolerancias)   función PURA de re-coloreado (testable sin DOM)
severidadFructanos(tolerancias)  estado más restrictivo de trigo/verdura
estadoFase3                      estado de UI del módulo
renderFase3()                    pinta el panel de tolerancias
navegar("fase3")                 alterna a la vista
exportar()/importar()            ampliadas para incluir la sección fase3
```

`nivelPersonalizado`, `severidadFructanos` y la capa de persistencia son **funciones
puras/aisladas** (testables sin DOM). El estado de Fase 3 vive separado del de Buscador y Fase 2.
El re-coloreado es una **capa de solo lectura** sobre `DATOS`: no muta la base de datos.

## 8. Manejo de errores y robustez

- `localStorage` envuelto en try/catch: si falla (modo privado, bloqueado), la app sigue
  funcionando en memoria y avisa de usar Exportar manualmente.
- Importar **valida la estructura** del JSON antes de aplicarla; una copia inválida no pisa datos.
- Importar una copia **antigua sin Fase 3** deja las tolerancias vacías y no rompe.
- Migración por `version` para cambios de formato futuros.
- Fase 3 **no puede romper** el Buscador ni la Fase 2 (estados y render separados; el re-coloreado
  no muta `DATOS`).
- Si no hay ningún veredicto, el interruptor del Buscador no aparece y todo se comporta como hoy.

## 9. Verificación

### Auto-tests (`?test`), además de los existentes

- `nivelPersonalizado`:
  - multi-FODMAP solo mejora cuando **todos** sus FODMAPs están tolerados;
  - todos `tolera` → verde; alguno `limite` (sin `no`/`sin_probar`) → amarillo;
  - cualquiera `no` o `sin_probar` → no cambia;
  - alimento con `fodmap: []` / `motivo` **nunca** cambia;
  - fructanos usa el estado **más restrictivo** de trigo/verdura.
- `severidadFructanos`: devuelve el estado correcto según los dos sub-grupos.
- `almacen` Fase 3: guardar→cargar es idempotente; cargar sin datos devuelve estructura vacía válida.
- Export/Import unificado: exportar con Fase 2+3 y reimportar restaura ambos; importar copia
  antigua (sin Fase 3) no rompe ni pisa.
- `sugerirLimiteDosis` produce una sugerencia, no un veredicto (no fija `estado` por sí sola).

### Manual en navegador

Marcar veredictos en el panel; comprobar el resumen "X de 7"; activar el interruptor en el
Buscador y verificar el re-coloreado y los "(antes 🔴)"; comprobar que un alimento de `motivo`
no cambia; desactivar y ver la clasificación oficial; exportar, borrar, importar y comprobar
que se restauran Fase 2 y Fase 3. Probar en vista móvil.

## 10. Fuera de alcance (de este módulo)

- Recordatorios para **re-probar** más adelante los grupos marcados como *No tolero* (re-challenge).
- Diagnóstico o veredicto **automático** de tolerancia.
- Sub-clasificar cada alimento en fructanos de **trigo** vs **verdura**.
- Notificaciones push, sincronización en la nube (se cubre con Exportar/Importar manual).
