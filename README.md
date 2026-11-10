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
npm run e2e            # desde la raíz, con back y web levantados
```

### Docker (solo back)

```bash
docker build -t ai-ticket-it-back ./backend
docker run -p 3000:3000 --env-file backend/.env ai-ticket-it-back
```

## Usuarios de demo

Se definen en `backend/src/seeds/datos.js` (ver It1).

## Documentación del proceso

- `planes/`: planes de desarrollo.
- `specs/`: especificación de cada feature.
- `docs/decisiones/`: ADRs.
- `docs/ia/bitacora.md`: bitácora de uso de IA.
- `.claude/skills/`: skills creadas para guiar a la IA.
