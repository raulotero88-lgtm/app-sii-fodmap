# Publicación en Google Play — estado y cómo retomar

Documento para continuar el proceso de publicación desde cualquier PC o sesión.
Última actualización: **2026-06-09**.

## Decisiones fijas (no cambiar)
- **Dominio / hogar de la app:** https://puedocomerlo.com (registrado en GoDaddy; DNS gestionado por Cloudflare).
- **Cuenta Play:** personal, a nombre del titular. Monetización: **gratis + donación** (sin pagos in-app).
- **Package name (identidad PERMANENTE de la app):** `com.puedocomerlo.twa`
- **Huella clave de subida (SHA-256):** `D0:F1:2D:75:DF:DD:91:B8:0A:74:7E:3B:77:DD:4F:FA:BA:06:D5:97:5E:12:02:16:00:48:96:8A:AA:7C:4E:64`

## Cómo está montado
- **Código:** este repositorio de GitHub (`raulotero88-lgtm/app-sii-fodmap`).
- **Rama que se publica:** `master`. Cloudflare (Worker `app-sii-fodmap`) y github.io sirven `master`. → **Trabaja en `master`.**
- **Web en producción:** Cloudflare Worker de activos estáticos sirve `puedocomerlo.com` (apex + www, HTTPS). Las URL `.workers.dev` y de previsualización están apagadas.
- **Verificación app↔web:** `.well-known/assetlinks.json` publicado y validado por Google.
- **App de Laura:** sigue en https://raulotero88-lgtm.github.io/app-sii-fodmap/ (misma rama `master`), sin cambios visibles (SW v10 intacto).

## Fuera de Git (NO subir nunca al repo)
- 🔐 **El `.zip` de PWABuilder con la CLAVE DE FIRMA** (`signing.keystore` + contraseñas) y el **`.aab`**.
  Guardado por el titular en almacenamiento seguro (ej. Google Drive). **Es secreto y crítico:** se necesita
  para actualizar la app. NUNCA va en GitHub.

## Hecho ✅
- Fase 1: icono (tripa sonriente), manifest optimizado, política de privacidad (`/privacidad`).
- Fase 2: dominio + HTTPS + www en Cloudflare.
- Fase 3: cuenta Google Play creada (pendiente verificación de identidad).
- Fase 4: `.aab` construido (PWABuilder) + `assetlinks.json` publicado y validado por Google.

## Próximos pasos ⏭️
1. **(Esperando)** verificación de identidad de la cuenta Play.
2. **5.1** Crear la app en Play Console: nombre `¿Puedo comerlo? FODMAP/SII`, es-ES, App, Gratis.
3. **5.2** Subir el `.aab` a **pruebas internas** → obtener la **clave de firma de Google** (Play App Signing)
   y **añadir su huella SHA-256** al `.well-known/assetlinks.json` (2ª huella). Probar en un móvil real.
4. **5.3** Rellenar fichas obligatorias: ficha de tienda, capturas, gráfico 1024×500, clasificación de edad,
   seguridad de datos (declarar "no se recogen datos"), declaración de app de salud, política de privacidad
   (URL: https://puedocomerlo.com/privacidad).
5. **6** Prueba cerrada con **12 testers durante 14 días** (requisito de cuentas personales nuevas) → producción.

## Cómo retomar desde otro PC
1. `git clone https://github.com/raulotero88-lgtm/app-sii-fodmap.git` → quedas en la rama `master` (la buena).
2. Si necesitas actualizar la app, recupera el `.zip` con la clave de firma desde tu Drive.
3. Lee este archivo para saber en qué punto estás.
