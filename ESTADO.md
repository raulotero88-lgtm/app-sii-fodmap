# Estado del proyecto — App SII / FODMAP

Documento de control de avances. Última actualización: **2026-06-08**.

## Resumen

App **PWA** publicada en GitHub Pages para ayudar a una persona con SII (dieta FODMAP)
a lo largo de las **3 fases**: saber qué puede comer (fase 1), hacer la reintroducción
estructurada (fase 2) y personalizar la dieta según lo que tolera (fase 3). Mobile-first,
español de España, sin dependencias externas, con auto-tests integrados. Se instala desde el
navegador y funciona offline; las actualizaciones llegan automáticamente via banner.

- **Estado general:** ✅ funcional, en uso y publicada en GitHub Pages.
- **URL:** [https://raulotero88-lgtm.github.io/app-sii-fodmap/](https://raulotero88-lgtm.github.io/app-sii-fodmap/)
- **Tests:** 109 ✓ / 0 ✗ (abrir URL + `?test`, o `node tools/run-tests.mjs`).
- **Alimentos en el buscador:** 131.
- **Reintroducción:** por alimento (los 131), filtrable por 6 grupos FODMAP.
- **Navegación:** el botón "atrás" del dispositivo navega dentro de la app (no la cierra).
- **Datos:** revisados y contrastados con la guía clínica del usuario (AEG/SEEN vía NotebookLM) — criterio híbrido prudente. Ver `FUENTES.md`.

## Módulos

### 1. Buscador de alimentos (Fase 1) — ✅ Completado
- 131 alimentos curados con semáforo 🟢🟡🔴.
- Por alimento: ración orientativa, FODMAP responsable (o "Motivo del límite"), alternativas, consejo, fuente.
- Búsqueda tolerante (ignora tildes/mayúsculas, entiende sinónimos).
- Filtros por categoría y "solo seguros 🟢".
- Aviso de **acumulación (stacking)** y de porciones de fruta en cabecera.

### 2. Reintroducción (Fase 2) — ✅ Completado
- **Organizada por alimentos** (los 131), con buscador y filtros por los 6 grupos FODMAP
  (Fructosa, Lactosa, Sorbitol, Manitol, Fructanos, GOS). Reintroducibles primero; los "ya seguros 🟢" al final.
- Cada alimento muestra su **ficha completa** + el/los grupo(s) FODMAP que lleva, **derivados del propio alimento**
  (sin dosis recomendadas: las marca el dietista).
- Reto de **dosis variables** (≥3, se pueden añadir más). Agenda automática: días seguidos, o alternos (1-3-5)
  para fructanos y GOS.
- Diario de síntomas 0-10 (dolor, hinchazón, gases) + cantidad + notas, con **guardado automático total**
  (localStorage `sii_fodmap_fase2_v1`, modelo v2 `pruebas` por alimento; migración v1→v2 automática).
- **Conclusión por alimento** que marca la persona: Sin concluir / Tolero / Tolero con límite (con cantidad) / No tolero.
- **Resumen para la dietista**: por grupo → alimentos → picos por dosis + conclusión.
- Exportar/importar copia. La app registra, **no diagnostica** (aviso visible).

### 3. Personalización (Fase 3) — ✅ Completado
- Pestaña **🌱 Personalización** **por alimento** (ya no por grupo):
  - **Parte 1 — derivada de la reintroducción:** los alimentos con conclusión en Fase 2 (con enlace para ver/editar su reto).
  - **Parte 2 — añadidos a mano:** alimentos que la persona sabe por experiencia que tolera (o no),
    aunque no pasaran por reintroducción.
- En el Buscador, interruptor **"🌱 Ver según mi tolerancia"**: re-colorea **por alimento** según el mapa de tolerancia
  (la conclusión de la reintroducción **manda** sobre el ajuste manual). Nunca empeora un nivel;
  la ficha conserva siempre la clasificación oficial.
- Persistencia en `localStorage` (`sii_fodmap_fase3_v1`, modelo v2 `manuales`; migración que conserva lo viejo
  en `tolerancias_legacy`) y **copia de seguridad unificada** (Fase 2 + Fase 3) compatible con copias antiguas.

## Historial de avances

| Fecha | Hito |
|-------|------|
| 2026-05-31 | Init repo + spec/plan inicial |
| 2026-05-31 | Buscador completo: 130 alimentos, 29 tests, README y fuentes |
| 2026-05-31 | Spec del módulo Fase 2 |
| 2026-05-31 | Módulo Fase 2: diario, persistencia, resumen (50 tests) |
| 2026-05-31 | Fase 2: alimento personalizado + catálogo ampliado (59 tests) |
| 2026-05-31 | PWA: manifest, service worker, iconos, banner de actualización, GitHub Pages |
| 2026-05-31 | Verificación clínica de los 130 datos vs NotebookLM (AEG/SEEN); correcciones con criterio híbrido prudente, campo "Motivo del límite", +Edamame (131), aviso de stacking. SW v4 |
| 2026-06-04 | Fase 3: panel de personalización + Buscador personalizado (interruptor de tolerancia). Copia de seguridad unificada. 103 tests. SW v6 |
| 2026-06-07 | Reestructuración por alimentos: Reintroducción y Fase 3 por alimento (derivada + manual), botón "atrás" del dispositivo (History API) y arnés de tests Node (`tools/run-tests.mjs`). 109 tests. SW v7 |

## Backlog / ideas futuras (sin empezar)

- [x] **Fase 3 (personalización):** vista que resume qué FODMAPs tolera + Buscador personalizado. ✅ 2026-06-04.
- [x] **Reestructuración por alimentos** (reintro + Fase 3 por alimento) **+ botón "atrás"** del dispositivo. ✅ 2026-06-07.
- [ ] **Favoritos / lista de la compra** segura en el buscador.
- [ ] Ampliar catálogo de alimentos (a demanda).
- [ ] Recordatorios de las dosis/días (notificaciones push — requiere backend o servicio externo).
- [ ] Revisión periódica de clasificaciones FODMAP (Monash las actualiza).

## Cómo trabajar en el proyecto

- **Verificar antes de dar por bueno:** abrir URL + `?test` → debe marcar `109 ✓ / 0 ✗`. Sin navegador: `node tools/run-tests.mjs` (mismo resultado, exit 0).
- **Publicar cambios:** editar `index.html` → `git commit` → `git push` → GitHub Pages actualiza en ~1 min → Laura ve el banner de actualización.
- **Flujo:** brainstorming → spec (`docs/superpowers/specs/`) → plan (`docs/superpowers/plans/`) → implementar.
- **Datos:** los alimentos están en `DATOS[]` dentro del `<script>` de `index.html`. Ya **no** hay catálogo `RETOS[]`: el grupo FODMAP y la agenda se **derivan del propio alimento** (`GRUPOS_META` + `gruposDeAlimento`/`agendaDeAlimento`). El diario se guarda **por alimento** (`pruebas`).
- **Fuentes:** ver `FUENTES.md`. No se copian los gramos exactos propietarios de Monash.
- **Versión del SW:** al publicar cambios incrementar `VERSION` en `sw.js` (actualmente `v7`) para que el banner aparezca.

## Archivos del proyecto

```
index.html          La app completa (estructura + estilos + datos + lógica + tests)
manifest.json       Metadatos PWA (nombre, iconos, colores)
sw.js               Service worker (caché offline + detección de actualizaciones)
icons/              Iconos PWA (192×192 y 512×512)
generate-icons.py   Script de un solo uso para regenerar los iconos
tools/run-tests.mjs Arnés Node para correr los tests inline sin navegador
README.md           Cómo usar e instalar en el móvil
FUENTES.md          Fuentes de la base de datos y contexto de las 3 fases
ESTADO.md           Este documento de control
docs/superpowers/   Specs y planes de diseño
```
