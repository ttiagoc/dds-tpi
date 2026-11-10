---
name: tiempo-real-socket
description: Usar al implementar o tocar el chat en tiempo real de la compra de AI Ticket It (Socket.io en el backend Express y socket.io-client en la app Expo). Define auth del handshake, rooms, eventos y el patrón "REST para escribir, socket para notificar".
---

# Tiempo real con Socket.io

Decisión y razones: `docs/decisiones/ADR-005-socket-io-chat.md`. Eventos: sección Socket.io de `planes/03-api-contratos.md` (no agregar eventos que no estén ahí).

## Principio

**Escribir por REST, notificar por socket.** `POST /compras/:id/mensajes` valida, chequea permisos, persiste y responde. Recién después el service llama a `notificador.mensajeNuevo(compraId, mensaje)`. El socket nunca persiste ni decide reglas.

## Backend

### Notificador inyectable

```js
export const notificadorNulo = { mensajeNuevo() {}, estadoCompra() {} };

export function crearNotificadorSocket(io) {
  return {
    mensajeNuevo: (compraId, mensaje) => io.to(`compra:${compraId}`).emit("mensaje:nuevo", mensaje),
    estadoCompra: (compraId, estado) => io.to(`compra:${compraId}`).emit("compra:estado", { compraId, estado }),
  };
}
```

`CompraService` recibe `notificador` por constructor (default `notificadorNulo`) → los tests de service no necesitan socket: se pasa `{ mensajeNuevo: jest.fn() }` y se verifica la llamada.

### Servidor (`src/sockets/chatSocket.js`)

```js
export function registrarChat(io, { authService, compraService }) {
  io.use((socket, next) => {
    try {
      socket.data.usuario = authService.verificarToken(socket.handshake.auth?.token);
      next();
    } catch {
      next(new Error("No autenticado"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("compra:unirse", async ({ compraId }, ack) => {
      try {
        await compraService.verificarParticipante(compraId, socket.data.usuario);
        socket.join(`compra:${compraId}`);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });
    socket.on("compra:salir", ({ compraId }) => socket.leave(`compra:${compraId}`));
  });
}
```

`server.js`: `const httpServer = http.createServer(app); const io = new Server(httpServer, { cors: { origin: "*" } });` y el contenedor recibe `crearNotificadorSocket(io)`.

### Tests
- Service: notificador mock, verificar que se llama **solo** si se persistió.
- Socket (integración): `socket.io-client` contra el server en puerto efímero (`listen(0)`): token inválido → `connect_error`; no participante → ack `ok:false`; participante recibe `mensaje:nuevo` tras el POST.

## Frontend

### `src/api/socket.js`
```js
import { io } from "socket.io-client";
export function conectarSocket(token) {
  return io(process.env.EXPO_PUBLIC_API_URL, { auth: { token }, transports: ["websocket"] });
}
```

### `src/hooks/useChatCompra.js`
- Carga historial con `GET /compras/:id/mensajes`.
- Conecta, emite `compra:unirse`, escucha `mensaje:nuevo` y lo agrega **si no está ya** (dedupe por `id`, porque el emisor también lo recibe por REST).
- Expone `{ mensajes, enviar, enviando, conectado, error }`.
- Cleanup en el `return` del `useEffect`: `compra:salir`, `off`, `disconnect`.
- Si `conectado === false`, la pantalla muestra un aviso discreto y permite refrescar a mano.

## Probar a mano
Dos sesiones: celular (comprador) + web (organizador) en la misma compra; mensaje de uno aparece en el otro sin refrescar.
