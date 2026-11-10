# Spec 02 — Dominio

- **Estado:** implementada
- **Rama:** `feature/dominio`
- **Casos de uso:** CU1, CU4, CU7, CU8, CU9, CU10, CU11, CU12 (reglas puras; los endpoints llegan en It2)
- **Iteración:** It1

## Contexto
Las clases de `planes/02-dominio.md` con sus reglas y tests unitarios. Ninguna clase conoce Express ni repositorios, y el momento actual siempre entra como parámetro (`ahora`).

## Reglas confirmadas por el usuario (2026-11-10)
- **Cupo:** se reserva al crear la compra (PENDIENTE) y se libera al cancelar. Las compras PENDIENTE no vencen.
- **Reembolso:** cancelar una compra CONFIRMADA la pasa a CANCELADA y en el acto a REEMBOLSADA, con dos registros en el historial. Cancelar una PENDIENTE la deja en CANCELADA (R2b).
- **Utilizada:** la marca el organizador del evento desde CONFIRMADA, en cualquier momento (también antes de la fecha), así la demo puede mostrar reseñas (R4, ADR-007).
- **Plazo de cancelación:** hasta el inicio del evento (`fecha > ahora`). Es el texto literal de CU8.

Aplican R1–R10 y R2b de `planes/02`. La división de responsabilidades es esta:
- **Dominio:** invariantes y transiciones. Tira `UnprocessableEntityError` (422) o `NotFoundError` (404) si no existe un tipo de entrada.
- **Service (It2):** permisos de recurso (403), unicidad entre agregados (409 por reseña duplicada) y búsqueda en repos.

## Clases y mensajes exactos

**Enums** (`domain/Rol.js`, `domain/EstadoCompra.js` con `TRANSICIONES`).

**Usuario** `{ id, nombre, apellido = "", email, passwordHash, rol, favoritos = [] }`
- "El usuario necesita un nombre" · "El email no es válido" · "El usuario necesita una contraseña" · "El rol no es válido"
- `agregarFavorito` (idempotente), `quitarFavorito`, `esFavorito`, `esOrganizador`, `esComprador`, `nombreCompleto()`

**Categoria** `{ id, nombre, descripcion = "" }` — "La categoría necesita un nombre"

**TipoEntrada** `{ id, nombre, descripcion = "", precio, cupo, vendidas = 0 }`
- "El tipo de entrada necesita un nombre" · "El precio no es válido" (no numérico o infinito) · "El precio no puede ser negativo" · "El cupo tiene que ser un entero mayor a 0" · "Las entradas vendidas tienen que estar entre 0 y el cupo"
- `disponibles()`, `hayCupoPara(n)`, `reservar(n)` → "No hay cupo suficiente para <nombre>", `liberar(n)` (nunca baja de 0; n no entero positivo → "La cantidad a liberar tiene que ser un entero mayor a 0")

**Evento** `{ id, nombre, descripcion, categoria, fecha, lugar, tiposEntrada, multimedia = [], organizador }`
- Constructor (rehidrata; acepta fechas pasadas):
  - "El nombre del evento tiene que tener entre 3 y 100 caracteres"
  - "El evento necesita una descripción" · "El evento necesita una categoría" · "La fecha del evento no es válida" · "El evento necesita un lugar"
  - "El evento necesita al menos un tipo de entrada" · "Ya hay un tipo de entrada llamado <nombre>" (sin distinguir mayúsculas) · "Hay tipos de entrada con el id repetido"
  - `multimedia` null → `[]`; elementos que no sean texto no vacío → "Las imágenes del evento tienen que ser URLs"
  - "El organizador del evento tiene que tener rol ORGANIZADOR"
  - A los tipos sin id les asigna 1..n.
- `Evento.crear(datos, ahora)` → además: "La fecha del evento tiene que ser futura" · "Un evento nuevo no puede tener entradas vendidas".
- `tipoEntrada(id)` → `NotFoundError("No existe el tipo de entrada <id> en este evento")`
- `yaOcurrio(ahora)`, `esDe(usuarioId)`, `precioMinimo()`, `tuPrecioEstaEntre(min, max)` (los límites son opcionales), `coincideCon(texto)` (sin distinguir mayúsculas ni acentos, en nombre y descripción), `totalVendidas()`. `recaudado` lo calcula el service (necesita las compras).

**CambioEstadoCompra** `{ estado, quien, fechaHora }`

**Mensaje** `{ id, usuario: { id, nombre, rol }, mensaje, enviado }` — "El mensaje tiene que tener entre 1 y 500 caracteres" (aplica `trim`) · "La fecha del mensaje no es válida".

**Compra** `{ id, comprador, evento, tipoEntradaId, cantidad, total, estado, historial, mensajes, fechaCompra }`
- Constructor (rehidrata): "La cantidad tiene que ser un entero mayor a 0" · "El estado de la compra no es válido" · el tipo tiene que existir en el evento (404, igual que arriba).
- `Compra.crear({ comprador, evento, tipoEntradaId, cantidad }, ahora)`:
  - "Solo un comprador puede comprar entradas"
  - "No podés comprar entradas de un evento que ya ocurrió"
  - `reservar(cantidad)` · `total = precio × cantidad` · estado PENDIENTE + primer cambio en el historial.
- `tipoEntrada()`.
- `pagar(quien, ahora)` → R3: "No podés pagar una compra de un evento que ya ocurrió"; si el estado no es PENDIENTE, aplica la regla de transición.
- `cancelar(quien, ahora)`:
  - UTILIZADA → "No podés cancelar una compra utilizada"
  - evento ocurrido → "No podés cancelar una compra de un evento que ya ocurrió"
  - CANCELADA o REEMBOLSADA → "La compra ya está cancelada" (se chequea antes que "evento ocurrido")
  - si se puede, libera el cupo, y si venía de CONFIRMADA pasa además a REEMBOLSADA.
- `marcarUtilizada(quien, ahora)`.
- `estado` es de solo lectura (getter sobre `#estado`). Transición inválida (método privado `#actualizarEstado`) → "No se puede pasar de <X> a <Y>".
- `puedePagarse(ahora)`, `puedeCancelarse(ahora)`, `puedeMarcarseUtilizada()`, `puedeReseniarse()`.
- `accionesPara(usuarioId, ahora)` → `{ puedePagar, puedeCancelar, puedeMarcarUtilizada, puedeReseniar }`. Pagar, cancelar y reseñar solo para el comprador; marcar utilizada solo para el organizador del evento.
- `diasRestantes(ahora)`: solo si está CONFIRMADA, `max(0, ceil((fecha - ahora) / día))`; en cualquier otro estado, `null`.
- `participa(usuarioId)`, `esDe(usuarioId)`, `agregarMensaje(usuario, texto, ahora)` (id = cantidad de mensajes + 1).

**Resenia** `{ id, comprador, evento, compraId, puntuacion, detalle, fecha }`
- "La puntuación tiene que ser un entero de 1 a 5" · "La reseña tiene que tener entre 1 y 500 caracteres" · "La reseña necesita una compra" · "La reseña necesita un comprador" · "La reseña necesita un evento" · "La fecha de la reseña no es válida"
- `Resenia.crear({ compra, puntuacion, detalle }, ahora)` → "Solo podés reseñar una compra utilizada"
- `Resenia.promedio(resenias)` → promedio con 1 decimal, o `null` si la lista está vacía (R6).

## Contrato de API
No hay endpoints nuevos. `accionesPara` y `diasRestantes` alimentan `CompraResumen` (`planes/03`).

## Pantallas
Ninguna.

## Criterios de aceptación
```gherkin
Escenario: comprar exactamente el cupo disponible
  Dado un tipo con cupo 10 y 8 vendidas
  Cuando un comprador crea una compra de 2
  Entonces la compra queda PENDIENTE, con total = precio × 2, y el tipo queda con 0 disponibles

Escenario: comprar más que el cupo
  Cuando otra compra pide 1 más
  Entonces falla con 422 "No hay cupo suficiente para <tipo>"

Escenario: cancelar una compra pendiente
  Dada una compra PENDIENTE de 2 entradas
  Cuando la cancelo antes del evento
  Entonces queda CANCELADA, libera 2 entradas y el historial suma 1 cambio

Escenario: cancelar una compra confirmada
  Dada una compra CONFIRMADA
  Cuando la cancelo
  Entonces queda REEMBOLSADA, con CANCELADA y REEMBOLSADA en el historial, y libera el cupo

Escenario: cancelar una compra utilizada
  Entonces falla con 422 "No podés cancelar una compra utilizada"

Escenario: cancelar después del inicio
  Dado un evento que empezó hace 1 minuto
  Entonces cancelar falla con 422 "No podés cancelar una compra de un evento que ya ocurrió"

Escenario: marcar utilizada antes de la fecha
  Dada una compra CONFIRMADA de un evento futuro
  Cuando el organizador la marca utilizada
  Entonces queda UTILIZADA y puedeReseniarse() es true

Escenario: reseñar una compra no utilizada
  Entonces Resenia.crear falla con 422 "Solo podés reseñar una compra utilizada"

Escenario: transición inválida
  Dada una compra PENDIENTE
  Cuando intento marcarla utilizada
  Entonces falla con 422 "No se puede pasar de PENDIENTE a UTILIZADA"

Escenario: seed de un evento pasado
  Cuando construyo un Evento con fecha pasada usando el constructor
  Entonces no falla, pero Evento.crear con la misma fecha falla con "La fecha del evento tiene que ser futura"
```

## Plan de tests (unit, `backend/test/domain/`)
| Clase | Casos |
|---|---|
| Usuario | validaciones; favoritos idempotentes; nombreCompleto con y sin apellido |
| TipoEntrada | validaciones; borde de cupo exacto y +1; liberar sin bajar de 0; vendidas > cupo |
| Evento | validaciones; nombres duplicados "VIP"/"vip"; ids de tipos; crear con fecha pasada; tipoEntrada 404; coincideCon con acentos; precioMinimo; tuPrecioEstaEntre |
| Compra | matriz completa de TRANSICIONES vía métodos públicos; crear (cupo, evento pasado, comprador no COMPRADOR); cancelar en cada estado; R2b; R3; diasRestantes (12 días, < 1 día → 1, evento pasado → 0, no CONFIRMADA → null); accionesPara por rol; mensajes; tipoEntrada() es la misma instancia del evento |
| Resenia | validaciones (0, 6, 3.5); crear sobre compra no UTILIZADA; promedio (vacío → null, redondeo a 1 decimal) |

`coverageThreshold` ≥ 80% en `src/domain/` (el de `services/` se suma cuando existan services).

## Fuera de alcance
- Permisos de recurso (403) y reseña duplicada (409): van en los services de It2.
- Persistencia y seed: `feature/repos-y-seed`.
- Edición o borrado de eventos y vencimiento de PENDIENTE (ver `planes/02`, preguntas abiertas).

## Notas de IA
- La IA propuso las cuatro reglas del plan y el usuario las confirmó sin cambios.
- La IA agregó `accionesPara` en `Compra` para que la regla "qué botones ve cada usuario" quede en el dominio y no se duplique en el service ni en el front.
- La revisión con el subagente `revisor-reglas-negocio` no encontró reglas mal implementadas. Sí marcó 1 hallazgo medio (ids de tipo repetidos) y 9 bajos (invariantes de rehidratación, estado escribible desde afuera, orden de mensajes al cancelar, tests faltantes). El usuario aprobó aplicarlos todos.
- La spec tiene 10 escenarios, apenas por encima del límite orientativo de 8. No se parte porque todos son reglas del mismo agregado.
