# Diseño: App SII / FODMAP (buscador de alimentos)

**Fecha:** 2026-05-31
**Estado:** Aprobado por el usuario
**Para:** Persona con Síndrome del Intestino Irritable (SII), fase 1 (eliminación) de la dieta FODMAP.

## 1. Propósito

App HTML que permite buscar un alimento y saber al instante si se puede comer
(semáforo 🟢/🟡/🔴), la ración orientativa segura, qué FODMAP lo hace problemático,
alternativas seguras y consejos prácticos. Objetivo: facilitar el día a día (compra,
cocina) de una persona con SII en fase de eliminación.

## 2. Decisiones tomadas (brainstorming)

| Decisión | Elección |
|----------|----------|
| Alcance | Buscador de alimentos con datos completos por ficha |
| Formato técnico | **Un único archivo HTML offline** (sin dependencias externas) |
| Dispositivo / idioma | Móvil (mobile-first), español de España |
| Datos por ficha | Semáforo, ración, FODMAP responsable, alternativas, consejos, categorías/filtros |
| Origen de datos | **Curado y trazable** desde fuentes públicas fiables (no se copian los gramos propietarios de Monash) |
| Nº de alimentos | ~80-120 esenciales del día a día en España |
| Fase de la dieta | Fase 1 – Eliminación (priorizar claridad seguro/evitar) |

## 3. Base científica (fuentes consultadas)

- Dieta FODMAP de la Universidad de Monash (estándar de referencia; app oficial de pago).
- Sistema de semáforo: 🟢 bajo FODMAP, 🟡 moderado (cuidar ración), 🔴 alto (evitar en fase 1).
- 6 FODMAPs: fructosa, lactosa, manitol, sorbitol, GOS, fructanos.
- Fuentes públicas para la curación: blog gratuito de Monash, Cleveland Clinic, UVA
  Digestive Health, dietistas especializados (Diet vs Disease, IBS Diets, Noisy Guts).

**Limitación honesta:** los gramos de corte exactos son datos de laboratorio propiedad
de Monash y no se reproducen. La app ofrece clasificación correcta + ración orientativa
+ fuente citada, presentada como guía que **no sustituye a un dietista**.

## 4. Arquitectura

Un único archivo `SII-FODMAP.html`, sin CDNs ni librerías externas:

```
SII-FODMAP.html
├── <style>   CSS propio, mobile-first
├── <body>    Buscador + chips de categorías + filtro "solo seguros" + resultados + ficha
└── <script>
    ├── DATOS[]      array de alimentos (la base de datos)
    ├── normalizar() quita tildes/mayúsculas para búsqueda tolerante
    ├── buscar()     filtra por nombre + sinónimos + categoría + filtro seguros
    ├── render()     pinta lista de resultados y ficha de detalle
    └── init()       arranca la app y enlaza eventos
```

**Razón:** superficie de fallo mínima. Sin dependencias = nada que se caiga.
Funciona con doble clic, se comparte por WhatsApp/email y se instala en la pantalla
de inicio del móvil ("Añadir a pantalla de inicio").

## 5. Modelo de datos

Cada alimento es un objeto:

```js
{
  nombre: "Cebolla",
  sinonimos: ["cebolleta", "cebolla morada"],
  categoria: "Verduras",
  nivel: "rojo",                 // "verde" | "amarillo" | "rojo"
  racion_segura: "Evitar en fase 1. Usa la parte verde de la cebolleta.",
  fodmap: ["Fructanos"],         // [] si es verde sin matices
  alternativas: ["Parte verde de cebolleta", "Cebollino", "Aceite infusionado"],
  consejo: "El sofrito suelta fructanos al aceite; mejor aceite de oliva infusionado y retirar la cebolla.",
  fuente: "Monash FODMAP / Noisy Guts"
}
```

Categorías previstas: Verduras, Frutas, Lácteos, Cereales y pan, Proteínas (carne/pescado/huevo),
Legumbres, Frutos secos y semillas, Bebidas, Condimentos/otros, Dulces/snacks.

## 6. Interfaz (mobile-first)

- **Principal:** barra de búsqueda grande arriba, chips de categorías, filtro "solo seguros 🟢".
- **Resultados:** tarjetas con nombre + semáforo grande y color de fondo, legibles de un vistazo.
- **Ficha:** semáforo, ración segura, FODMAP responsable, alternativas (si 🔴/🟡), consejo, fuente.
- **Búsqueda tolerante:** ignora mayúsculas/tildes y entiende sinónimos ("patata"/"papa").
- **Aviso global visible:** "Información orientativa basada en fuentes públicas fiables.
  No sustituye a tu dietista. Las cantidades exactas dependen de cada persona."

## 7. Manejo de errores y robustez

- Búsqueda sin resultados → mensaje útil, no pantalla vacía.
- JS defensivo: un dato mal formado no rompe la app entera.
- Contraste y tamaños accesibles (uso en el súper, una mano).
- Sin estado externo: nada de localStorage obligatorio para la función básica.

## 8. Verificación (antes de dar por terminado)

- Abrir el HTML y probar búsquedas reales: cebolla, ajo, plátano, pan, leche, manzana, arroz, zanahoria.
- Probar filtros, categorías y filtro "solo seguros".
- Revisar que cada alimento tenga todos sus campos completos y coherentes (semáforo ↔ FODMAP ↔ ración).
- Comprobar legibilidad en viewport de móvil.

## 9. Fuera de alcance (v1)

- Diario de síntomas, planificador de reintroducción (fases 2-3), favoritos/listas de compra.
- Datos de laboratorio con gramos exactos certificados.
- Sincronización en la nube o cuentas de usuario.
