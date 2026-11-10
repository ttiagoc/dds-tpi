# Spec 08b — Chat de la compra (Socket.io)

- **Estado:** implementada
- **Rama:** `feature/chat-socket`
- **Casos de uso:** CU5, CU6 (en vivo); extra: refresco del estado de la compra
- **Iteración:** It3
- **Depende de:** spec 08 (`MensajeService`, `notificador`), spec 04 (`AuthService.usuarioDesdeToken`), specs 06/06b (pagar, cancelar, marcar utilizada)

## Contexto
Con la spec 08 el chat funciona por REST. Esta spec hace que los participantes conectados reciban en vivo los mensajes nuevos y los cambios de estado de la compra. Patrón de ADR-005: **REST para escribir, socket para notificar**. El socket no persiste ni decide reglas.

## Historias
- Como participante de una compra, quiero ver en vivo los mensajes que manda la otra parte.
- Como comprador, quiero ver el estado de mi compra actualizado cuando el organizador la marca utilizada (y viceversa al pagar o cancelar).

## Reglas de negocio
Aplica R7 de `planes/02-dominio.md`.

- **RS1** Socket.io en el mismo puerto que la API, `cors: { origin: "*" }`.
- **RS2** Handshake: `io(API_URL, { auth: { token } })`. Se valida con `authService.usuarioDesdeToken(token)`. Sin token, token inválido o vencido, o usuario inexistente → `connect_error` con `message: "No autenticado"`. El usuario queda en `socket.data.usuario`.
- **RS3** `compra:unirse { compraId }` con ack:
  - `compraId` no entero positivo → `{ ok: false, error: "El id debe ser un entero positivo" }`;
  - compra inexistente → `{ ok: false, error: "No existe la compra" }`;
  - no participa → `{ ok: false, error: "No tenés permiso para realizar esta acción" }`;
  - si no, se une al room `compra:<id>` y `{ ok: true }`. Unirse dos veces no duplica la entrega;
  - cualquier otro error (inesperado) se loguea y responde `{ ok: false, error: "No se pudo unir al chat" }`.
- **RS4** `compra:salir { compraId }` deja el room (el id se normaliza igual que en `compra:unirse`); sin ack, sin error si no estaba o si el id es inválido.
- **RS5** `mensaje:nuevo`: después de persistir un `POST /compras/:id/mensajes`, se emite al room `compra:<id>` **completo, incluido el autor** (el front deduplica por `id`). Payload = la misma forma que el 201 del REST.
- **RS6** `compra:estado { compraId, estado }`: después de persistir pagar, cancelar o marcar utilizada, **un solo evento con el estado final** (cancelar una CONFIRMADA emite `REEMBOLSADA`, no `CANCELADA`). No se emite al crear la compra ni si la acción falla (403, 404, 422).
- **RS7** La notificación nunca cambia la respuesta REST: si nadie está en el room, el endpoint responde igual, y si el emit falla se loguea sin propagar el error.

## Contrato (completa `planes/03`, sección Socket.io)
| Dirección | Evento | Payload | Notas |
|---|---|---|---|
| cliente → server | `compra:unirse` | `{ compraId }` | ack `{ ok: true }` o `{ ok: false, error }` con los mensajes de RS3 |
| cliente → server | `compra:salir` | `{ compraId }` | |
| server → room `compra:<id>` | `mensaje:nuevo` | `Mensaje` | a todo el room, incluido el autor |
| server → room `compra:<id>` | `compra:estado` | `{ compraId, estado }` | tras pago, cancelación o uso; un evento con el estado final |

Swagger: OpenAPI no modela sockets, así que los eventos van en la `description` del tag Chat (`src/docs/openapi/mensajes.js`) y una línea en la de pago, cancelación y uso.

Diseño:
- `src/sockets/notificador.js`: `notificadorNulo` y `crearNotificadorSocket(io)` (`mensajeNuevo(compraId, mensaje)`, `estadoCompra(compraId, estado)`).
- `src/sockets/chatSocket.js`: `registrarChat(io, { authService, mensajeService })` con el middleware del handshake y los handlers de RS3/RS4. `mensajeService.verificarParticipante(compraId, usuario)` reutiliza `buscarCompra` + `exigirPermiso`.
- `CompraService` recibe `notificador` (default `notificadorNulo`) y en `accion()` llama `estadoCompra` después de `guardar`.
- `crearContenedor({ notificador })` lo inyecta en `CompraService` y `MensajeService`.
- `src/servidor.js`: `crearServidor({ entorno, reloj })` arma `http.Server` + `io` + contenedor (con `crearNotificadorSocket(io)`) + app y registra el chat. El handler HTTP se pasa a `http.createServer` y delega en la app: Socket.io tiene que envolverlo al adjuntarse, si no Express atiende `/socket.io/` (polling) con 404. Lo usan `server.js` y los tests de socket (puerto efímero con `listen(0)`).

## Pantallas
Ninguna (el hook `useChatCompra` y la pantalla Chat son It4).

## Criterios de aceptación
```gherkin
Escenario: dos clientes reciben el mensaje en vivo
  Dado el servidor levantado en un puerto efímero
  Y Ana y Fénix conectados por socket y unidos a compra:<id de ana-primavera> (ack ok true)
  Cuando Ana hace POST /compras/<id>/mensajes con "¿Hay guardarropas?"
  Entonces Fénix y Ana reciben mensaje:nuevo con id 3 y la misma forma que el 201

Escenario: handshake sin autenticar
  Cuando me conecto sin token, con un token inválido o de un usuario inexistente
  Entonces recibo connect_error "No autenticado"

Escenario: unirse a un room sin permiso
  Cuando Bruno se une a la compra de Ana → ack { ok: false, error: "No tenés permiso para realizar esta acción" }
  Y a una compra inexistente → "No existe la compra"; con compraId "abc" → "El id debe ser un entero positivo"
  Y cuando Ana escribe, Bruno no recibe mensaje:nuevo

Escenario: cambios de estado en vivo
  Dado Ana y Fénix unidos a ana-piojos (PENDIENTE, evento de Fénix)
  Cuando Ana paga → ambos reciben compra:estado { compraId, estado: "CONFIRMADA" }
  Dado Ana y Konex unidos a ana-standup (CONFIRMADA)
  Cuando Ana cancela → reciben un único compra:estado con "REEMBOLSADA"
  Cuando Fénix marca utilizada ana-primavera → compra:estado "UTILIZADA"
  Y si la acción falla (por ejemplo pagar dos veces → 422) no se emite nada

Escenario: salir del room
  Cuando Fénix emite compra:salir y Ana escribe
  Entonces Fénix no recibe mensaje:nuevo y Ana sí
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit notificador | `crearNotificadorSocket` con un `io` fake: room y evento correctos |
| Unit service | `CompraService`: pagar/cancelar/marcar utilizada llaman `estadoCompra(compraId, estadoFinal)` una vez; no lo llaman ante 403/404/422. `MensajeService.verificarParticipante`: 404 y 403 |
| Integración socket | `socket.io-client` contra `crearServidor` en `listen(0)`: los 5 escenarios. Helper `test/helpers/socketDePrueba.js` (conectar con token, unirse con ack, esperar evento con timeout, verificar que **no** llega) |
| Integración | suites HTTP existentes sin cambios (notificador nulo por defecto) |

## Fuera de alcance
- Enviar mensajes por socket (`mensaje:enviar`), "está escribiendo", leídos, presencia.
- Reconexión y reenvío de mensajes perdidos (el front recarga por REST al reconectar, It4).
- Notificar compras nuevas o reseñas.

## Notas de IA
- Error de la IA detectado en la prueba manual del `server.js`: el diseño original (`servidor.on("request", app)` después de crear `io`) dejaba que Express respondiera 404 a `/socket.io/` en long-polling y el server se caía con `ERR_HTTP_HEADERS_SENT`. Los tests no lo vieron porque usaban solo `websocket`. Se agregó un test de regresión con `polling` y se corrigió el diseño.
- La revisión agregó: notificación que no rompe el REST si el emit falla, el error genérico del ack, `compra:salir` normalizado y los casos de token vencido, salir sin unirse y room vacío.
- El usuario eligió: un solo `compra:estado` con el estado final; `mensaje:nuevo` a todo el room incluido el autor.
- La IA agregó sin preguntar (revisable):
  - mensajes de error del ack (reutiliza los del REST);
  - `crearServidor` compartido entre `server.js` y los tests;
  - `verificarParticipante` en `MensajeService` (la skill lo ubicaba en `CompraService`);
  - no emitir `compra:estado` al crear la compra (todavía nadie puede estar en el room).
