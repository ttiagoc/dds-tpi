# Spec 08 — Chat de la compra (REST)

- **Estado:** aprobada
- **Rama:** `feature/chat-rest`
- **Casos de uso:** CU5 (el comprador envía mensajes de una compra), CU6 (el organizador responde)
- **Iteración:** It3
- **Depende de:** spec 02 (`Compra.participa`, `Compra.agregarMensaje`, `Mensaje`), spec 06 (`CompraDetalle`, permisos de la compra)
- **Sigue en:** spec 08b (notificación por socket)

## Contexto
Cada compra tiene un chat entre el comprador y el organizador del evento, para consultas de acceso, horarios o problemas con la entrada. Esta spec cubre leer y escribir mensajes por REST. La notificación en vivo es la spec 08b ("REST para escribir, socket para notificar", ADR-005).

## Historias
- Como comprador, quiero enviar mensajes en cualquier momento sobre una compra (CU5).
- Como organizador, quiero responder en cualquier momento los mensajes de una compra de mi evento (CU6).
- Como participante, quiero ver la conversación completa en orden.

## Reglas de negocio
Aplica R7 de `planes/02-dominio.md`.

- **RC1** Los dos endpoints usan `autenticar` (🔐, cualquier rol): sin token → 401 "Necesitás iniciar sesión".
- **RC2** Orden de chequeos:
  1. id inválido → 400 "El id debe ser un entero positivo";
  2. (solo POST) body inválido → 400 (lo corta `validate` antes del controller);
  3. compra inexistente → 404 "No existe la compra";
  4. el usuario no participa (`compra.participa(usuario.id)` falso) → 403 "No tenés permiso para realizar esta acción".
- **RC3** Body de POST `.strict()`: `{ mensaje }` string de 1 a 500 caracteres después de quitar espacios de los costados. Vacío, solo espacios, más de 500, no string o campo de más → 400.
- **RC4** Se puede escribir en cualquier estado de la compra (PENDIENTE, CONFIRMADA, CANCELADA, REEMBOLSADA, UTILIZADA) y aunque el evento ya haya ocurrido (R7).
- **RC5** POST: `compra.agregarMensaje(usuario, texto, ahora)` con `ahora = reloj.ahora()`, se guarda la compra y responde 201 con el mensaje. El autor toma `{ id, nombre, rol }` del usuario en ese momento (snapshot).
- **RC6** GET responde 200 con un array sin paginar, en orden cronológico (`enviado` asc, después `id` asc). Sin mensajes → `[]`.
- **RC7** Forma del mensaje (igual en GET, POST y en el socket de la 08b): `{ id, usuario: { id, nombre, rol }, mensaje, enviado }`, `enviado` en ISO 8601 UTC.

## Contrato de API (completa `planes/03`)
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| GET | `/compras/:id/mensajes` | 🔐 participante | — | 200 `[Mensaje]` | 400, 401, 403, 404 |
| POST | `/compras/:id/mensajes` | 🔐 participante | `{ mensaje }` 1-500 `.strict()` | 201 `Mensaje` | 400, 401, 403, 404 |

Cambios en `planes/03`: se suman 400 y 401 a los errores, el orden y la forma de `Mensaje`.

Diseño:
- `MensajeService` nuevo (`compraRepository`, `usuarioRepository`, `reloj`, `notificador`):
  - `listar(compraId, usuario)` y `enviar(compraId, { mensaje }, usuario)`;
  - reutiliza `buscarCompra` y `exigirPermiso` de `services/compras.js`;
  - `toResponse(mensaje)`;
  - en esta rama `notificador` tiene default `notificadorNulo`; la 08b lo conecta al socket.
- `MensajeController` (`extends BaseController`) con `listar` y `enviar`.
- Rutas en `CompraRoutes`: `GET /:id/mensajes` y `POST /:id/mensajes` con `autenticar` (+ `validate(crearMensajeValidation)` en el POST).
- `crearMensajeValidation` en `src/validations/`.
- Swagger: `src/docs/openapi/mensajes.js` (tag Chat) y las dos operaciones en la lista de `test/integration/swagger.test.js`.

## Pantallas
Ninguna (el chat del front es `feature/chat-front`, It4).

## Criterios de aceptación
```gherkin
Escenario: leer el chat de una compra
  Dado que estoy logueada como Ana
  Cuando hago GET /compras/<id de ana-primavera>/mensajes
  Entonces responde 200 con 2 mensajes en orden
  Y el primero es de Ana (rol COMPRADOR): "¿A qué hora abren las puertas?"
  Y el segundo es de Fénix (rol ORGANIZADOR): "Abrimos a las 17 h. ¡Los esperamos!"
  Y con Fénix logueado trae los mismos 2 mensajes
  Y una compra sin mensajes (ana-standup) trae []

Escenario: comprador y organizador escriben
  Cuando Ana hace POST /compras/<id de ana-primavera>/mensajes con { mensaje: "  ¿Hay guardarropas?  " }
  Entonces responde 201 con id 3, mensaje "¿Hay guardarropas?", usuario { nombre "Ana Pérez", rol COMPRADOR } y enviado = ahora
  Cuando Fénix responde "Sí, en la entrada"
  Entonces responde 201 con id 4
  Y GET trae los 4 mensajes en orden

Escenario: se puede escribir en cualquier estado
  Cuando Ana escribe en su compra CANCELADA (ana-hamlet), en la REEMBOLSADA (ana-basquet) y en la UTILIZADA de un evento pasado (ana-rock)
  Entonces las tres responden 201

Escenario: sin permiso o compra inexistente
  Cuando Bruno (comprador ajeno) o Konex (organizador de otro evento) hacen GET o POST en ana-primavera → 403 "No tenés permiso para realizar esta acción"
  Y sin token → 401
  Y con una compra inexistente → 404 "No existe la compra"
  Y con id "abc" → 400

Escenario: mensaje inválido
  Cuando Ana manda "", "   ", 501 caracteres, un número, sin el campo o con un campo de más → 400
  Y el chat no cambia
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit dominio | ya cubierto (`Mensaje`, `agregarMensaje`, `participa`); sumar que `agregarMensaje` funciona en compra CANCELADA si falta |
| Unit validación | `crearMensajeValidation`: trim, 1-500, `.strict()`, no string |
| Unit service | `MensajeService`: listar (404, 403, orden, `[]`, forma), enviar (404, 403, guarda la compra, `enviado = ahora`, snapshot del autor, llama `notificador.mensajeNuevo(compraId, respuesta)` solo si se guardó; no lo llama ante 403/404) |
| Unit controller | `MensajeController.listar` (200) y `enviar` (201); id inválido → 400 a `next`; errores a `next` |
| Integración | los 5 escenarios contra la app con el seed; Swagger lista las 2 operaciones nuevas |

## Fuera de alcance
- Editar o borrar mensajes, adjuntos, "leído/no leído", paginar el chat.
- Socket (spec 08b) y pantalla de chat (It4).

## Notas de IA
- El usuario eligió: lista completa sin paginar; partir la spec en 08 (REST) y 08b (socket).
- La IA agregó sin preguntar (revisable):
  - 400 de body antes que 404/403 (mismo criterio que la reseña, `validate` va antes del controller);
  - `MensajeService` aparte en vez de sumar métodos a `CompraService`;
  - trim del mensaje (ya lo hace `Mensaje` en el dominio);
  - 400 y 401 agregados a los errores de `planes/03`.
