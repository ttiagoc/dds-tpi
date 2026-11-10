# 02 — Dominio y reglas de negocio

Parte del diagrama tentativo de la consigna. Cambios respecto al diagrama marcados con **(Δ)** y justificados.

## Modelo

```
Usuario ──favoritos──▶ * Evento ──organizador──▶ Usuario
Evento ──▶ Categoria
Evento ──▶ * TipoEntrada
Compra ──▶ Usuario (comprador), Evento, TipoEntrada, EstadoCompra
Compra ──▶ * Mensaje ──▶ Usuario
Compra ──▶ * CambioEstadoCompra (Δ: historial embebido en la compra)
Resenia ──▶ Usuario (comprador), Evento, Compra (Δ)
```

### Usuario
| Campo | Tipo | Notas |
|---|---|---|
| id | number | |
| nombre, apellido | string | requeridos |
| email | string | único, login (Δ) |
| passwordHash | string | bcrypt (Δ) |
| rol | `Rol.COMPRADOR` \| `Rol.ORGANIZADOR` | (Δ) un rol por usuario; simplifica navegación |
| favoritos | number[] | ids de evento |

Métodos: `agregarFavorito(eventoId)` (idempotente), `quitarFavorito(eventoId)`, `esFavorito(eventoId)`, `esOrganizador()`, `nombreCompleto()`.

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
| fecha | Date | futura al crear |
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

### EstadoCompra
`PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA`.

### CambioEstadoCompra
`estado, quien (usuarioId), fechaHora`. Se agrega uno al crear la compra (PENDIENTE) y en cada transición.

### Mensaje
`id, usuario (id + nombre), mensaje (1-500 chars), enviado (Date)`.

### Compra
| Campo | Tipo |
|---|---|
| id | number |
| comprador | Usuario |
| evento | Evento |
| tipoEntrada | TipoEntrada |
| cantidad | int ≥ 1 |
| total | number (= precio × cantidad, fijado al comprar) |
| estado | EstadoCompra |
| historial | CambioEstadoCompra[] |
| mensajes | Mensaje[] |
| fechaCompra | Date |

Métodos:
- `actualizarEstado(nuevo, quien, ahora)` — valida con `TRANSICIONES`, si no → `UnprocessableEntityError("No se puede pasar de X a Y")`. Agrega `CambioEstadoCompra`.
- `pagar(quien, ahora)`
- `cancelar(quien, ahora)` — ver reglas abajo.
- `marcarUtilizada(quien, ahora)`
- `puedeCancelarse(ahora)` → `estado ∈ {PENDIENTE, CONFIRMADA} && !evento.yaOcurrio(ahora)`
- `puedeReseniarse()` → `estado === UTILIZADA`
- `diasRestantes(ahora)` → solo si CONFIRMADA: `Math.ceil((evento.fecha - ahora) / DIA)`, mínimo 0; si no, `null`.
- `participa(usuarioId)` → es el comprador o el organizador del evento (para chat).
- `agregarMensaje(usuario, texto, ahora)`.

### Resenia
`id, comprador, evento, compra (Δ), puntuacion (int 1-5), detalle (string 1-500), fecha`.
**(Δ) `compra`**: permite garantizar "una reseña por compra" y que la compra esté UTILIZADA.

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
- **R3** Pagar una compra de un evento ya ocurrido → 422.
- **R4** Marcar utilizada: solo el organizador del evento (403 si no) y desde CONFIRMADA. Se permite antes de la fecha para poder hacer la demo (decisión ADR-007).
- **R5** Reseñar: solo el comprador dueño, compra UTILIZADA, una sola reseña por compra (409 si ya existe).
- **R6** Puntaje del organizador: promedio de puntuaciones de todas las reseñas de sus eventos, 1 decimal; `null` si no tiene.
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

## Preguntas abiertas (registrar respuesta en ADR-007 si cambian)

- ¿Las compras PENDIENTE vencen? → **No** por ahora (simplificación).
- ¿Un organizador puede editar/eliminar eventos? → **No** está en los casos de uso; fuera de alcance.
