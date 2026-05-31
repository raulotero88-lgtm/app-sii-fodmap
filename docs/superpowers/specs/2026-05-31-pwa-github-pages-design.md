# Diseño: PWA + GitHub Pages

**Fecha:** 2026-05-31
**Estado:** aprobado

## Objetivo

Publicar la app SII/FODMAP en GitHub Pages como PWA para que Laura la instale en su móvil y reciba actualizaciones automáticas sin necesidad de que Raúl le pase el archivo HTML manualmente.

## Estructura de archivos resultante

```
index.html          ← SII-FODMAP.html renombrado
manifest.json       ← metadatos PWA (nombre, iconos, colores)
sw.js               ← service worker (caché offline + detección de updates)
icons/
  icon-192.png      ← icono pantalla de inicio (192×192)
  icon-512.png      ← icono splash screen (512×512)
```

## Despliegue — GitHub Pages

- Repositorio público en GitHub.
- GitHub Pages configurado sobre la rama `master`, carpeta raíz.
- Sin GitHub Actions ni paso de build: cada `git push` despliega en ~1 minuto.
- URL: `https://<usuario>.github.io/<nombre-repo>/`
- Flujo de trabajo: editar `index.html` → `git commit` → `git push` → URL actualizada.

## Service Worker

**Caché offline:**
En la primera visita descarga y almacena: `index.html`, `manifest.json`, `sw.js`, `icons/icon-192.png`, `icons/icon-512.png`. A partir de ahí la app funciona sin conexión.

**Estrategia fetch:** cache-first. Sirve siempre desde caché (respuesta instantánea). En cada apertura comprueba en segundo plano si hay versión nueva en el servidor.

**Detección de updates:** el SW tiene una constante `VERSION` en la primera línea (ej. `'v1'`). Al publicar mejoras, esa constante se incrementa. El navegador detecta que `sw.js` cambió, descarga el nuevo SW, lo deja en estado "waiting" y notifica a la página.

**Gestión de caché:** en cada activación se eliminan las cachés de versiones anteriores para no acumular espacio.

## Banner de actualización

Aparece en la parte inferior de la pantalla (zona pulgar) solo cuando hay un SW en espera.

```
┌─────────────────────────────────────────────┐
│ 🔄 Nueva versión disponible                  │
│ Tus datos NO se perderán al actualizar.      │
│                          [Actualizar ahora]  │
└─────────────────────────────────────────────┘
```

- Fondo verde, texto blanco.
- "Actualizar ahora": llama a `skipWaiting()` en el SW en espera y recarga la página.
- Los datos de `localStorage` no se tocan en ningún momento del proceso.

## Manifest

```json
{
  "name": "App SII / FODMAP",
  "short_name": "SII FODMAP",
  "description": "Buscador de alimentos y guía de reintroducción FODMAP",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2ecc71",
  "lang": "es",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Iconos

Generados mediante un script Node.js incluido en el repo (`generate-icons.js`) que usa `canvas`. El icono es fondo verde (`#2ecc71`) con las letras `SII` en blanco. Script de un solo uso: se ejecuta una vez y los PNGs se commitean al repo.

Alternativa sin Node.js: script Python con `Pillow` si Node no está disponible.

## Cambios en index.html

Solo dos líneas nuevas en `<head>`:

```html
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icons/icon-192.png">
```

Y una línea al final del `<body>` para registrar el SW y escuchar el evento de update:

```html
<script>
  // Registro SW + lógica del banner de actualización
</script>
```

## Flujo completo para Laura

1. Raúl le envía la URL por primera vez.
2. Laura abre la URL en Chrome Android → el navegador propone "Añadir a pantalla de inicio".
3. La app queda instalada con icono propio, sin barra del navegador.
4. Cuando Raúl publica una mejora y hace push, en la próxima apertura aparece el banner.
5. Laura pulsa "Actualizar ahora" → nueva versión cargada, datos intactos.

## Privacidad

Los datos del diario (síntomas, notas, configuración) se almacenan exclusivamente en `localStorage` del dispositivo de Laura. El repositorio público solo contiene código, sin datos de ningún usuario.

## Tests

Los 59 tests existentes (`?test`) deben seguir pasando sin cambios tras el renombrado del archivo. El service worker no interfiere con la URL `?test`.
