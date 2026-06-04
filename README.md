# 🍽️ ¿Puedo comerlo? — App SII / FODMAP

App para consultar al instante si un alimento es apto en la dieta baja en FODMAP
(Síndrome del Intestino Irritable), pensada para la **fase 1 (eliminación)**.
Funciona **sin internet** una vez instalada. 131 alimentos.

**URL:** [https://raulotero88-lgtm.github.io/app-sii-fodmap/](https://raulotero88-lgtm.github.io/app-sii-fodmap/)

## Cómo usar

Abre la URL en el navegador. Escribe el nombre de un alimento (p. ej.
"cebolla", "plátano", "pan") y verás:

- 🟢 **Verde** — puedes comerlo.
- 🟡 **Amarillo** — depende de la cantidad (mira la ración).
- 🔴 **Rojo** — evítalo en fase 1.

Cada ficha muestra la **ración orientativa**, **qué FODMAP** lo hace problemático,
**alternativas seguras** y un **consejo práctico**. Puedes filtrar por categoría o
marcar "Mostrar solo seguros 🟢".

La búsqueda ignora mayúsculas y tildes y entiende sinónimos ("patata"/"papa").

## 🔄 Fase 2 — Reintroducción

La pestaña **Reintroducción** ayuda a probar de forma estructurada cada grupo FODMAP
(fructosa, lactosa, sorbitol, manitol, fructanos de trigo y de verdura, GOS):

- Para cada grupo propone un **alimento de prueba** con un solo FODMAP (miel, leche,
  champiñón…) y **3 dosis crecientes**, con varias alternativas elegibles.
- Si reintroduces **otro alimento** (el que te indique tu dietista), elige
  "✏️ Otro alimento" y escribe su nombre y sus 3 dosis: queda registrado igual.
- Calcula las **fechas** automáticamente: 3 días seguidos, o **días alternos** (1-3-5)
  para fructanos y GOS, porque sus síntomas tardan más en aparecer.
- Registra los **síntomas** por dosis (dolor, hinchazón, gases 0-10 + notas).
- Recuerda los **días de descanso** entre grupos.
- Genera un **resumen** para enseñar al dietista.

El diario se **guarda solo** en el móvil (sin internet ni cuentas). Usa **Exportar copia**
para hacer una copia de seguridad o pasarla a otro dispositivo, e **Importar copia** para
restaurarla. La app **registra, no diagnostica**: la tolerancia la interpretas con tu dietista.

## 🌱 Fase 3 — Personalización

La pestaña **Personalización** resume tu diario de Fase 2 (los picos de síntomas por dosis) y
te deja marcar, por cada grupo FODMAP, si lo toleras: *Sin probar / Tolero / Tolero con límite /
No tolero*. **Tú marcas la tolerancia; la app no diagnostica.**

Con eso, en el **Buscador** aparece el interruptor **"🌱 Ver según mi tolerancia"**: al activarlo,
los alimentos que solo estaban limitados por un FODMAP que ahora toleras cambian de color (con la
nota "antes 🔴"). La ficha de cada alimento **mantiene siempre** su clasificación oficial, y al
desactivar el interruptor vuelve todo a la vista de partida. La copia de seguridad
(Exportar/Importar) incluye también esta información.

## Instalar en el móvil (icono en la pantalla de inicio)

1. Abre la URL en el navegador del móvil.
2. **Android (Chrome):** aparece un banner automático "Añadir a pantalla de inicio" — pulsa ahí.
3. **iPhone (Safari):** botón Compartir → "Añadir a pantalla de inicio".

Quedará instalada con icono propio y se abrirá a pantalla completa, sin internet.

## Actualizaciones automáticas

Cuando haya una versión nueva, la app mostrará un banner verde en la parte inferior:
**"🔄 Nueva versión disponible"**. Pulsa **"Actualizar ahora"** para aplicarla.
Tus datos no se pierden en ningún momento.

## ⚠️ Aviso importante

Información **orientativa** basada en fuentes públicas fiables (ver
[`FUENTES.md`](FUENTES.md)). **No sustituye** el consejo de un dietista-nutricionista.
Las cantidades de corte exactas las analiza la Universidad de Monash en laboratorio
y dependen de cada persona. Para los gramos exactos, su app oficial es la referencia.
Ante cualquier duda, consulta con un profesional.

## Tests

Abre la URL + `?test` en el navegador para ejecutar la batería de auto-tests
(valida los datos y la lógica de búsqueda). Debe mostrar "103 ✓ / 0 ✗".
