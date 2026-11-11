# Spec 11 — Mis eventos, compras del evento y marcar utilizada

- **Estado:** aprobada
- **Rama:** `feature/organizador`
- **Casos de uso:** CU2 (ver `planes/00-indice.md`); Marcar utilizada completa el flujo de CU9
- **Iteración:** It4
- **Depende de:** spec 05b (`GET /organizadores/yo/eventos`), spec 06b (`GET /eventos/:id/compras`, `POST /compras/:id/uso`), specs 10c, 10c2 y 10d (DetalleCompra, `useEnvio`, `useRecargarAlVolver`)

## Contexto

El organizador hoy solo ve "Próximamente" en su pestaña. Esta spec le da la lista de sus eventos con cuánto vendió, la pantalla de compras de cada evento con las entradas disponibles por tipo (CU2) y la acción de marcar una entrada como utilizada desde el detalle de la compra, que es lo que habilita la reseña del comprador (CU9). Crear un evento (CU4) queda para la spec 11b.

## Historias

- Como organizador, quiero ver mis eventos con las entradas vendidas y lo recaudado para seguir las ventas.
- Como organizador, quiero ver las compras de un evento, distinguiendo su estado, y cuántas entradas quedan de cada tipo (CU2).
- Como organizador, quiero marcar una entrada como utilizada cuando el comprador asiste, para que pueda reseñar.

## Reglas de negocio

Sin reglas nuevas. Aplican R4 y R9 de `planes/02-dominio.md`, resueltas en el back: `acciones.puedeMarcarUtilizada` es `true` solo para el organizador del evento con la compra CONFIRMADA (también antes de la fecha, ADR-007), y `GET /eventos/:id/compras` responde 403 si el evento es de otro organizador.

Reglas de la pantalla:

- **RO1 MisEventos.** Tab `mis-eventos`: `GET /organizadores/yo/eventos` paginado (10 por página, "cargar más", pull-to-refresh) en una `ListaPaginada` (`lista-mis-eventos`), en el orden del back (fecha asc, incluye pasados). Cada `TarjetaEventoPropio` (`evento-propio-<id>`) muestra nombre, fecha y lugar, `ProgressBar` vendidas/cupo con "N de M vendidas", "Recaudado $X" y, si la fecha del evento ya pasó, un chip "Finalizado" (solo presentación). Tocarla abre `eventos/[id]/compras`. Vacío: "Todavía no publicaste eventos" (`sin-eventos-propios`). Recarga al recuperar el foco (`useRecargarAlVolver`).
- **RO2 ComprasDelEvento.** Ruta `eventos/[id]/compras`, protegida para ORGANIZADOR, título "Compras". `GET /eventos/:id/compras` paginado con filtro por estado (los mismos chips que Mis compras, `filtro-estado-<ESTADO>`):
  - encabezado con el nombre del evento y una tarjeta por tipo (`disponibilidad-<tipoEntradaId>`): nombre, `ProgressBar` vendidas/cupo y "Quedan N" (o "Agotado" si `disponibles` es 0); la disponibilidad no cambia con el filtro;
  - lista de `TarjetaCompra` (`lista-compras-evento`) con el nombre del comprador como título en lugar del evento; tocar una abre DetalleCompra;
  - vacío sin filtro: "Este evento todavía no tiene compras"; con filtro: "No hay compras en estado X" con "Ver todas";
  - error de carga (incluido 403/404 por enlace directo) con el mensaje del back y Reintentar;
  - recarga al recuperar el foco.
- **RO3 Marcar utilizada.** En DetalleCompra, dentro de las acciones: "Marcar utilizada" (`compra-utilizada`, `contained`, ícono `ticket-confirmation-outline`) si `acciones.puedeMarcarUtilizada`. Abre un `Dialog` "¿Marcar la entrada como utilizada?" con el texto "El comprador va a poder reseñar la compra. No se puede deshacer." y los botones "Volver" y "Marcar" (`confirmar-utilizada`). Al confirmar, `POST /compras/:id/uso` con `useEnvio` (loading y botones deshabilitados, sin doble pedido); éxito → la pantalla se actualiza con el `CompraDetalle` de la respuesta y Snackbar "Entrada marcada como utilizada"; error → `compra-accion-error` con el texto del back y, si es 422, recarga de la compra (RA5 de 10c2).
- **RO4 Reseña vista por el organizador.** La sección `compra-resenia` (RR7 de 10d) se titula "Reseña del comprador" cuando el usuario es ORGANIZADOR y "Tu reseña" cuando es COMPRADOR.

## Contrato de API

Sin cambios. Usa tal cual `planes/03`:

| Función | Endpoint |
| --- | --- |
| `organizadoresApi.listarMisEventos({ page, limit })` | `GET /organizadores/yo/eventos` → `{ eventos: [EventoResumen + vendidas, cupo, recaudado], total, page, totalPages }` |
| `eventosApi.listarComprasDelEvento(id, { estado, page, limit })` | `GET /eventos/:id/compras` → `{ evento, disponibilidad, compras, total, page, totalPages }` |
| `comprasApi.marcarUtilizada(id)` | `POST /compras/:id/uso` → `CompraDetalle` |

Mensajes del back que se pueden mostrar: "No se puede pasar de <ESTADO> a UTILIZADA" (422), "No tenés permiso para realizar esta acción" (403), "No existe la compra" / "No existe el evento" (404), "No pudimos conectar con el servidor".

## Pantallas

- **MisEventos** (`(organizador)/mis-eventos`, `src/pantallas/mis-eventos/`): `lista-mis-eventos`, `evento-propio-<id>`, `sin-eventos-propios`, `cargar-mas`.
- **ComprasDelEvento** (`eventos/[id]/compras`, `src/pantallas/compras-evento/`): `disponibilidad-<tipoEntradaId>`, `filtro-estado-<ESTADO>`, `lista-compras-evento`, `compra-<id>`, `ver-todas`.
- **DetalleCompra**: suma `compra-utilizada` y `confirmar-utilizada`; reusa `compra-accion-error` y `compra-aviso`.
- Compartidos: el filtro por estado de Mis compras pasa a `components/FiltroEstadoCompra`; `TarjetaCompra` acepta mostrar el comprador como título.

## Criterios de aceptación

```gherkin
Escenario: ver mis eventos con sus ventas
  Dado que estoy logueado como Fénix
  Cuando abro la tab "Mis eventos"
  Entonces veo mis eventos en orden de fecha, cada uno con "N de M vendidas" y lo recaudado
  Y los eventos que ya ocurrieron tienen el chip "Finalizado"

Escenario: organizador sin eventos
  Dado que el organizador no tiene eventos
  Cuando abro la tab "Mis eventos"
  Entonces veo "Todavía no publicaste eventos"

Escenario: ver las compras y la disponibilidad de un evento
  Dado que estoy en "Mis eventos"
  Cuando toco "Festival Primavera Sonora"
  Entonces veo una tarjeta por tipo de entrada con vendidas, cupo y "Quedan N" o "Agotado"
  Y la lista de compras con el nombre del comprador y el estado de cada una

Escenario: filtrar las compras por estado
  Dado que estoy en las compras de un evento
  Cuando elijo el estado "Utilizada" y no hay compras en ese estado
  Entonces veo "No hay compras en estado Utilizada" y el botón "Ver todas"
  Y la disponibilidad por tipo no cambia

Esquema del escenario: botón Marcar utilizada según las acciones
  Dado que abro una compra con acciones.puedeMarcarUtilizada <puede>
  Entonces el botón "Marcar utilizada" <se ve>

  Ejemplos:
    | puede | se ve         |
    | true  | se muestra    |
    | false | no se muestra |

Escenario: marcar una entrada como utilizada
  Dado que soy Fénix y abro una compra CONFIRMADA de mi evento
  Cuando toco "Marcar utilizada" y después "Volver"
  Entonces no se llama al back
  Cuando toco "Marcar utilizada" y confirmo
  Entonces la compra queda "Utilizada" con el aviso "Entrada marcada como utilizada"
  Y ya no veo el botón "Marcar utilizada"

Escenario: error al marcar utilizada
  Dado que la compra dejó de estar confirmada
  Cuando confirmo "Marcar utilizada" y el back responde 422 "No se puede pasar de CANCELADA a UTILIZADA"
  Entonces veo ese texto y la compra se vuelve a pedir

Escenario: el organizador ve la reseña del comprador
  Dado que soy Fénix y abro una compra UTILIZADA con reseña
  Entonces veo "Reseña del comprador" con las estrellas y el comentario
```

8 escenarios.

## Plan de tests

| Nivel | Caso |
| --- | --- |
| Front (RNTL) `MisEventos` | lista con vendidas/cupo, recaudado y "Finalizado" solo en pasados (con fecha fija); tocar abre `/eventos/<id>/compras`; vacío; error con reintento; cargar más; recarga al volver |
| Front (RNTL) `ComprasDelEvento` | disponibilidad con "Quedan N" y "Agotado"; compras con el nombre del comprador; filtro manda `estado` y no cambia la disponibilidad; vacío con y sin filtro; tocar abre `/compras/<id>`; error 403 con el texto del back; recarga al volver |
| Front (RNTL) `DetalleCompra` | `compra-utilizada` según `puedeMarcarUtilizada`; diálogo con Volver sin pedido; confirmar → `marcarUtilizada(7)`, actualiza y avisa; doble toque un solo pedido; 422 con texto y recarga; título de la reseña según rol |
| Front (RNTL) componentes/api | `TarjetaCompra` con comprador; `FiltroEstadoCompra`; `listarMisEventos`, `listarComprasDelEvento`, `marcarUtilizada` en `recursosApi.test.js` |
| E2E (temporal, se borra) | Fénix entra a un evento desde Mis eventos, abre una compra confirmada, la marca utilizada y la ve con el filtro "Utilizada" |

## Fuera de alcance

- Crear evento y el FAB "Nuevo evento" (spec 11b).
- Editar o borrar eventos (no están en la consigna).
- Chat de la compra (spec 12).
- Totales de recaudación por estado o gráficos.

## Notas de IA

- Preguntas a la IA, el usuario eligió las opciones recomendadas: partir en 11 (MisEventos, ComprasDelEvento y Marcar utilizada) y 11b (CrearEvento); tarjeta de MisEventos con ventas, recaudado y chip "Finalizado" que abre ComprasDelEvento; Marcar utilizada con diálogo de confirmación y Snackbar, como Cancelar.
- La IA agregó sin preguntar (revisable): título "Reseña del comprador" para el organizador (en 10d la sección decía "Tu reseña" para cualquiera); `TarjetaCompra` con el comprador como título en ComprasDelEvento; extraer el filtro por estado de Mis compras a un componente; error 403/404 de ComprasDelEvento con `ErrorCarga` (la lista paginada no distingue el código); testIDs `lista-mis-eventos`, `evento-propio-<id>`, `sin-eventos-propios`, `lista-compras-evento`, `confirmar-utilizada`; textos "Todavía no publicaste eventos", "Este evento todavía no tiene compras", "Entrada marcada como utilizada".
