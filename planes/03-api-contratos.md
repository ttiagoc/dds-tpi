# 03 — Contratos de API

Fuente de verdad de la API. Swagger (`/api-docs`) se genera a mano desde acá. **Ningún endpoint se implementa si no está en este archivo.**

Base: `http://<host>:3000`. JSON. Fechas ISO 8601 UTC. Auth: `Authorization: Bearer <token>`.

Leyenda: 🔓 público · 🔐 logueado · 🅒 solo COMPRADOR · 🅞 solo ORGANIZADOR.

## Formas comunes

```jsonc
// Error
{ "status": "fail", "message": "No hay cupo suficiente para VIP", "details": [...], "timestamp": "2026-11-10T12:00:00.000Z" }

// Lista paginada
{ "eventos": [ ... ], "total": 42, "page": 1, "totalPages": 3 }
```

### EventoResumen
```json
{
  "id": 1, "nombre": "Los Piojos en River", "fecha": "2026-12-20T23:00:00.000Z", "lugar": "Estadio River Plate",
  "categoria": { "id": 1, "nombre": "Recitales" },
  "precioDesde": 45000, "imagen": "https://...",
  "organizador": { "id": 3, "nombre": "Fénix Producciones", "puntajePromedio": 4.5 },
  "esFavorito": false,
  "finalizado": false
}
```
`esFavorito` solo si hay sesión de comprador; si no, `false`. `imagen` (y cada elemento de `multimedia`) es una URL absoluta o una ruta relativa al back (`/imagenes/rock.jpg`, servida por `GET /imagenes/<archivo>`); el front resuelve las relativas contra `EXPO_PUBLIC_API_URL` (spec 17). `finalizado` = el evento ya ocurrió (`Evento.yaOcurrio(ahora)`, `fecha <= ahora`); lo usa el front para no ofrecer comprar (spec 16).

### EventoDetalle
EventoResumen + `descripcion`, `multimedia: string[]`, `tiposEntrada: [{ id, nombre, descripcion, precio, cupo, disponibles }]`.

### CompraResumen
```json
{
  "id": 7, "estado": "CONFIRMADA", "cantidad": 2, "total": 90000, "fechaCompra": "...",
  "diasRestantes": 12,
  "evento": { "id": 1, "nombre": "...", "fecha": "...", "lugar": "...", "imagen": "..." },
  "tipoEntrada": { "id": 1, "nombre": "Campo", "precio": 45000 },
  "comprador": { "id": 1, "nombre": "Ana Pérez" },
  "acciones": { "puedePagar": false, "puedeCancelar": true, "puedeMarcarUtilizada": false, "puedeReseniar": false }
}
```
`acciones` se calcula para el usuario que pide (el front no reimplementa reglas). `puedeReseniar` es `false` si la compra ya tiene reseña.

### CompraDetalle
CompraResumen + `historial: [{ estado, quien: { id, nombre }, fechaHora }]` + `resenia: { puntuacion, detalle } | null`.

## Endpoints

### Sistema
| Método | Ruta | Auth | Respuesta |
|---|---|---|---|
| GET | `/healthcheck` | 🔓 | 200 `{ status: "ok" }` |
| GET | `/api-docs` | 🔓 | Swagger UI |
| GET | `/api-docs.json` | 🔓 | 200 documento OpenAPI 3.0.3. Detalle en `specs/07b-swagger.md` |
| POST | `/test/reset` | 🔓 solo `NODE_ENV=test` | 204 — vacía repos y re-siembra (Cypress) |

### Auth
| Método | Ruta | Auth | Body | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/auth/login` | 🔓 | `{ email, password }` | 200 `{ token, usuario: { id, nombre, apellido, email, rol } }` | 400, 401 "Email o contraseña incorrectos" |
| GET | `/auth/yo` | 🔐 | — | 200 usuario | 401 |

### Categorías
| GET | `/categorias` | 🔓 | — | 200 `[{ id, nombre, descripcion }]` | |
|---|---|---|---|---|---|

### Eventos
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| GET | `/eventos` | 🔓 | query abajo | 200 lista paginada de EventoResumen | 400 query inválida |
| GET | `/eventos/:id` | 🔓 | — | 200 EventoDetalle | 400, 404 |
| POST | `/eventos` | 🅞 | body abajo | 201 EventoDetalle | 400, 401, 403, 422 (incluye categoría inexistente: "La categoría no existe") |
| GET | `/organizadores/yo/eventos` | 🅞 | `page, limit` | 200 `{ eventos: [EventoResumen + vendidas, cupo, recaudado], total, page, totalPages }` — todos sus eventos (incluye pasados), por fecha asc; `vendidas` = cupo ocupado, `cupo` = suma de cupos, `recaudado` = suma de `total` de las compras CONFIRMADA y UTILIZADA. Detalle en `specs/05b-eventos-organizador.md` | 400, 401, 403 |
| GET | `/eventos/:id/compras` | 🅞 dueño | `estado?, page, limit` | 200 `{ evento: {id,nombre}, disponibilidad: [{ tipoEntradaId, nombre, cupo, vendidas, disponibles }], compras: [CompraResumen], total, page, totalPages }` — compras por `fechaCompra` desc, id desc; `disponibilidad` no se filtra por estado. Detalle en `specs/06b-compras-organizador.md` | 400, 401, 403, 404 |
| GET | `/organizadores/:id/resenias` | 🔓 | `page, limit` | 200 `{ organizador: {id,nombre,puntajePromedio,cantidadResenias}, resenias: [Resenia], total, page, totalPages }` — reseñas por `fecha` desc, id desc; promedio y cantidad sobre todas; sin reseñas → `[]` y `puntajePromedio: null`. Detalle en `specs/07-resenias-favoritos.md` | 400, 404 "No existe el organizador" (inexistente o no ORGANIZADOR) |

Query `GET /eventos`:
| Param | Tipo | Default |
|---|---|---|
| `q` | string ≤ 100 | — |
| `categoria` | id numérico | — |
| `precioMin`, `precioMax` | number ≥ 0 | — |
| `ordenarPor` | `fecha` \| `precio` \| `puntaje` | `fecha` |
| `orden` | `asc` \| `desc` | `asc` (`desc` para puntaje) |
| `incluirPasados` | boolean | `false` |
| `page`, `limit` | int | 1, 20 (máx 50) |

Ordenar por puntaje: organizadores sin reseñas van al final (en `asc` y en `desc`). `precioMin > precioMax` → 400. `categoria` inexistente → 200 con lista vacía. `incluirPasados` acepta solo `"true"`/`"false"`. Detalle en `specs/05-eventos-consulta.md`.

Body `POST /eventos`:
```json
{
  "nombre": "Stand-up en el Konex", "descripcion": "...", "categoriaId": 6,
  "fecha": "2026-12-05T22:00:00.000Z", "lugar": "Ciudad Cultural Konex",
  "multimedia": ["https://..."],
  "tiposEntrada": [ { "nombre": "General", "descripcion": "De pie", "precio": 15000, "cupo": 200 } ]
}
```

### Compras
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/compras` | 🅒 | `{ eventoId, tipoEntradaId, cantidad }` (cantidad entera 1-10) | 201 CompraDetalle | 400, 401, 403, 404, 422 sin cupo / evento pasado. Detalle en `specs/06-compras-comprador.md` |
| GET | `/compras` | 🅒 | `estado?, page, limit` | 200 `{ compras: [CompraResumen], total, page, totalPages }` (orden: primero eventos no ocurridos por fecha asc, después los ocurridos por fecha desc; desempate id asc) | 400, 401, 403 |
| GET | `/compras/:id` | 🔐 comprador dueño u organizador del evento | — | 200 CompraDetalle | 400, 401, 403, 404 |
| POST | `/compras/:id/pago` | 🅒 dueño | — | 200 CompraDetalle | 400, 401, 403, 404, 422 transición inválida o evento ocurrido |
| POST | `/compras/:id/cancelacion` | 🅒 dueño | — | 200 CompraDetalle (estado CANCELADA o REEMBOLSADA) | 400, 401, 403, 404, 422 |
| POST | `/compras/:id/uso` | 🅞 organizador del evento | — | 200 CompraDetalle con las acciones del organizador. Detalle en `specs/06b-compras-organizador.md` | 400, 401, 403, 404, 422 |
| POST | `/compras/:id/resenia` | 🅒 dueño | `{ puntuacion: 1-5 int, detalle: 1-500 }` `.strict()` | 201 `Resenia` = `{ id, compraId, puntuacion, detalle, fecha, evento:{id,nombre}, comprador:{nombre} }`. Detalle en `specs/07-resenias-favoritos.md` | 400, 401, 403, 404, 409 "Ya reseñaste esta compra", 422 "Solo podés reseñar una compra utilizada" (409 antes que 422) |

### Mensajes (chat)
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| GET | `/compras/:id/mensajes` | 🔐 participante | — | 200 `[Mensaje]` = `[{ id, usuario: {id,nombre,rol}, mensaje, enviado }]` sin paginar (enviado asc, id asc) | 400, 401, 403, 404 |
| POST | `/compras/:id/mensajes` | 🔐 participante | `{ mensaje }` 1-500 (trim) `.strict()` | 201 `Mensaje` | 400, 401, 403, 404 (400 de body antes que 404/403) |

El envío es por REST (valida, persiste, devuelve). Después de persistir, el service emite por socket. Se puede escribir en cualquier estado (R7). Detalle en `specs/08-chat-rest.md`.

### Favoritos
| Método | Ruta | Auth | Respuesta |
|---|---|---|---|
| GET | `/usuarios/yo/favoritos` | 🅒 | 200 `[EventoResumen]` sin paginar, incluye pasados, por fecha del evento asc e id asc · 401, 403 |
| PUT | `/usuarios/yo/favoritos/:eventoId` | 🅒 | 204 (idempotente, admite eventos pasados) · 400, 401, 403, 404 "No existe el evento" |
| DELETE | `/usuarios/yo/favoritos/:eventoId` | 🅒 | 204 (idempotente, aunque no sea favorito o el evento no exista) · 400, 401, 403 |

Detalle en `specs/07-resenias-favoritos.md`.

## Socket.io

- Mismo puerto que la API. Cliente: `io(API_URL, { auth: { token } })`.
- Handshake sin token válido → `connect_error` con `message: "No autenticado"`.

| Dirección | Evento | Payload | Notas |
|---|---|---|---|
| cliente → server | `compra:unirse` | `{ compraId }` | ack `{ ok: true }` o `{ ok: false, error }` ("El id debe ser un entero positivo", "No existe la compra", "No tenés permiso para realizar esta acción"; error inesperado: "No se pudo unir al chat") |
| cliente → server | `compra:salir` | `{ compraId }` | |
| server → room `compra:<id>` | `mensaje:nuevo` | `Mensaje` (misma forma que REST) | tras `POST /compras/:id/mensajes`, a todo el room incluido el autor |
| server → room `compra:<id>` | `compra:estado` | `{ compraId, estado }` | tras pago, cancelación o uso; un solo evento con el estado final (cancelar una CONFIRMADA emite REEMBOLSADA). Detalle en `specs/08b-chat-socket.md` |

## Usuarios de seed (contraseña `Demo1234!`)

| Email | Rol |
|---|---|
| ana@aiticket.com | COMPRADOR |
| bruno@aiticket.com | COMPRADOR |
| fenix@aiticket.com | ORGANIZADOR |
| konex@aiticket.com | ORGANIZADOR |

Seed: 6 categorías, ~12 eventos (algunos pasados con reseñas para que el puntaje exista), compras en todos los estados para Ana.
