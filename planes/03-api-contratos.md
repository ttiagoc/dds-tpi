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
  "organizador": { "id": 2, "nombre": "Fénix Producciones", "puntajePromedio": 4.5 },
  "esFavorito": false
}
```
`esFavorito` solo si hay sesión de comprador; si no, `false`.

### EventoDetalle
EventoResumen + `descripcion`, `multimedia: string[]`, `tiposEntrada: [{ id, nombre, descripcion, precio, cupo, disponibles }]`.

### CompraResumen
```json
{
  "id": 7, "estado": "CONFIRMADA", "cantidad": 2, "total": 90000, "fechaCompra": "...",
  "diasRestantes": 12,
  "evento": { "id": 1, "nombre": "...", "fecha": "...", "lugar": "...", "imagen": "..." },
  "tipoEntrada": { "id": 1, "nombre": "Campo", "precio": 45000 },
  "comprador": { "id": 3, "nombre": "Ana Pérez" },
  "acciones": { "puedePagar": false, "puedeCancelar": true, "puedeMarcarUtilizada": false, "puedeReseniar": false }
}
```
`acciones` se calcula para el usuario que pide (el front no reimplementa reglas).

### CompraDetalle
CompraResumen + `historial: [{ estado, quien: { id, nombre }, fechaHora }]` + `resenia: { puntuacion, detalle } | null`.

## Endpoints

### Sistema
| Método | Ruta | Auth | Respuesta |
|---|---|---|---|
| GET | `/healthcheck` | 🔓 | 200 `{ status: "ok" }` |
| GET | `/api-docs` | 🔓 | Swagger UI |
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
| GET | `/eventos/:id` | 🔓 | — | 200 EventoDetalle | 404 |
| POST | `/eventos` | 🅞 | body abajo | 201 EventoDetalle | 400, 422 (incluye categoría inexistente: "La categoría no existe") |
| GET | `/organizadores/yo/eventos` | 🅞 | `page, limit` | 200 `{ eventos: [EventoResumen + vendidas, recaudado], ... }` — `recaudado` = suma de `total` de las compras CONFIRMADA y UTILIZADA | |
| GET | `/eventos/:id/compras` | 🅞 dueño | `estado?, page, limit` | 200 `{ evento: {id,nombre}, disponibilidad: [{ tipoEntradaId, nombre, cupo, vendidas, disponibles }], compras: [CompraResumen], total, page, totalPages }` | 403, 404 |
| GET | `/organizadores/:id/resenias` | 🔓 | `page, limit` | 200 `{ organizador: {id,nombre,puntajePromedio,cantidadResenias}, resenias: [{ id, puntuacion, detalle, fecha, evento:{id,nombre}, comprador:{nombre} }], total, page, totalPages }` | 404 |

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
| POST | `/compras` | 🅒 | `{ eventoId, tipoEntradaId, cantidad }` | 201 CompraDetalle | 400, 404, 422 sin cupo / evento pasado |
| GET | `/compras` | 🅒 | `estado?, page, limit` | 200 `{ compras: [CompraResumen], total, page, totalPages }` (orden: fecha de evento asc) | |
| GET | `/compras/:id` | 🔐 comprador dueño u organizador del evento | — | 200 CompraDetalle | 403, 404 |
| POST | `/compras/:id/pago` | 🅒 dueño | — | 200 CompraDetalle | 403, 422 transición inválida |
| POST | `/compras/:id/cancelacion` | 🅒 dueño | — | 200 CompraDetalle (estado CANCELADA o REEMBOLSADA) | 403, 422 |
| POST | `/compras/:id/uso` | 🅞 organizador del evento | — | 200 CompraDetalle | 403, 422 |
| POST | `/compras/:id/resenia` | 🅒 dueño | `{ puntuacion: 1-5 int, detalle }` | 201 reseña | 403, 409 ya reseñada, 422 no utilizada |

### Mensajes (chat)
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| GET | `/compras/:id/mensajes` | 🔐 participante | — | 200 `[{ id, usuario: {id,nombre,rol}, mensaje, enviado }]` (orden cronológico) | 403, 404 |
| POST | `/compras/:id/mensajes` | 🔐 participante | `{ mensaje }` 1-500 | 201 mensaje | 400, 403, 404 |

El envío es por REST (valida, persiste, devuelve). Después de persistir, el service emite por socket.

### Favoritos
| Método | Ruta | Auth | Respuesta |
|---|---|---|---|
| GET | `/usuarios/yo/favoritos` | 🅒 | 200 `[EventoResumen]` |
| PUT | `/usuarios/yo/favoritos/:eventoId` | 🅒 | 204 (idempotente) · 404 evento |
| DELETE | `/usuarios/yo/favoritos/:eventoId` | 🅒 | 204 |

## Socket.io

- Mismo puerto que la API. Cliente: `io(API_URL, { auth: { token } })`.
- Handshake sin token válido → `connect_error` con `message: "No autenticado"`.

| Dirección | Evento | Payload | Notas |
|---|---|---|---|
| cliente → server | `compra:unirse` | `{ compraId }` | ack `{ ok: true }` o `{ ok: false, error }` si no participa |
| cliente → server | `compra:salir` | `{ compraId }` | |
| server → room `compra:<id>` | `mensaje:nuevo` | mensaje (misma forma que REST) | tras `POST /compras/:id/mensajes` |
| server → room `compra:<id>` | `compra:estado` | `{ compraId, estado }` | extra: refresca detalle al cambiar estado |

## Usuarios de seed (contraseña `Demo1234!`)

| Email | Rol |
|---|---|
| ana@aiticket.com | COMPRADOR |
| bruno@aiticket.com | COMPRADOR |
| fenix@aiticket.com | ORGANIZADOR |
| konex@aiticket.com | ORGANIZADOR |

Seed: 6 categorías, ~12 eventos (algunos pasados con reseñas para que el puntaje exista), compras en todos los estados para Ana.
