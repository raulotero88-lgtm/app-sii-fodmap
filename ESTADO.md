# Estado del proyecto — App SII / FODMAP

Documento de control de avances. Última actualización: **2026-05-31**.

## Resumen

App **PWA** publicada en GitHub Pages para ayudar a una persona con SII (dieta FODMAP)
a saber qué puede comer y a hacer la reintroducción (fase 2). Mobile-first, español de
España, sin dependencias externas, con auto-tests integrados. Se instala desde el navegador
y funciona offline; las actualizaciones llegan automáticamente via banner.

- **Estado general:** ✅ funcional, en uso y publicada en GitHub Pages.
- **URL:** [https://raulotero88-lgtm.github.io/app-sii-fodmap/](https://raulotero88-lgtm.github.io/app-sii-fodmap/)
- **Tests:** 59 ✓ / 0 ✗ (abrir URL + `?test`).
- **Alimentos en el buscador:** 131.
- **Retos de reintroducción:** 7 grupos FODMAP.
- **Datos:** revisados y contrastados con la guía clínica del usuario (AEG/SEEN vía NotebookLM) — criterio híbrido prudente. Ver `FUENTES.md`.

## Módulos

### 1. Buscador de alimentos (Fase 1) — ✅ Completado
- 131 alimentos curados con semáforo 🟢🟡🔴.
- Por alimento: ración orientativa, FODMAP responsable (o "Motivo del límite"), alternativas, consejo, fuente.
- Búsqueda tolerante (ignora tildes/mayúsculas, entiende sinónimos).
- Filtros por categoría y "solo seguros 🟢".
- Aviso de **acumulación (stacking)** y de porciones de fruta en cabecera.

### 2. Reintroducción (Fase 2) — ✅ Completado
- 7 grupos: Fructosa, Lactosa, Sorbitol, Manitol, Fructanos (trigo), Fructanos (verdura), GOS.
- Alimento de prueba con un solo FODMAP + 3 dosis crecientes + alternativas elegibles.
- **Alimento personalizado** ("✏️ Otro alimento"): nombre + 3 dosis propias.
- Agenda automática: días seguidos, o alternos (1-3-5) para fructanos y GOS.
- Diario de síntomas 0-10 (dolor, hinchazón, gases) + notas.
- Guardado automático (localStorage) + exportar/importar copia.
- Resumen para el dietista.
- La app registra, **no diagnostica** (aviso visible).

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

## Backlog / ideas futuras (sin empezar)

- [ ] **Fase 3 (personalización):** vista que resuma qué FODMAPs tolera y en qué cantidad.
- [ ] **Favoritos / lista de la compra** segura en el buscador.
- [ ] Ampliar catálogo de alimentos (a demanda).
- [ ] Recordatorios de las dosis/días (notificaciones push — requiere backend o servicio externo).
- [ ] Revisión periódica de clasificaciones FODMAP (Monash las actualiza).

## Cómo trabajar en el proyecto

- **Verificar antes de dar por bueno:** abrir URL + `?test` → debe marcar `59 ✓ / 0 ✗`.
- **Publicar cambios:** editar `index.html` → `git commit` → `git push` → GitHub Pages actualiza en ~1 min → Laura ve el banner de actualización.
- **Flujo:** brainstorming → spec (`docs/superpowers/specs/`) → plan (`docs/superpowers/plans/`) → implementar.
- **Datos:** los alimentos están en `DATOS[]` y los retos en `RETOS[]` dentro del `<script>` de `index.html`.
- **Fuentes:** ver `FUENTES.md`. No se copian los gramos exactos propietarios de Monash.
- **Versión del SW:** al publicar cambios incrementar `VERSION` en `sw.js` (v3 → v4…) para que el banner aparezca.

## Archivos del proyecto

```
index.html          La app completa (estructura + estilos + datos + lógica + tests)
manifest.json       Metadatos PWA (nombre, iconos, colores)
sw.js               Service worker (caché offline + detección de actualizaciones)
icons/              Iconos PWA (192×192 y 512×512)
generate-icons.py   Script de un solo uso para regenerar los iconos
README.md           Cómo usar e instalar en el móvil
FUENTES.md          Fuentes de la base de datos y contexto de las 3 fases
ESTADO.md           Este documento de control
docs/superpowers/   Specs y planes de diseño
```
