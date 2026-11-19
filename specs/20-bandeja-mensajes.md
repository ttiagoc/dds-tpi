# Spec 20 — Bandeja de mensajes con no leídos

- **Estado:** implementada
- **Rama:** `feature/bandeja-mensajes`
- **Casos de uso:** CU5, CU6 (ver `planes/00-indice.md`)
- **Iteración:** It5b (rediseño)
- **Depende de:** spec 08/08b (chat), spec 12 (Chat en la app), spec 18 (paginación del chat), spec 19 (pestañas con badge)

## Contexto
Hoy el chat solo se abre desde cada compra. El organizador tiene que entrar evento por evento y compra por compra para saber si alguien le escribió, y nadie se entera de un mensaje si no tiene ese chat abierto. Se agrega una pestaña "Mensajes" para los dos roles con las conversaciones recientes y un contador de no leídos que se actualiza en vivo.

## Historias
- Como organizador, quiero ver en un solo lugar las conversaciones de las compras de mis eventos, primero la más reciente.
- Como comprador, quiero lo mismo para mis compras.
- Como participante, quiero un número en la pestaña con los mensajes que todavía no leí, que se actualice sin refrescar.

## Reglas de negocio
- **R11 Lectura del chat** (nueva, va a `planes/02-dominio.md`). Cada participante de una compra tiene una marca "leído hasta" (id de mensaje, 0 si nunca leyó). Los no leídos de un participante son los mensajes **de la otra parte** con `id` mayor a su marca. Al enviar un mensaje, la marca del autor avanza hasta ese mensaje. Marcar como leído lleva la marca al último mensaje de la compra. Solo participantes (R7, 403).
- **R12 Conversaciones** (nueva). Una conversación es una compra con al menos un mensaje en la que participa el usuario: para el COMPRADOR, sus compras; para el ORGANIZADOR, las compras de sus eventos. Se ordenan por fecha del último mensaje desc, desempate `compraId` desc.

## Contrato de API
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| GET | `/usuarios/yo/conversaciones` | 🔐 | `page, limit` | 200 `{ conversaciones: [Conversacion], total, page, totalPages, totalNoLeidos }` | 400, 401 |
| PUT | `/compras/:id/mensajes/leidos` | 🔐 participante | — | 204 (idempotente) | 400, 401, 403, 404 |

`Conversacion = { compraId, estado, evento: { id, nombre, imagen }, contraparte: { id, nombre }, ultimoMensaje: Mensaje, noLeidos }`. `totalNoLeidos` suma los no leídos de **todas** las conversaciones del usuario (no solo de la página): el badge lo pide con `limit=1`.

Socket:
| Dirección | Evento | Payload | Notas |
|---|---|---|---|
| server → room `usuario:<id>` | `conversacion:actualizada` | `{ compraId, ultimoMensaje, noLeidos }` | Al conectar, el server une cada socket a `usuario:<id>` sin evento del cliente. Tras `POST /compras/:id/mensajes` se emite a la otra parte con sus `noLeidos` de esa compra. |

## Pantallas
- **Pestaña Mensajes** en `(comprador)` y `(organizador)` (`tab-mensajes`), entre la segunda pestaña y Perfil, con `tabBarBadge` = `totalNoLeidos` (sin badge en 0, "99+" desde 100).
- **Contexto `NoLeidos`** (`src/mensajes/NoLeidosContext.jsx`) dentro de la sesión: pide `totalNoLeidos` al iniciar sesión y cuando la app vuelve a primer plano, mantiene un socket propio que escucha `conversacion:actualizada` y vuelve a pedir el total, y expone `refrescar()`.
- **Pantalla Mensajes** (`pantallas/mensajes/Mensajes.jsx`, rutas `(comprador)/mensajes` y `(organizador)/bandeja`, porque dos rutas con el mismo nombre en grupos distintos chocan, como pasó con Perfil; el testID de la pestaña es `tab-mensajes` en los dos): `ListaPaginada` de conversaciones (`lista-conversaciones`, `conversacion-<compraId>`). Cada fila: foto del evento con las iniciales de la contraparte, nombre de la contraparte, evento y número de compra, vista previa del último mensaje (con "Vos: " si es propio), hora relativa (hora si es hoy, "Ayer", día de la semana o fecha corta) y badge con `noLeidos`. Las filas con no leídos van en negrita. Toca → `compras/[id]/chat`. Recarga al volver y al llegar `conversacion:actualizada`. Vacío: "Todavía no tenés mensajes" (`sin-conversaciones`).
- **Chat**: al abrir y al llegar un `mensaje:nuevo` de la otra parte, llama a `PUT .../leidos` y después a `refrescar()` del contexto. Si el PUT falla, no muestra error (el badge se corrige en la próxima carga).

## Criterios de aceptación
```gherkin
Escenario: el organizador ve una conversación nueva
  Dado que Ana le escribe a Fénix en una compra de su evento
  Cuando Fénix abre la pestaña Mensajes
  Entonces esa compra aparece primera con 1 no leído y la pestaña muestra 1

Escenario: badge en vivo
  Dado que Fénix tiene la app abierta en Mis eventos
  Cuando Ana le escribe
  Entonces el badge de Mensajes sube sin refrescar

Escenario: leer pone en cero
  Dado que Fénix tiene 2 no leídos en una compra
  Cuando abre ese chat
  Entonces los no leídos de esa compra quedan en 0 y el badge baja 2

Escenario: los propios no cuentan
  Cuando Ana envía un mensaje
  Entonces sus no leídos de esa compra no cambian

Escenario: marcar leído sin ser participante
  Cuando Bruno hace PUT /compras/:id/mensajes/leidos de una compra de Ana
  Entonces recibe 403

Escenario: sin conversaciones
  Dado un usuario sin mensajes en ninguna compra
  Cuando abre Mensajes
  Entonces ve "Todavía no tenés mensajes"
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit dominio | `Compra.marcarLeido`, `noLeidosPara`, `agregarMensaje` avanza la marca del autor, `contraparteDe` |
| Unit service | `MensajeService.listarConversaciones` (comprador/organizador, orden, paginado, `totalNoLeidos`), `marcarLeidos`, `enviar` notifica a la otra parte |
| Integración | GET conversaciones por rol + 400; PUT leidos 204/403/404; socket: la otra parte recibe `conversacion:actualizada` en su room de usuario |
| Front (RNTL) | Mensajes lista, vacío, negrita y badge por fila; badge de pestaña con 0, n y 99+; Chat marca leído al abrir |
| E2E | `mensajes-no-leidos`: Ana escribe, Fénix ve el badge y al abrir el chat desaparece |

## Fuera de alcance
- Notificaciones push del sistema operativo.
- Filtro "Sin leer" que aparece en la maqueta.
- Marcar como no leído.

## Notas de IA
La IA propuso guardar la marca de lectura en el server (y no en el celular) para que el contador sea el mismo en web y en el teléfono; el usuario eligió eso y la pestaña para los dos roles.
