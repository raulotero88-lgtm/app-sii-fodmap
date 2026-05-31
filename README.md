# 🍽️ ¿Puedo comerlo? — App SII / FODMAP

App de **un solo archivo** para consultar al instante si un alimento es apto en la
dieta baja en FODMAP (Síndrome del Intestino Irritable), pensada para la **fase 1
(eliminación)**. Funciona **sin internet** y sin instalar nada. 130 alimentos.

## Cómo usar

Abre `SII-FODMAP.html` con doble clic. Escribe el nombre de un alimento (p. ej.
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

## Instalar en el móvil (icono en la pantalla de inicio)

1. Envíate `SII-FODMAP.html` por WhatsApp/email y ábrelo en el navegador del móvil.
2. **iPhone (Safari):** botón Compartir → "Añadir a pantalla de inicio".
3. **Android (Chrome):** menú ⋮ → "Añadir a pantalla de inicio".

Quedará como una app con su icono y se abrirá a pantalla completa, sin internet.

## ⚠️ Aviso importante

Información **orientativa** basada en fuentes públicas fiables (ver
[`FUENTES.md`](FUENTES.md)). **No sustituye** el consejo de un dietista-nutricionista.
Las cantidades de corte exactas las analiza la Universidad de Monash en laboratorio
y dependen de cada persona. Para los gramos exactos, su app oficial es la referencia.
Ante cualquier duda, consulta con un profesional.

## Tests

Abre `SII-FODMAP.html?test` en el navegador para ejecutar la batería de auto-tests
(valida los datos y la lógica de búsqueda). Debe mostrar "N ✓ / 0 ✗".
