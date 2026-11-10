# 02 — Dominio y reglas de negocio

Parte del diagrama tentativo de la consigna. Cambios respecto al diagrama marcados con **(Δ)** y justificados.

## Constructores vs reglas con tiempo

- El **constructor** valida solo forma e invariantes atemporales (tipos, rangos, requeridos) y acepta el estado completo para **rehidratar** (seed, tests, futura migración a Mongo).
- Las reglas que dependen de "ahora" se validan en **factories estáticas** o métodos que reciben `ahora`: `Evento.crear(datos, ahora)` (fecha futura), `Compra.crear({ ... }, ahora)` (evento no ocurrido, reserva de cupo, primer `CambioEstadoCompra`).
- Así el seed puede construir eventos pasados y compras UTILIZADAS/REEMBOLSADAS con su historial sin saltear validaciones.

## Modelo

```
Usuario ──favoritos──▶ * Evento ──organizador──▶ Usuario
Evento ──▶ Categoria
Evento ──▶ * TipoEntrada
Compra ──▶ Usuario (comprador), Evento, TipoEntrada, EstadoCompra
Compra ──▶ * Mensaje ──▶ Usuario
Compra ──▶ * CambioEstadoCompra (Δ: historial embebido en la compra)
Resenia ──▶ Usuario (comprador), Evento, Compra (Δ, por compraId)
```

### Usuario
| Campo | Tipo | Notas |
|---|---|---|
| id | number | |
| nombre | string | requerido |
| apellido | string | opcional (Δ): los organizadores suelen ser productoras ("Fénix Producciones") |
| email | string | único, login (Δ) |
| passwordHash | string | bcrypt (Δ) |
| rol | `Rol.COMPRADOR` \| `Rol.ORGANIZADOR` | (Δ) un rol por usuario; simplifica navegación |
| favoritos | number[] | ids de evento |

Métodos: `agregarFavorito(eventoId)` (idempotente), `quitarFavorito(eventoId)`, `esFavorito(eventoId)`, `esOrganizador()`, `nombreCompleto()` (nombre + apellido si hay; es el `nombre` de los resúmenes embebidos).

### Categoria
`id, nombre, descripcion`. Sembradas (Recitales, Teatro, Festivales, Conferencias, Deportes, Stand-up). No hay ABM.

### TipoEntrada
| Campo | Tipo | Regla |
|---|---|---|
| id | number | único dentro del evento |
| nombre | string | requerido, único dentro del evento (case-insensitive) |
| descripcion | string | opcional |
| precio | number | `>= 0` |
| cupo | int | `>= 1` |
| vendidas | int | (Δ) `0 <= vendidas <= cupo`; arranca en 0 |

Métodos:
- `disponibles()` → `cupo - vendidas`
- `hayCupoPara(cantidad)` → `cantidad >= 1 && cantidad <= disponibles()`
- `reservar(cantidad)` → si no hay cupo, `UnprocessableEntityError("No hay cupo suficiente para <nombre>")`
- `liberar(cantidad)` → nunca baja de 0

**(Δ) `vendidas`**: el diagrama solo tiene `cupo`. Guardar el contador evita recorrer todas las compras para saber disponibilidad y deja la regla en el dominio.

### Evento
| Campo | Tipo | Regla |
|---|---|---|
| id | number | |
| nombre | string | requerido, 3-100 |
| descripcion | string | requerido |
| categoria | Categoria | requerida |
| fecha | Date | futura al crear (`Evento.crear`, no el constructor) |
| lugar | string | (Δ) requerido; útil para chat/consultas de acceso |
| tiposEntrada | TipoEntrada[] | al menos 1 |
| multimedia | string[] | URLs de imágenes, opcional |
| organizador | Usuario | rol ORGANIZADOR |

Métodos:
- `tuPrecioEstaEntre(min, max)` → algún tipo con precio en rango (del diagrama).
- `precioMinimo()` → para ordenar por precio.
- `tipoEntrada(id)` → o `NotFoundError`.
- `yaOcurrio(ahora)` → `fecha <= ahora`.
- `esDe(usuarioId)` → es el organizador.
- `coincideCon(texto)` → nombre o descripción, sin mayúsculas ni acentos.
- `cupoTotal()` → suma de los cupos de sus tipos (MisEventos, spec 05b).

### EstadoCompra
`PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA`.

### CambioEstadoCompra
`estado, quien (usuarioId), fechaHora`. Se agrega uno al crear la compra (PENDIENTE) y en cada transición.

### Mensaje
`id, usuario ({ id, nombre, rol } snapshot), mensaje (1-500 chars), enviado (Date)`.

### Compra
| Campo | Tipo |
|---|---|
| id | number |
| comprador | Usuario |
| evento | Evento |
| tipoEntradaId | number (Δ) — se resuelve con `evento.tipoEntrada(id)`; así el cupo siempre se lee/muta en la instancia que vive dentro del evento |
| cantidad | int ≥ 1 |
| total | number (= precio × cantidad, fijado al comprar) |
| estado | EstadoCompra |
| historial | CambioEstadoCompra[] |
| mensajes | Mensaje[] |
| fechaCompra | Date |

Métodos:
- `tipoEntrada()` → `evento.tipoEntrada(tipoEntradaId)`.
- `actualizarEstado(nuevo, quien, ahora)` — **uso interno** de los métodos de acción; valida con `TRANSICIONES`, si no → `UnprocessableEntityError("No se puede pasar de X a Y")`. Agrega `CambioEstadoCompra`.
- `pagar(quien, ahora)`
- `cancelar(quien, ahora)` — PENDIENTE → CANCELADA; CONFIRMADA → CANCELADA → REEMBOLSADA. Libera cupo. Es el **único** camino a REEMBOLSADA (ver R2b).
- `marcarUtilizada(quien, ahora)`
- `puedeCancelarse(ahora)` → `estado ∈ {PENDIENTE, CONFIRMADA} && !evento.yaOcurrio(ahora)`
- `puedeReseniarse()` → `estado === UTILIZADA`
- `sumaAlRecaudado()` → `true` si está CONFIRMADA o UTILIZADA (cuenta para `recaudado`, spec 05b).
- `diasRestantes(ahora)` → solo si CONFIRMADA: `Math.ceil((evento.fecha - ahora) / DIA)`, mínimo 0; si no, `null`.
- `participa(usuarioId)` → es el comprador o el organizador del evento (para chat).
- `puedePagarse(ahora)`, `puedeMarcarseUtilizada()`.
- `accionesPara(usuarioId, ahora)` → `{ puedePagar, puedeCancelar, puedeMarcarUtilizada, puedeReseniar }` según rol en la compra (alimenta `acciones` de `CompraResumen`).
- `agregarMensaje(usuario, texto, ahora)`.

### Resenia
`id, comprador, evento, compraId (Δ), puntuacion (int 1-5), detalle (string 1-500), fecha`. `Resenia.crear({ compra, ... }, ahora)` exige compra UTILIZADA; `Resenia.promedio(resenias)` implementa R6.
**(Δ) `compraId`**: permite garantizar "una reseña por compra" y que la compra esté UTILIZADA.

## Máquina de estados de la compra

```
            pagar                 marcarUtilizada
PENDIENTE ─────────▶ CONFIRMADA ─────────────────▶ UTILIZADA
    │                    │
    │ cancelar           │ cancelar
    ▼                    ▼
CANCELADA ◀──────────────┘ ──(automático)──▶ REEMBOLSADA
```

```js
export const TRANSICIONES = Object.freeze({
  PENDIENTE: ["CONFIRMADA", "CANCELADA"],
  CONFIRMADA: ["UTILIZADA", "CANCELADA"],
  CANCELADA: ["REEMBOLSADA"],
  UTILIZADA: [],
  REEMBOLSADA: [],
});
```

| Acción | Quién | Desde | Resultado | Efecto |
|---|---|---|---|---|
| Crear | comprador | — | PENDIENTE | `tipoEntrada.reservar(cantidad)` |
| Pagar (simulado) | comprador dueño | PENDIENTE | CONFIRMADA | — |
| Cancelar | comprador dueño | PENDIENTE | CANCELADA | libera cupo |
| Cancelar | comprador dueño | CONFIRMADA | CANCELADA → REEMBOLSADA | libera cupo, 2 cambios en historial |
| Marcar utilizada | organizador del evento | CONFIRMADA | UTILIZADA | habilita reseña |

Reglas:
- **R1** Comprar: usuario COMPRADOR; evento no ocurrido; tipo existe; `hayCupoPara(cantidad)`. Sin cupo → 422.
- **R2** Cancelar: solo si `puedeCancelarse(ahora)`. UTILIZADA o evento ocurrido → 422 "No podés cancelar…".
- **R2b** REEMBOLSADA solo se alcanza dentro de `cancelar()` cuando la compra estaba CONFIRMADA. Una compra cancelada desde PENDIENTE queda CANCELADA para siempre (nunca se pagó).
- **R3** Pagar una compra de un evento ya ocurrido → 422.
- **R4** Marcar utilizada: solo el organizador del evento (403 si no) y desde CONFIRMADA. Se permite antes de la fecha para poder hacer la demo (decisión ADR-007).
- **R5** Reseñar: solo el comprador dueño, compra UTILIZADA, una sola reseña por compra (409 si ya existe).
- **R6** Puntaje del organizador: promedio de puntuaciones de todas las reseñas de sus eventos, 1 decimal; `null` si no tiene. Al listar eventos se calcula un `Map organizadorId → promedio` **una vez por request** (no por evento).
- **R7** Chat: solo `compra.participa(usuarioId)` (403). Se puede escribir en cualquier estado ("en cualquier momento", CU5/CU6).
- **R8** Crear evento: solo ORGANIZADOR; fecha futura; ≥1 tipo; nombres de tipo únicos; precio ≥ 0; cupo ≥ 1.
- **R9** Ver compras de un evento: solo su organizador (403).
- **R10** Búsqueda: por defecto solo eventos no ocurridos.

## Casos borde a testear

- Comprar exactamente el cupo disponible (ok) y uno más (422).
- Dos compras que juntas superan el cupo: la segunda falla.
- Cancelar libera cupo y otra compra puede usarlo.
- Cancelar el mismo día del evento después de la hora → 422.
- `diasRestantes` cuando falta menos de un día → 1; evento hoy pasado → no aplica (no CONFIRMADA o 0).
- Reseña duplicada → 409; puntuación 0 o 6 o 3.5 → 400.
- Organizador intenta comprar → 403.
- Comprador ajeno lee/escribe chat → 403.
- Matriz completa de `TRANSICIONES`: cada par (desde, hacia) permitido pasa y cada uno no permitido → 422.
- Cancelar desde PENDIENTE → CANCELADA con 1 cambio nuevo; desde CONFIRMADA → REEMBOLSADA con 2 cambios.
- Una compra CANCELADA desde PENDIENTE no puede pasar a REEMBOLSADA (R2b).
- `liberar` nunca deja `vendidas` < 0.
- `coincideCon` ignora mayúsculas y acentos ("teatro" encuentra "Teátro").
- Tipos de entrada con nombre repetido sin distinguir mayúsculas ni acentos ("VIP" y "vip", "Platea" y "Pláteá") → 422.
- `Evento.crear` con fecha pasada → 422; el constructor con fecha pasada (rehidratar) → ok.
- R3: pagar compra de evento ocurrido → 422.
- R4: marcar utilizada siendo otro organizador → 403.
- `compra.tipoEntrada()` devuelve la misma instancia que `evento.tiposEntrada` (reservar se ve en el evento).

## Preguntas abiertas (registrar respuesta en ADR-007 si cambian)

- ¿Las compras PENDIENTE vencen? → **No** por ahora (simplificación).
- ¿Un organizador puede editar/eliminar eventos? → **No** está en los casos de uso; fuera de alcance.
