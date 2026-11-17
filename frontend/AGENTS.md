# AGENTS.md — frontend

App Expo de AI Ticket It (React Native + React Native Paper + expo-router, JavaScript). Corre en Expo Go en el celular y en web para Cypress. Las reglas generales están en `../AGENTS.md`; acá solo lo propio del front.

## Expo cambió: no confiar en lo que recordás

Expo rompe APIs en cada SDK. Antes de escribir código que toque una API de Expo o React Native:

1. Mirar la versión mayor de `expo` en `package.json`.
2. Leer la documentación de esa versión: `https://docs.expo.dev/versions/v<mayor>.0.0/`.
3. Para el resto, `https://docs.expo.dev/llms.txt` (índice con correcciones a errores comunes de los LLM).

- Instalar paquetes **siempre** con `npx expo install <paquete>` (resuelve versiones compatibles con el SDK).
- Expo Go solo trae sus módulos nativos: no sumar librerías con código nativo propio.
- No hay `ios/` ni `android/`: la configuración nativa va en `app.json`.

## Estructura

```
src/app/             expo-router (rutas = archivos); solo importa de src/pantallas
  (auth)/login.jsx
  (comprador)/       tabs del comprador
  (organizador)/     tabs del organizador
  eventos/[id]/...  compras/[id]/...
src/pantallas/       UI y lógica de cada pantalla + su test
src/api/             cliente.js (axios + token + mensajeDeError), <recurso>Api.js, socket.js, imagenes.js
src/auth/            AuthContext (useAuth), almacenamiento de sesión
src/components/      componentes compartidos (catálogo en la skill sistema-diseno)
src/hooks/           hooks (useCargar, useEnvio, useListaPaginada, useSalaDeCompra…)
src/navegacion/      pestañas y helpers de navegación
src/tema/            tema Paper + tokens (espaciado, estados)
src/test-utils/      helpers de test (renderConProviders, fixtures, mockRouter)
```

## Reglas

- Solo componentes de **React Native Paper** (y primitivas RN para layout). Colores y espaciados desde el tema (`useTheme()` / `src/tema`), nunca hex sueltos.
- Las pantallas nunca llaman axios/fetch: siempre `src/api/<recurso>Api.js`.
- El usuario sale de `useAuth()`.
- Cada pantalla maneja estados: cargando, error, vacío, enviando, éxito.
- Todo elemento interactivo o verificable tiene `testID` (Cypress lo ve como `data-testid`) y `accessibilityLabel` si es solo ícono.
- Scrolls de pantallas con encabezado nativo: `contentInsetAdjustmentBehavior="automatic"` (iOS 26 tiene encabezado translúcido).
- URL del back: `EXPO_PUBLIC_API_URL` (en el celular, IP LAN de la PC, no `localhost`). Las imágenes relativas del back se resuelven con `urlDeImagen`.
- Antes de crear un componente, buscar si ya existe uno en `src/components/` o un hook en `src/hooks/`.

## Comandos

```bash
npx expo start          # QR para Expo Go
npx expo start --web
npm test
npx expo lint
```
