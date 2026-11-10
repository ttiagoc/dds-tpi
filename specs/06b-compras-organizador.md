# Spec 06b — Compras del organizador (marcar utilizada y compras de un evento)

- **Estado:** borrador
- **Rama:** `feature/compras-organizador`
- **Casos de uso:** CU2 (compras de un evento con estado y disponibles por tipo), CU9 (parcial: marcar la entrada utilizada habilita la reseña)
- **Iteración:** It2
- **Depende de:** spec 06 (usa `CompraService.toResumen`/`toDetalle`)

## Contexto
El organizador necesita ver las compras de cada uno de sus eventos, con su estado y cuántas entradas quedan de cada tipo, y marcar como utilizadas las entradas en la puerta. Es la base de las pantallas ComprasDelEvento y de la acción "Marcar utilizada" de DetalleCompra (It4).

## Historias
- Como organizador, quiero ver las compras de un evento, con su estado y las entradas disponibles de cada tipo (CU2).
- Como organizador, quiero marcar una compra como utilizada cuando el comprador asiste, para que pueda reseñar (CU9).

## Reglas de negocio
Aplican R4 y R9 de `planes/02-dominio.md`.

- **CO1** Los dos endpoints usan `autenticar` + `autorizar(ORGANIZADOR)`: sin token → 401; comprador → 403 "No tenés permiso para realizar esta acción".
- **CO2** `POST /compras/:id/uso`:
  - id inválido → 400; compra inexistente → 404 "No existe la compra";
  - si el evento es de otro organizador → 403 "No tenés permiso para realizar esta acción" (R4);
  - si no, `compra.marcarUtilizada(usuario.id, ahora)`. Desde un estado distinto de CONFIRMADA → 422 con el mensaje de la transición (por ejemplo "No se puede pasar de PENDIENTE a UTILIZADA"). Se permite antes de la fecha del evento (ADR-007).
  - Responde 200 con `CompraDetalle` (spec 06, C6), con las `acciones` calculadas para el organizador.
- **CO3** `GET /eventos/:id/compras`:
  - id inválido → 400; evento inexistente → 404 "No existe el evento"; evento de otro organizador → 403 (R9).
  - Query `.strict()`: `estado?`, `page`, `limit` (igual que `GET /compras`).
  - Respuesta `{ evento: { id, nombre }, disponibilidad, compras: [CompraResumen], total, page, totalPages }`.
- **CO4** `disponibilidad` = un ítem por cada tipo del evento, en el orden del evento: `{ tipoEntradaId, nombre, cupo, vendidas, disponibles }`. Muestra siempre el total, sin aplicar el filtro de `estado`.
- **CO5** Las compras van de la más nueva a la más vieja: `fechaCompra` desc y después `id` desc. Las `acciones` se calculan para el organizador, así que solo puede aparecer `puedeMarcarUtilizada: true`.

## Contrato de API (cambia `planes/03`)
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/compras/:id/uso` | 🅞 organizador del evento | — | 200 CompraDetalle | 400, 401, 403, 404, 422 |
| GET | `/eventos/:id/compras` | 🅞 dueño | `estado?, page, limit` | 200 `{ evento, disponibilidad, compras, total, page, totalPages }` | 400, 401, 403, 404 |

Cambio en `planes/03`: se fija el orden de las compras del evento (`fechaCompra` desc).

Diseño:
- `CompraService.marcarUtilizada` y `CompraService.listarDelEvento`, que usa `compraRepository.findByEvento`.
- `GET /eventos/:id/compras` se monta en `EventoRoutes` y usa `CompraController`.
- Se reutiliza la query de `GET /compras`.

## Pantallas
Ninguna en esta iteración (ComprasDelEvento es de It4).

## Criterios de aceptación
```gherkin
Escenario: marcar utilizada
  Dado que estoy logueado como Fénix
  Cuando hago POST /compras/<id de la compra CONFIRMADA de Ana a Festival Primavera Sonora>/uso
  Entonces responde 200 con estado UTILIZADA y el cambio con quien Fénix en el historial
  Y después Ana ve puedeReseniar true en esa compra

Escenario: no se puede marcar utilizada
  Cuando Fénix marca la compra PENDIENTE de Ana a "Los Piojos" → 422 "No se puede pasar de PENDIENTE a UTILIZADA"
  Y Konex marca una compra de un evento de Fénix → 403
  Y Ana (compradora) → 403, sin token → 401, compra inexistente → 404

Escenario: compras de un evento
  Dado que estoy logueado como Fénix
  Cuando hago GET /eventos/<id de Festival Primavera Sonora>/compras
  Entonces trae evento { id, nombre }, disponibilidad General (3000, 2 vendidas, 2998) y VIP (20, 18, 2)
  Y las 2 compras CONFIRMADA ordenadas de la más nueva a la más vieja (la de Ana y después la de Bruno) con puedeMarcarUtilizada true
  Y con estado=PENDIENTE la lista viene vacía pero la disponibilidad no cambia

Escenario: permisos de compras de un evento
  Cuando Konex pide las compras de un evento de Fénix → 403
  Y Ana → 403, un evento inexistente → 404, limit=51 → 400
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit service | `marcarUtilizada`: 404, 403 si el evento es de otro, guarda, error de transición propagado, usa el reloj. `listarDelEvento`: 404, 403, disponibilidad sin filtro, filtro por estado, orden por fechaCompra desc e id desc, paginado, acciones del organizador |
| Unit controller | `marcarUtilizada` y `listarDelEvento`: parsean el id y la query, delegan con el usuario y responden 200; errores a `next` |
| Integración | los 4 escenarios contra la app con el seed |

## Fuera de alcance
- Emitir `compra:estado` por socket: spec 08.
- Reseñar: spec 07.
- Deshacer el "utilizada": no hay transición de vuelta.

## Notas de IA
- El usuario eligió partir por rol y ordenar las compras de la más nueva a la más vieja.
- La IA agregó sin preguntar (revisable):
  - `disponibilidad` no se filtra por `estado`;
  - el 404 va antes que el 403;
  - `GET /eventos/:id/compras` se monta en `EventoRoutes`.
