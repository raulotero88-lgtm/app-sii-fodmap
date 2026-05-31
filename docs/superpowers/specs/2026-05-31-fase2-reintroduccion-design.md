# Diseño: Módulo Fase 2 — Reintroducción (app SII/FODMAP)

**Fecha:** 2026-05-31
**Estado:** Aprobado por el usuario
**Amplía:** `2026-05-31-app-sii-fodmap-design.md` (la app del buscador, ya implementada en `SII-FODMAP.html`).

## 1. Propósito

Añadir a la app existente un módulo para la **fase 2 (reintroducción)** de la dieta
FODMAP: probar de forma estructurada cada grupo de FODMAP con un alimento de prueba
en dosis crecientes, registrar los síntomas y respetar los días de descanso/lavado,
para que la usuaria identifique (con su dietista) qué FODMAPs tolera.

## 2. Decisiones tomadas (brainstorming)

| Decisión | Elección |
|----------|----------|
| Navegación | Dos pestañas en la misma app: **🔍 Buscador** (intacto) y **🔄 Reintroducción** |
| Guardado | **Automático** en `localStorage` + botones **Exportar/Importar** copia |
| Guía de challenges | **Guiada con alternativas**: alimento sugerido + 2-3 alternativas válidas por grupo |
| Registro de síntomas | **Sencillo**: dolor, hinchazón, gases (0-10) + notas |
| Veredicto | **Solo registrar**; la app NO diagnostica tolerancia (lo decide ella/su dietista) |
| Formato técnico | Sigue siendo **un único archivo HTML offline**, sin dependencias |

## 3. Base científica (protocolo de reintroducción confirmado)

- Se prueba **un grupo FODMAP cada vez**, con un alimento que contenga **un solo FODMAP
  dominante** (p. ej. la manzana NO sirve: fructosa + sorbitol; la miel SÍ: fructosa).
- **3 dosis crecientes**: día 1 baja/moderada → día 2 media → día 3 alta.
- **Fructanos y GOS**: probar en **días alternos** (día 1, 3, 5) porque los síntomas
  pueden tardar hasta 48 h. El resto de grupos pueden ir en **3 días seguidos**.
- **Lavado (washout) de 2-3 días** con dieta baja en FODMAP entre grupos, hasta que
  se calmen los síntomas.
- Síntomas en escala **0-10** (dolor abdominal, hinchazón, gases).
- Proceso completo ~6-8 semanas, ~7-9 challenges.

Fuentes: Monash FODMAP (blog "practical tips" y "reintroduction diary"), Diet vs Disease,
FODMAP Friendly, A Little Bit Yummy, Tuck et al. 2017 (J Gastroenterol Hepatol).

**Limitación honesta:** dosis orientativas en español; no son gramos certificados de
laboratorio. La app registra, no diagnostica. Aviso visible de consultar al dietista.

## 4. Grupos FODMAP y alimentos de prueba

Cada grupo (`RETOS`) define: nombre, alimento sugerido, alternativas válidas (todas con
un solo FODMAP dominante), las 3 dosis orientativas y el tipo de agenda.

| id | Grupo | Sugerido | Alternativas | Agenda |
|----|-------|----------|--------------|--------|
| fructosa | Fructosa | Miel | Mango, Espárrago | seguida (1-2-3) |
| lactosa | Lactosa | Leche normal | Yogur normal | seguida |
| sorbitol | Sorbitol | Mora/zarzamora | Albaricoque | seguida |
| manitol | Manitol | Champiñón | Coliflor | seguida |
| fructanos-trigo | Fructanos (trigo) | Pan de trigo | Pasta de trigo | alterna (1-3-5) |
| fructanos-verdura | Fructanos (verdura) | Cebolla | Ajo | alterna |
| gos | GOS (galactanos) | Garbanzos (bote) | Lentejas, Almendras | alterna |

Dosis orientativas por alimento sugerido (ejemplo, las 3 dosis):
- **Miel:** 1 cucharadita → 2 cucharaditas → 1 cucharada.
- **Leche normal:** 1/4 vaso (60 ml) → 1/2 vaso (125 ml) → 1 vaso (250 ml).
- **Mora:** 5 moras → 10 moras → 20 moras.
- **Champiñón:** 1/2 champiñón → 1 → 3 champiñones.
- **Pan de trigo:** 1/2 rebanada → 1 rebanada → 2 rebanadas.
- **Cebolla:** 1 cucharadita cruda → 1 cucharada → 1/4 cebolla.
- **Garbanzos de bote:** 1/4 taza → 1/2 taza → 3/4 taza.

(Cada alternativa lleva también sus 3 dosis en los datos.)

## 5. Modelo de datos

### 5.1 Definición de retos (estático, en el código)

```js
{
  id: "fructosa",
  grupo: "Fructosa",
  agenda: "seguida",            // "seguida" (1-2-3) | "alterna" (1-3-5)
  fodmap: "Fructosa",
  alimentos: [
    { nombre: "Miel", sugerido: true, dosis: ["1 cucharadita","2 cucharaditas","1 cucharada"] },
    { nombre: "Mango", sugerido: false, dosis: ["1/4 de pieza","1/2 pieza","1 pieza pequeña"] }
  ],
  nota: "Frase explicativa breve del grupo."
}
```

### 5.2 Progreso de la usuaria (persistido en localStorage)

```js
// clave: "sii_fodmap_fase2_v1"
{
  version: 1,
  retos: {
    "fructosa": {
      alimentoElegido: "Miel",
      fechaInicio: "2026-06-01",         // ISO; null si no iniciado
      dias: [
        { etiqueta: "Dosis 1", dosis: "1 cucharadita", fecha: "2026-06-01",
          dolor: 2, hinchazon: 4, gases: 3, notas: "leve por la tarde", guardado: true },
        { etiqueta: "Dosis 2", dosis: "2 cucharaditas", fecha: "2026-06-02", ... },
        { etiqueta: "Dosis 3", dosis: "1 cucharada",   fecha: "2026-06-03", ... }
      ]
    }
    // ...otros grupos
  }
}
```

## 6. Arquitectura (dentro del único archivo)

Se añaden secciones al `<script>` existente, sin tocar el buscador:

```
RETOS[]                  definición estática de los 7 challenges
almacen.cargar()/guardar()/exportar()/importar()   capa de persistencia (localStorage + JSON)
agenda.calcularFechas(inicio, agenda)              fechas de las 3 dosis (seguida/alterna)
estadoFase2              estado de UI del módulo (reto abierto, etc.)
renderFase2()            pinta la lista de grupos
renderReto(id)           pinta el detalle de un grupo con sus 3 días y sliders
renderResumen()          historial para enseñar al dietista
navegar(tab)             alterna entre "buscador" y "fase2"
```

La capa `almacen` y `agenda` son **funciones puras/aisladas** (testables sin DOM).
El estado de Fase 2 vive separado del estado del buscador.

## 7. Interfaz

- **Cabecera con 2 pestañas**: 🔍 Buscador · 🔄 Reintroducción.
- **Lista de grupos** (Fase 2): tarjeta por grupo con su estado (sin iniciar / en curso /
  completado) y los síntomas máximos registrados a modo informativo (no veredicto).
- **Detalle de grupo**:
  - Selector del alimento (sugerido por defecto + alternativas).
  - Botón "Empezar" → fija `fechaInicio` y calcula las fechas de las 3 dosis.
  - 3 bloques de dosis, cada uno con: cantidad, fecha, 3 deslizadores 0-10 (dolor,
    hinchazón, gases), notas y "Guardar día".
  - Aviso de días de lavado antes del siguiente grupo.
- **Resumen/historial**: todos los grupos y sus síntomas por dosis. Exportable.
- **Aviso médico** visible: la app registra, no diagnostica; interpretar con el dietista.
- **Exportar/Importar** copia de seguridad (descarga/lee un archivo `.json`).

## 8. Manejo de errores y robustez

- `localStorage` envuelto en try/catch: si falla (modo privado, bloqueado), la app
  sigue funcionando en memoria y avisa de usar Exportar manualmente.
- Importar valida la estructura del JSON antes de aplicarla; si es inválido, no pisa datos.
- Migración por `version`: si en el futuro cambia el formato, se puede migrar.
- Sliders con valores por defecto 0; un día sin guardar no rompe el resumen.
- El módulo Fase 2 no puede romper el buscador (estados y render separados).

## 9. Verificación

- **Auto-tests** (`?test`) nuevos, además de los del buscador:
  - `RETOS` bien formado (cada grupo: 1 sugerido, dosis de longitud 3, fodmap válido).
  - `agenda.calcularFechas`: "seguida" da días consecutivos; "alterna" da 1-3-5.
  - `almacen`: guardar→cargar devuelve lo mismo; exportar→importar es idempotente;
    importar JSON inválido no rompe ni pisa datos.
  - Robustez: cargar sin datos previos devuelve estructura vacía válida.
- **Manual** en navegador: empezar un reto, registrar 3 días, ver resumen, exportar,
  borrar, importar y comprobar que se restauran los datos. Probar en vista móvil.

## 10. Fuera de alcance (de este módulo)

- Notificaciones/recordatorios push (no posible sin servidor/PWA; se deja para futuro).
- Diagnóstico automático de tolerancia.
- Sincronización en la nube entre dispositivos (se cubre con Exportar/Importar manual).
- Fase 3 (personalización) como módulo propio.
