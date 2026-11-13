# Spec 12 — Chat de la compra en la app

- **Estado:** aprobada
- **Rama:** `feature/chat-front`
- **Casos de uso:** CU5 (el comprador envía mensajes), CU6 (el organizador responde) (ver `planes/00-indice.md`)
- **Iteración:** It4
- **Depende de:** spec 08 (`GET/POST /compras/:id/mensajes`), spec 08b (Socket.io: `compra:unirse`, `compra:salir`, `mensaje:nuevo`, `compra:estado`), spec 10c (DetalleCompra), spec 11 (`catalogoAcciones.js`)

## Contexto

El back ya tiene el chat de cada compra por REST y lo notifica en vivo por Socket.io (specs 08 y 08b, ADR-005). Falta la pantalla: comprador y organizador entran al chat desde el detalle de la compra, leen la conversación, escriben y ven en vivo lo que manda la otra parte. Además, el detalle de la compra abierto se actualiza cuando la otra parte cambia el estado (por ejemplo, el organizador la marca utilizada).

## Historias

- Como comprador, quiero mandarle mensajes al organizador sobre mi compra en cualquier momento (CU5).
- Como organizador, quiero responder los mensajes de una compra de mi evento en cualquier momento (CU6).
- Como participante, quiero ver los mensajes de la otra parte sin refrescar y saber si perdí la conexión en vivo.
- Como participante, quiero que el detalle de la compra que tengo abierto muestre el estado nuevo cuando la otra parte lo cambia.

## Reglas de negocio

Sin reglas nuevas. Aplica R7 de `planes/02-dominio.md` (se escribe en cualquier estado de la compra y aunque el evento haya pasado), que valida el back. Patrón de ADR-005: **REST para escribir, socket para notificar**.

Reglas de la pantalla:

- **RC1 Acceso.** En DetalleCompra, botón "Chat" (`compra-chat`, ícono `chat-outline`, `mode="outlined"`) para los dos roles y en todos los estados, sin confirmación; abre `compras/[id]/chat` (título "Chat"). Se agrega como una entrada del catálogo `ACCIONES_COMPRA`:
  - las entradas pueden tener `ruta: (compra) => string` en vez de `pedir`: el botón navega con `router.push` en lugar de ejecutar;
  - `permiso` pasa a ser opcional: una entrada sin `permiso` se muestra siempre (el chat no tiene flag en `acciones` porque R7 lo permite en cualquier estado y quien ve el detalle ya es participante);
  - Reseñar deja de ser un botón aparte y pasa al catálogo como entrada con `ruta` y `permiso: "puedeReseniar"` (mismo testID `compra-resenar`);
  - mientras corre una acción, Chat y Reseñar también quedan deshabilitados.
- **RC2 Conexión.** Un socket por pantalla que lo usa: `io(EXPO_PUBLIC_API_URL, { auth: { token }, transports: ["websocket"] })`. Al conectar (y al reconectar) emite `compra:unirse { compraId }`; está "conectado" si el ack es `{ ok: true }`. Al salir de la pantalla emite `compra:salir`, saca los listeners y desconecta. El token sale de la sesión (`cliente.js` lo expone; las pantallas no lo manejan).
- **RC3 Conversación.** La pantalla carga la compra (`ConCompra`, que ya resuelve 403/404 como "no existe") y el historial con `GET /compras/:id/mensajes`. Encabezado con el evento de la compra. Burbujas en orden cronológico (`mensaje-<id>`): las propias (`usuario.id` = usuario logueado) a la derecha con el color primario y sin nombre; las de la otra parte a la izquierda con su nombre arriba. Cada burbuja muestra el texto y la fecha y hora cortas (`12/11 22:05`). Sin mensajes: "Todavía no hay mensajes" (`chat-vacio`). La lista baja al último mensaje al cargar y al llegar uno nuevo. Si el historial no carga, error con "Reintentar".
- **RC4 Escribir.** `TextInput` multilínea "Escribí un mensaje" (`chat-input`, `maxLength` 500, contador `n/500`) y botón Enviar (`chat-enviar`, `IconButton` `send` con `accessibilityLabel` "Enviar mensaje"), deshabilitado con el texto vacío o solo espacios. Envío con `useEnvio` (loading, sin doble pedido) de `POST /compras/:id/mensajes` con `{ mensaje }` sin espacios de los costados. Con el 201 el mensaje se agrega a la lista y el input se limpia.
- **RC5 Errores al escribir.** Cualquier error del envío se muestra con el texto de `mensajeDeError` en un `HelperText` arriba del input (`chat-error`), el texto queda en el input y el error se limpia al reintentar.
- **RC6 En vivo.** `mensaje:nuevo` agrega el mensaje si no está ya (dedupe por `id`: el autor lo recibe por el 201 y por el socket). La lista se mantiene ordenada por `enviado` y después `id`.
- **RC7 Sin conexión en vivo.** Mientras el socket no está conectado (no conectó, se cortó o el ack fue `ok: false`) se ve un aviso discreto "Sin conexión en vivo" (`chat-sin-conexion`) con "Actualizar" (`chat-actualizar`), que vuelve a pedir el historial. Escribir sigue andando por REST. Al reconectar se vuelve a unir al room, recarga el historial sola y el aviso desaparece.
- **RC8 Estado en vivo en DetalleCompra.** DetalleCompra también se une al room de la compra. Si llega `compra:estado` con un estado distinto del que muestra, recarga la compra (`GET /compras/:id`: estado, acciones e historial). Si es el mismo estado (la acción la hizo este usuario y ya se reemplazó con la respuesta), no hace nada. Sin aviso de conexión en esta pantalla.

## Contrato de API

Sin cambios. Usa tal cual `planes/03`:

| Función | Endpoint / evento |
| --- | --- |
| `comprasApi.listarMensajes(id)` | `GET /compras/:id/mensajes` → 200 `[Mensaje]` |
| `comprasApi.enviarMensaje(id, mensaje)` | `POST /compras/:id/mensajes` `{ mensaje }` → 201 `Mensaje` |
| `api/socket.conectarSocket()` | handshake con `auth.token`; `compra:unirse` (ack), `compra:salir`; escucha `mensaje:nuevo` y `compra:estado` |

## Pantallas

- **Chat** (`compras/[id]/chat`, ambos roles, `src/pantallas/chat/`): testIDs de RC3-RC7 y `lista-mensajes`. Lógica en `useChatCompra(compraId)` → `{ mensajes, cargando, error, recargar, enviar, enviando, errorEnvio, conectado }`.
- **Hook compartido** `hooks/useSalaDeCompra(compraId, eventos)` → `{ conectado }`: conecta, se une al room, registra los listeners de `eventos` y limpia al desmontar. Lo usan `useChatCompra` y DetalleCompra.
- **DetalleCompra**: botón `compra-chat` (RC1) y recarga por `compra:estado` (RC8).
- Dependencia: `socket.io-client` (ya está en `package.json`; se verifica la versión con `npx expo install`). En los tests se mockea a mano en `frontend/__mocks__/socket.io-client.js`, como `react-native-paper-dates`.

## Criterios de aceptación

```gherkin
Escenario: entrar al chat desde el detalle
  Dado que estoy logueada como Ana en el detalle de mi compra REEMBOLSADA
  Entonces veo "Chat" aunque no tenga otras acciones
  Cuando toco "Chat"
  Entonces voy a /compras/<id>/chat
  Y lo mismo pasa con Fénix en el detalle de una compra de su evento

Escenario: leer la conversación
  Dado que estoy logueada como Ana en el chat de ana-primavera
  Entonces veo "¿A qué hora abren las puertas?" a la derecha y sin nombre
  Y "Abrimos a las 17 h. ¡Los esperamos!" a la izquierda con "Fénix Producciones"
  Y en una compra sin mensajes veo "Todavía no hay mensajes"
  Y si el historial no carga, veo el error y "Reintentar" lo vuelve a pedir

Escenario: escribir un mensaje
  Dado que estoy en el chat con el input vacío
  Entonces "Enviar mensaje" está deshabilitado, también con solo espacios
  Cuando escribo "  ¿Hay guardarropas?  " y toco "Enviar mensaje"
  Entonces se envía POST /compras/<id>/mensajes con { mensaje: "¿Hay guardarropas?" }
  Y el mensaje aparece una sola vez, aunque también llegue por mensaje:nuevo
  Y el input queda vacío

Escenario: el envío falla
  Cuando toco "Enviar mensaje" y el back responde con error "No tenés permiso para realizar esta acción"
  Entonces veo ese texto sobre el input y mi mensaje sigue escrito

Escenario: recibir un mensaje en vivo
  Dado que Ana tiene abierto el chat de ana-primavera
  Cuando llega mensaje:nuevo de Fénix "Sí, en la entrada"
  Entonces aparece al final, a la izquierda, sin refrescar

Escenario: sin conexión en vivo
  Dado que el socket no conecta o el ack de compra:unirse es { ok: false }
  Entonces veo "Sin conexión en vivo" y "Actualizar" vuelve a pedir el historial
  Y puedo seguir escribiendo
  Cuando el socket conecta
  Entonces se une al room, recarga el historial y el aviso desaparece

Escenario: salir del chat
  Cuando salgo de la pantalla del chat
  Entonces se emite compra:salir y el socket se desconecta

Escenario: el detalle se actualiza con compra:estado
  Dado que Ana tiene abierto el detalle de su compra CONFIRMADA
  Cuando llega compra:estado { compraId, estado: "UTILIZADA" }
  Entonces la compra se vuelve a pedir y veo el estado nuevo
  Y si llega con el mismo estado que muestra, no se vuelve a pedir
```

8 escenarios.

## Plan de tests

| Nivel | Caso |
| --- | --- |
| Front (RNTL) hooks | `useSalaDeCompra`: conecta con el token y `transports: ["websocket"]`, emite `compra:unirse` al conectar y al reconectar, `conectado` según el ack y `disconnect`, registra y saca listeners, `compra:salir` + `disconnect` al desmontar. `useChatCompra`: historial ordenado, dedupe por `id` (201 + socket), orden al llegar uno, `enviar` con trim, `errorEnvio` y limpieza, recarga al reconectar |
| Front (RNTL) `Chat` | burbujas propias/ajenas (nombre solo en ajenas), vacío, error de carga con reintento, Enviar deshabilitado vacío/espacios, contador, body del POST, input limpio tras 201, doble toque un pedido (`promesaManual`), error con texto exacto sin perder lo escrito, mensaje en vivo, aviso sin conexión con Actualizar, compra inexistente (`ConCompra`) |
| Front (RNTL) `DetalleCompra` | `compra-chat` visible en todos los estados y para los dos roles, navega a `/compras/<id>/chat`; Reseñar sigue igual desde el catálogo; `compra:estado` distinto recarga, igual no |
| Front (RNTL) api/navegación | `listarMensajes` y `enviarMensaje` en `recursosApi.test.js`; `conectarSocket` arma la URL, el token y el transporte; `compras/[id]/chat` accesible para los dos roles |
| E2E (temporal, se borra) | Ana manda un mensaje en una compra y Fénix lo ve en su chat (login como Ana, mensaje, logout, login como Fénix) |

## Fuera de alcance

- Mandar mensajes por socket, "está escribiendo", leídos/no leídos, presencia, notificaciones push.
- Contador de mensajes nuevos en Mis compras o en el detalle.
- Paginar el historial (el back lo devuelve completo).
- Editar o borrar mensajes, adjuntos.
- Aviso de conexión en DetalleCompra.

## Notas de IA

- Preguntas a la IA, el usuario eligió las opciones recomendadas: el mensaje propio aparece con el 201 (no optimista); burbujas con texto y hora, nombre solo en las ajenas; aviso "Sin conexión en vivo" con Actualizar y recarga al reconectar; `maxLength` 500 con contador y Enviar deshabilitado con texto vacío.
- Ya decidido por el usuario antes de la spec: REST para escribir y socket para notificar, auth en el handshake y room `compra:<id>`; Chat como entrada de `catalogoAcciones.js` sin confirmación; ruta `compras/[id]/chat` para los dos roles; `compra:estado` actualiza el DetalleCompra abierto.
- La IA agregó sin preguntar (revisable):
  - entradas del catálogo con `ruta` y `permiso` opcional (sin `permiso` = siempre visible), y mover Reseñar al catálogo para no tener dos formas de declarar un botón;
  - un socket por pantalla (Chat y DetalleCompra pueden estar abiertas a la vez en el stack: con un socket compartido, el `compra:salir` del chat sacaría también al detalle del room);
  - DetalleCompra recarga solo si el estado que llega es distinto del que muestra (evita un pedido de más tras la acción propia);
  - el token se lee de `cliente.js` en vez de exponerlo en `useAuth`;
  - fecha y hora cortas en cada burbuja (`12/11 22:05`), `chat-vacio`, `lista-mensajes`, textos "Escribí un mensaje" y "Todavía no hay mensajes".
