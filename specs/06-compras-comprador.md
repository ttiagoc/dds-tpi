# Spec 06 — Compras del comprador (comprar, mis compras, detalle, pago y cancelación)

- **Estado:** implementada
- **Rama:** `feature/compras-comprador`
- **Casos de uso:** CU12 (comprar), CU1 (mis compras con estado y días restantes), CU7 y CU8 (cancelar con reembolso)
- **Iteración:** It2

## Contexto
Es el núcleo del flujo del comprador: elegir un tipo de entrada y una cantidad, ver sus compras con el estado y los días que faltan, pagar (simulado) y cancelar. Las reglas ya están en el dominio (`Compra`, `TRANSICIONES`, `accionesPara`, `diasRestantes`); esta spec las expone por HTTP. Lo que hace el organizador sobre las compras (marcar utilizada y ver las compras de un evento) va en la spec 06b. Base de las pantallas Comprar, MisCompras y DetalleCompra (It4).

## Historias
- Como comprador, quiero comprar entradas de un evento eligiendo el tipo y la cantidad, sin superar el cupo disponible (CU12).
- Como comprador, quiero ver mis compras con su estado y cuántos días faltan si está confirmada (CU1).
- Como comprador, quiero pagar una compra pendiente para confirmarla.
- Como comprador, quiero cancelar una compra para recibir el reembolso si no puedo ir, siempre que no esté utilizada y el evento no haya ocurrido (CU7, CU8).

## Reglas de negocio
Aplican R1, R2, R2b y R3 de `planes/02-dominio.md`.

- **C1** Permisos:
  - `POST /compras`, `GET /compras`, pago y cancelación: `autenticar` + `autorizar(COMPRADOR)`. Sin token → 401 "Necesitás iniciar sesión"; organizador → 403 "No tenés permiso para realizar esta acción".
  - `GET /compras/:id`: cualquier usuario con sesión que participe de la compra (`compra.participa(usuario.id)`: el comprador o el organizador del evento). Si no participa → 403 "No tenés permiso para realizar esta acción".
  - En pago y cancelación, una compra de otro comprador → 403 "No tenés permiso para realizar esta acción".
  - En todos los endpoints con `:id`: id no entero positivo → 400; compra inexistente → 404 "No existe la compra". El 404 va antes que el 403.
- **C2** Body de `POST /compras` (`crearCompraValidation`, zod `.strict()`): `eventoId` y `tipoEntradaId` enteros positivos, `cantidad` entero **de 1 a 10** (tope por compra). Fuera de eso o con campos de más → 400 "Datos inválidos" con `details`.
- **C3** Al crear, el service busca el evento (si no existe → 404 "No existe el evento") y delega en `Compra.crear(..., ahora)`:
  - tipo inexistente en el evento → 404 "No existe el tipo de entrada <id> en este evento";
  - evento ya ocurrido → 422 "No podés comprar entradas de un evento que ya ocurrió";
  - sin cupo → 422 "No hay cupo suficiente para <tipo>".
  La compra nace PENDIENTE, reserva cupo (R1) y responde 201 con `CompraDetalle`.
- **C4** `GET /compras` devuelve las compras del comprador del token. Orden:
  1. primero las de eventos que no ocurrieron, por fecha del evento asc (el más cercano arriba);
  2. después las de eventos ya ocurridos, por fecha del evento desc;
  3. desempate por `id` asc.

  Query `.strict()`: `estado?` (uno de `EstadoCompra`), `page`, `limit` (mismos límites que E4; los vacíos se ignoran). Query inválida → 400 "Parámetros de consulta inválidos". Respuesta `{ compras: [CompraResumen], total, page, totalPages }`.
- **C5** `CompraResumen` (forma de `planes/03`): `diasRestantes` sale de `compra.diasRestantes(ahora)` (es `null` si no está CONFIRMADA) y `acciones` sale de `compra.accionesPara(usuario.id, ahora)`. Excepción: `puedeReseniar` es `false` si la compra ya tiene reseña.
- **C6** `CompraDetalle` = `CompraResumen` + `historial` + `resenia`:
  - `historial: [{ estado, quien: { id, nombre }, fechaHora }]` en orden cronológico; `nombre` es el `nombreCompleto()` del usuario;
  - `resenia: { puntuacion, detalle } | null`.
- **C7** Pago (`POST /compras/:id/pago`): `compra.pagar(usuario.id, ahora)`.
  - Evento ocurrido → 422 "No podés pagar una compra de un evento que ya ocurrió" (R3).
  - Estado distinto de PENDIENTE → 422 con el mensaje de la transición, por ejemplo "No se puede pasar de CONFIRMADA a CONFIRMADA".
  - Responde 200 con `CompraDetalle`.
- **C8** Cancelación (`POST /compras/:id/cancelacion`): `compra.cancelar(usuario.id, ahora)`.
  - PENDIENTE → CANCELADA.
  - CONFIRMADA → CANCELADA → REEMBOLSADA (dos cambios en el historial, R2b).
  - En los dos casos libera el cupo.
  - Errores 422: "No podés cancelar una compra utilizada", "La compra ya está cancelada", "No podés cancelar una compra de un evento que ya ocurrió".
  - Responde 200 con `CompraDetalle`.
- **C9** Al leer el detalle, al pagar y al cancelar se hace una sola consulta por request a cada repo (compra y reseña de la compra) y el reloj se lee una sola vez, así la acción y las `acciones` devueltas usan el mismo instante.
  - Los nombres del historial salen de los participantes de la compra (comprador y organizador), los únicos que pueden cambiar su estado; no hace falta consultar el repo de usuarios.
  - Cuando cambia el cupo se guardan la compra **y** el evento, para no depender de que el repo en memoria comparta referencias (pensando en Mongo).

## Contrato de API (cambia `planes/03`)
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/compras` | 🅒 | `{ eventoId, tipoEntradaId, cantidad (1-10) }` | 201 CompraDetalle | 400, 401, 403, 404, 422 |
| GET | `/compras` | 🅒 | `estado?, page, limit` | 200 `{ compras: [CompraResumen], total, page, totalPages }` | 400, 401, 403 |
| GET | `/compras/:id` | 🔐 participante | — | 200 CompraDetalle | 400, 401, 403, 404 |
| POST | `/compras/:id/pago` | 🅒 dueño | — | 200 CompraDetalle | 400, 401, 403, 404, 422 |
| POST | `/compras/:id/cancelacion` | 🅒 dueño | — | 200 CompraDetalle | 400, 401, 403, 404, 422 |

Cambios en `planes/03`:
- `cantidad` va de 1 a 10.
- Nuevo orden de `GET /compras`: primero las próximas y después las pasadas.
- `puedeReseniar` es `false` si la compra ya tiene reseña.

Diseño:
- `CompraService` con `crear`, `listarDelComprador`, `obtener`, `pagar`, `cancelar`, `toResumen` y `toDetalle`.
- `CompraController` y `CompraRoutes`.
- `crearCompraValidation` y `comprasQueryValidation` (con `paginacionValidation`).
- El orden de C4 vive en el service.
- Se reutiliza `paginar` de `services/paginacion.js`.
- El chequeo "dueño de la compra" usa `compra.esDe(id)` y el de "participante" usa `compra.participa(id)`, los dos en el service.

## Pantallas
Ninguna en esta iteración (Comprar, MisCompras y DetalleCompra son de It4).

## Criterios de aceptación
```gherkin
Escenario: comprar
  Dado que estoy logueado como Ana
  Cuando hago POST /compras con 2 entradas Campo de "Los Piojos en River"
  Entonces responde 201 con la compra PENDIENTE, total 90000, historial [PENDIENTE] y acciones puedePagar y puedeCancelar
  Y GET /eventos/<id> muestra 2 Campo disponibles menos que antes

Escenario: errores al comprar
  Cuando hago POST /compras con cantidad 11 o 0, o con un campo de más → 400 "Datos inválidos"
  Y con un evento inexistente → 404 "No existe el evento"
  Y con un tipo que el evento no tiene (los ids de tipo son por evento) → 404 "No existe el tipo de entrada <id> en este evento"
  Y con "Rock en el Parque" (ya ocurrió) → 422 "No podés comprar entradas de un evento que ya ocurrió"
  Y con 3 VIP de "Festival Primavera Sonora" (quedan 2) → 422 "No hay cupo suficiente para VIP"
  Y sin token → 401, y como Fénix → 403

Escenario: mis compras
  Dado que estoy logueado como Ana
  Cuando hago GET /compras
  Entonces vienen sus 8 compras: primero las próximas por fecha asc (Noche de Stand-up, Noche de Tango, Los Piojos, Clásico de Básquet, Hamlet, Festival Primavera Sonora) y después las pasadas por fecha desc (Impro Total, Rock en el Parque)
  Y las CONFIRMADA traen diasRestantes: "Festival Primavera Sonora" 40 y "Noche de Stand-up" 1 (falta medio día), y las demás traen null
  Y "Rock en el Parque" (UTILIZADA y reseñada) trae puedeReseniar false, y "Noche de Tango" (UTILIZADA sin reseña) trae true
  Y con estado=CONFIRMADA vienen solo 2, y con estado=PAGADA o limit=51 responde 400

Escenario: detalle
  Cuando Ana hace GET /compras/<id de Rock en el Parque>
  Entonces trae el historial PENDIENTE (Ana), CONFIRMADA (Ana), UTILIZADA (Fénix) y la reseña con puntuación 5
  Y Fénix (organizador del evento) también puede verla
  Y Bruno o Konex reciben 403, y una compra inexistente da 404

Escenario: pagar
  Cuando Ana paga su compra PENDIENTE de "Los Piojos en River"
  Entonces responde 200 con estado CONFIRMADA, diasRestantes 12 y el cambio en el historial
  Y pagarla de nuevo responde 422 "No se puede pasar de CONFIRMADA a CONFIRMADA"
  Y Bruno recibe 403

Escenario: cancelar con reembolso
  Cuando Ana cancela su compra CONFIRMADA de "Festival Primavera Sonora"
  Entonces responde 200 con estado REEMBOLSADA, y el historial suma CANCELADA y REEMBOLSADA
  Y el evento recupera 2 General disponibles
  Y si cancela su compra PENDIENTE de "Los Piojos" queda CANCELADA

Escenario: no se puede cancelar
  Cuando Ana cancela una compra UTILIZADA → 422 "No podés cancelar una compra utilizada"
  Y una ya cancelada → 422 "La compra ya está cancelada"
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit validación | `crearCompraValidation`: válido; cantidad 0, 11 y 1.5; ids no positivos; campos de más. `comprasQueryValidation`: estado válido e inválido, vacíos, `.strict()` |
| Unit repo | (ya existe `findByComprador`) |
| Unit service | `crear`: evento inexistente 404, delega en el dominio con el reloj, guarda, devuelve detalle. `listarDelComprador`: orden próximas/pasadas con desempate, filtro por estado, paginado, `diasRestantes` y `acciones` con `puedeReseniar` false si hay reseña. `obtener`: 404, 403 si no participa, organizador puede. `pagar`/`cancelar`: 404, 403 si no es dueño, guarda, errores del dominio propagados. `toDetalle`: historial con nombres y reseña |
| Unit controller | cada handler: parsea el id o valida la query, delega con el usuario y responde 200/201; errores a `next` |
| Integración | los 7 escenarios contra la app con el seed |

## Fuera de alcance
- Marcar utilizada y `GET /eventos/:id/compras`: spec 06b.
- Reseñar (`POST /compras/:id/resenia`): spec 07.
- Emitir `compra:estado` por socket al cambiar de estado: spec 08 (chat).
- Vencimiento de compras PENDIENTE: no vencen (ADR-007).
- Pago real: es simulado.
- Swagger: `docs/swagger` al cierre de It2.

## Notas de IA
- Partición por rol, orden de "mis compras", tope de 10 por compra y orden de las compras del organizador: el usuario eligió las opciones que recomendó la IA.
- La IA agregó sin preguntar (revisable):
  - `puedeReseniar` es false si la compra ya tiene reseña. Si no, el front mostraría el botón y el back respondería 409.
  - El 404 va antes que el 403.
  - Usa el mensaje genérico de permisos.
