# Spec 10d — Reseñar una compra y tab Favoritos

- **Estado:** aprobada
- **Rama:** `feature/resenar-favoritos`
- **Casos de uso:** CU9 (ver `planes/00-indice.md`), extra Favoritos
- **Iteración:** It4
- **Depende de:** spec 07 (`POST /compras/:id/resenia`, `GET /usuarios/yo/favoritos`), spec 10 (`TarjetaEvento`, `Estrellas`, botón favorito), specs 10c y 10c2 (DetalleCompra, `useEnvio`)

## Contexto

Cuando el organizador marca una compra como utilizada, el comprador puede puntuarla de 1 a 5 y comentar su experiencia (CU9). El back ya implementa la reseña (spec 07) y expone `acciones.puedeReseniar` y `compra.resenia` en el detalle; falta la pantalla Reseñar, el botón en DetalleCompra y mostrar la reseña ya hecha. Además, la tab Favoritos del comprador sigue en "Próximamente": esta spec la completa con la lista de eventos guardados desde el botón favorito de DetalleEvento.

## Historias

- Como comprador, quiero puntuar y comentar una compra utilizada para contar mi experiencia (CU9).
- Como comprador, quiero ver en el detalle de la compra la reseña que dejé.
- Como comprador, quiero ver en una pestaña los eventos que guardé como favoritos para volver a ellos.

## Reglas de negocio

Sin reglas nuevas. R5 de `planes/02-dominio.md` la resuelve el back: `acciones.puedeReseniar` es `true` solo para el comprador dueño, con la compra UTILIZADA y sin reseña. El front no reimplementa la regla.

Reglas de la pantalla:

- **RR1 Botón Reseñar.** En DetalleCompra, en la zona de acciones (RA1 de 10c2): "Reseñar" (`compra-resenar`, `contained`, ícono `star-outline`) si `compra.acciones.puedeReseniar`; navega con `router.push` a `compras/[id]/resenia`. La ruta queda protegida para COMPRADOR, como `eventos/[id]/comprar`.
- **RR2 Carga.** Reseñar carga la compra con `ConRecursoDeRuta` + `obtenerCompra` (cargando, error con reintento, 403/404 con Volver). Muestra el nombre del evento arriba del formulario. Si `acciones.puedeReseniar` es `false` (por ejemplo, ya reseñada o deep link a una compra no utilizada), muestra `EstadoVacio` "Esta compra no se puede reseñar" con "Volver" (`resenia-no-disponible`) en lugar del formulario.
- **RR3 Formulario.**
  - `Estrellas` editables: cinco `IconButton` (`estrella-<n>`, `accessibilityLabel` "Puntuar n de 5"); tocar la n-ésima deja la puntuación en n y pinta llenas las n primeras. Sin elegir, todas vacías.
  - `TextInput` multilínea "Contá tu experiencia" (`resenia-detalle`), `maxLength` 500, con contador "n/500" debajo.
  - "Enviar" (`resenia-enviar`) deshabilitado hasta tener puntuación y detalle no vacío sin espacios de los costados. Se envía `{ puntuacion, detalle: detalle.trim() }`.
- **RR4 Envío.** Con `useEnvio` (guard de doble toque, loading en "Enviar" y formulario deshabilitado mientras tanto). Éxito (201) → `router.dismissTo({ pathname: "/compras/[id]", params: { id, aviso: "resenia" } })`: vuelve al DetalleCompra que estaba abajo (o lo reemplaza si se entró por deep link).
- **RR5 Errores.** Cualquier error del envío se muestra con el texto de `mensajeDeError` en un `HelperText` bajo "Enviar" (`resenia-error`), que se limpia al reintentar: 409 "Ya reseñaste esta compra", 422 "Solo podés reseñar una compra utilizada", 403, 404, 400 o "No pudimos conectar con el servidor". No se recarga la compra (el mensaje del back ya explica el motivo y la recarga reemplazaría el formulario y el mensaje por RR2); el comprador vuelve con la flecha.
- **RR6 DetalleCompra al volver.** DetalleCompra recarga la compra al recuperar el foco (mismo hook que Mis compras, que pasa a `src/hooks/useRecargarAlVolver.js`), así muestra la reseña y deja de mostrar "Reseñar". Si llega `aviso=resenia` en los parámetros, muestra el Snackbar `compra-aviso` "¡Gracias por tu reseña!" y limpia el parámetro al cerrarse (`router.setParams`).
- **RR7 Reseña en DetalleCompra.** Si `compra.resenia` no es `null`, sección "Tu reseña" (`compra-resenia`) después de las acciones y antes del historial: `Estrellas` con la puntuación y el detalle. La ve cualquiera que vea la compra (comprador u organizador del evento).
- **RF10 Favoritos.** Tab Favoritos (`favoritos`): `GET /usuarios/yo/favoritos` (sin paginar, incluye eventos pasados, en el orden del back) en una `ListaPaginada` de `TarjetaEvento` (`lista-favoritos`); tocar una tarjeta abre DetalleEvento. Estados: cargando, error con reintento, pull-to-refresh, vacío "Todavía no guardaste eventos" con "Explorar eventos" (`sin-favoritos`, `ir-a-explorar`). Recarga al recuperar el foco (`useRecargarAlVolver`) para reflejar lo que se marcó o quitó en DetalleEvento. No se quita desde la lista.

## Contrato de API

Sin cambios. Usa tal cual `planes/03`:

| Función | Endpoint |
| --- | --- |
| `comprasApi.reseniarCompra(id, { puntuacion, detalle })` | `POST /compras/:id/resenia` → 201 `Resenia` |
| `favoritosApi.listarFavoritos()` | `GET /usuarios/yo/favoritos` → 200 `[EventoResumen]` |
| `comprasApi.obtenerCompra(id)` (existente) | `GET /compras/:id` → `CompraDetalle` con `resenia` y `acciones.puedeReseniar` |

## Pantallas

- **Reseñar** (`compras/[id]/resenia`, `src/pantallas/resenar/`): `estrella-<n>`, `resenia-detalle`, `resenia-enviar`, `resenia-error`, `resenia-no-disponible`. Lógica del formulario en un hook de la pantalla (`useResenia`).
- **DetalleCompra**: suma `compra-resenar` y `compra-resenia`; reusa `compra-aviso` para el aviso de RR6.
- **Favoritos** (`(comprador)/favoritos`, `src/pantallas/favoritos/`): `lista-favoritos`, `tarjeta-evento-<id>`, `sin-favoritos`, `ir-a-explorar`.
- **`Estrellas`**: suma la variante editable (`onElegir`); la de solo lectura no cambia.

## Criterios de aceptación

```gherkin
Esquema del escenario: botón Reseñar según las acciones de la compra
  Dado que abro una compra con acciones.puedeReseniar <puede>
  Entonces el botón "Reseñar" <se ve>

  Ejemplos:
    | puede | se ve       |
    | true  | se muestra  |
    | false | no se muestra |

Escenario: abrir Reseñar de una compra que no se puede reseñar
  Dado que abro compras/7/resenia y la compra tiene acciones.puedeReseniar false
  Entonces veo "Esta compra no se puede reseñar" y el botón "Volver"
  Y no veo el formulario

Escenario: Enviar habilitado solo con puntuación y comentario
  Dado que estoy en Reseñar de una compra reseñable
  Cuando toco la estrella 4 y escribo "   "
  Entonces "Enviar" está deshabilitado
  Cuando escribo "Muy bueno"
  Entonces "Enviar" está habilitado y el contador dice "9/500"

Escenario: reseñar una compra utilizada
  Dado que estoy logueada como Ana en Reseñar de su compra UTILIZADA
  Cuando elijo 5 estrellas, escribo "  Excelente show  " y toco "Enviar"
  Entonces se envía { puntuacion: 5, detalle: "Excelente show" }
  Y vuelvo al detalle de la compra con el aviso "¡Gracias por tu reseña!"
  Y veo "Tu reseña" con 5 estrellas y "Excelente show"
  Y ya no veo el botón "Reseñar"

Esquema del escenario: error al enviar la reseña
  Dado que estoy en Reseñar con el formulario completo
  Cuando toco "Enviar" y el back responde <status> "<mensaje>"
  Entonces veo "<mensaje>" bajo "Enviar" y sigo en el formulario con lo que escribí

  Ejemplos:
    | status | mensaje                                  |
    | 409    | Ya reseñaste esta compra                 |
    | 422    | Solo podés reseñar una compra utilizada  |

Escenario: ver la reseña de una compra utilizada
  Dado que abro una compra UTILIZADA con resenia { puntuacion: 4, detalle: "Buen sonido" }
  Entonces veo "Tu reseña" con 4 estrellas y "Buen sonido"

Escenario: ver mis favoritos
  Dado que Ana tiene 2 eventos favoritos
  Cuando abro la tab Favoritos
  Entonces veo las 2 tarjetas en el orden del back
  Cuando toco una tarjeta
  Entonces se abre el detalle de ese evento
  Y al volver a la tab la lista se vuelve a pedir

Escenario: sin favoritos
  Dado que Ana no tiene favoritos
  Cuando abro la tab Favoritos
  Entonces veo "Todavía no guardaste eventos" y el botón "Explorar eventos"
  Cuando lo toco
  Entonces voy a la tab Explorar
```

8 escenarios: no hace falta partirla.

## Plan de tests

| Nivel | Caso |
| --- | --- |
| Front (RNTL) `Estrellas` | editable: tocar `estrella-3` llama `onElegir(3)` y pinta 3 llenas; label "Puntuar 3 de 5"; la de solo lectura sigue igual |
| Front (RNTL) `Resenar` | cargando; compra no reseñable → `resenia-no-disponible`; 404 → Volver; Enviar deshabilitado sin puntuación o con detalle en blanco; contador; envío con `trim` y `dismissTo` con `aviso`; doble toque hace un solo pedido (`promesaManual`); 409 y 422 con texto exacto sin recargar; nombre del evento |
| Front (RNTL) `DetalleCompra` | `compra-resenar` según `puedeReseniar` y navega a `/compras/7/resenia`; sección `compra-resenia` si hay reseña y no si es `null`; Snackbar con `aviso=resenia`; recarga al recuperar el foco |
| Front (RNTL) `Favoritos` | lista de tarjetas y navegación; vacío con "Explorar eventos"; error con reintento; recarga al volver |
| Front (RNTL) hooks/api | `useRecargarAlVolver` saltea el primer foco; `reseniarCompra` y `listarFavoritos` en `recursosApi.test.js` |
| E2E (temporal, se borra) | contra el back real: reseñar una compra utilizada y ver la reseña; marcar un favorito y verlo en la tab |

## Fuera de alcance

- Editar o borrar una reseña (el back no lo permite).
- Quitar favoritos desde la lista (se hace desde DetalleEvento).
- Marcar utilizada (spec 11) y chat (spec 12).
- Paginación de favoritos (el back devuelve todo).

## Notas de IA

- Decidido por el usuario antes de la spec: botón desde `compra.acciones.puedeReseniar`; pantalla `compras/[id]/resenia` con `Estrellas` editables (`estrella-<n>`), `resenia-detalle` (1-500) y `resenia-enviar`; 409 y 422 con el texto exacto del back; tab Favoritos con `GET /usuarios/yo/favoritos` y `TarjetaEvento`; mostrar `compra.resenia` en DetalleCompra.
- Preguntas a la IA, el usuario eligió las opciones recomendadas: Reseñar carga la compra y, si no es reseñable, muestra un estado vacío con Volver; al reseñar vuelve a DetalleCompra, que recarga y muestra el Snackbar "¡Gracias por tu reseña!"; "Enviar" deshabilitado hasta completar, con contador; Favoritos con recarga al volver y sin quitar desde la lista.
- La IA agregó sin preguntar (revisable): `router.dismissTo` con parámetro `aviso` para llevar el Snackbar; no recargar en 422 (a diferencia de 10c2) porque la recarga reemplazaría el formulario y el mensaje; extraer `useRecargarAlVolver` de Mis compras a `src/hooks/`; testIDs `resenia-error`, `resenia-no-disponible`, `compra-resenia`, `lista-favoritos`, `sin-favoritos`; nombres `reseniarCompra`, `listarFavoritos`, `useResenia`; textos "Contá tu experiencia", "Tu reseña", "Todavía no guardaste eventos".
