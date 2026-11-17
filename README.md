# AI Ticket It

Plataforma de publicación de eventos y venta de entradas. TP individual de Desarrollo de Software (UTN FRBA, 2C 2026), desarrollado con IA como herramienta principal.

- **Back**: Node + Express 5 (ESM), persistencia en memoria, JWT, Socket.io, Swagger en `/api-docs`.
- **Front**: React Native + Expo (Expo Go), React Native Paper, expo-router.
- **Tests**: Jest + supertest, jest-expo + React Native Testing Library, Cypress (Expo Web).

> Estado: en construcción. Ver `planes/00-indice.md`.

## Requisitos

- Node 20+ (desarrollado con Node 24).
- App **Expo Go** en el celular, en la misma red Wi-Fi que la PC.

## Cómo correrlo

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev            # http://localhost:3000, siembra datos de demo
```

Swagger: http://localhost:3000/api-docs

### Frontend (celular)

```bash
cd frontend
cp .env.example .env   # EXPO_PUBLIC_API_URL=http://<IP-LAN-de-la-PC>:3000
npm install
npx expo start         # escanear el QR con Expo Go
```

La IP LAN se ve con `ipconfig` (Windows). `localhost` no funciona desde el celular.

### Frontend (web)

```bash
cd frontend && npx expo start --web
```

### Tests

```bash
cd backend && npm test
cd frontend && npm test
npm run e2e:servidores # terminal 1: back (NODE_ENV=test) + web
npm run e2e            # terminal 2, desde la raíz
```

### Docker (solo back)

```bash
docker build -t ai-ticket-it-back ./backend
docker run -p 3000:3000 -e JWT_SECRET=<secreto> ai-ticket-it-back
# o con un archivo: docker run -p 3000:3000 --env-file backend/.env ai-ticket-it-back
```

Ojo: `.env.example` trae `NODE_ENV=development`, que pisa el `production` de la imagen. Para correrla en producción usá `-e JWT_SECRET=…` o sacá `NODE_ENV` del `.env`.

La imagen (`node:24-alpine`) corre como usuario `node`, con `NODE_ENV=production` y un `HEALTHCHECK` contra `GET /healthcheck`. Sin `JWT_SECRET` no arranca. Los datos viven en memoria y se re-siembran en cada arranque.

E2E contra el contenedor:

```bash
docker run -p 3000:3000 -e NODE_ENV=test ai-ticket-it-back
# otra terminal (PowerShell)
cd frontend; $env:EXPO_PUBLIC_API_URL="http://localhost:3000"; npx expo start --web
# otra terminal
npm run e2e
```

## Usuarios de demo

Se definen en `backend/src/seeds/datos.js` (ver It1).

## Documentación del proceso

- `planes/`: planes de desarrollo.
- `specs/`: especificación de cada feature.
- `docs/decisiones/`: ADRs.
- `docs/ia/bitacora.md`: bitácora de uso de IA.
- `.claude/skills/` (transversales) y `backend/`, `frontend/`, `e2e/.claude/skills/` (por parte): skills creadas para guiar a la IA.
- `AGENTS.md` en la raíz y en cada parte: reglas para agentes de IA (`CLAUDE.md` las importa).
