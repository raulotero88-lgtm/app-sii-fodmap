# Estado del proyecto — App SII / FODMAP

Documento de control de avances. Última actualización: **2026-05-31**.

## Resumen

App HTML de **un solo archivo offline** (`SII-FODMAP.html`) para ayudar a una persona
con SII (dieta FODMAP) a saber qué puede comer y a hacer la reintroducción (fase 2).
Mobile-first, español de España, sin dependencias externas, con auto-tests integrados.

- **Estado general:** ✅ funcional y en uso.
- **Tests:** 59 ✓ / 0 ✗ (abrir `SII-FODMAP.html?test`).
- **Alimentos en el buscador:** 130.
- **Retos de reintroducción:** 7 grupos FODMAP.

## Módulos

### 1. Buscador de alimentos (Fase 1) — ✅ Completado
- 130 alimentos curados con semáforo 🟢🟡🔴.
- Por alimento: ración orientativa, FODMAP responsable, alternativas, consejo, fuente.
- Búsqueda tolerante (ignora tildes/mayúsculas, entiende sinónimos).
- Filtros por categoría y "solo seguros 🟢".

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

## Backlog / ideas futuras (sin empezar)

- [ ] **Fase 3 (personalización):** vista que resuma qué FODMAPs tolera y en qué cantidad.
- [ ] **Favoritos / lista de la compra** segura en el buscador.
- [ ] Ampliar catálogo de alimentos (a demanda).
- [ ] Recordatorios de las dosis/días (requiere PWA o notificaciones; hoy fuera de alcance).
- [ ] Revisión periódica de clasificaciones FODMAP (Monash las actualiza).

## Cómo trabajar en el proyecto

- **Verificar antes de dar por bueno:** abrir `SII-FODMAP.html?test` → debe marcar `N ✓ / 0 ✗`.
- **Flujo:** brainstorming → spec (`docs/superpowers/specs/`) → plan (`docs/superpowers/plans/`) → implementar.
- **Datos:** los alimentos están en `DATOS[]` y los retos en `RETOS[]` dentro del `<script>`.
- **Fuentes:** ver `FUENTES.md`. No se copian los gramos exactos propietarios de Monash.

## Archivos del proyecto

```
SII-FODMAP.html   La app completa (estructura + estilos + datos + lógica + tests)
README.md         Cómo usar e instalar en el móvil
FUENTES.md        Fuentes de la base de datos y contexto de las 3 fases
ESTADO.md         Este documento de control
docs/superpowers/ Specs y planes de diseño
```
