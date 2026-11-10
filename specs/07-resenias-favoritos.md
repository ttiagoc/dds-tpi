# Spec 07 — Reseñas y favoritos

- **Estado:** aprobada
- **Rama:** `feature/resenias-favoritos`
- **Casos de uso:** CU9 (reseñar una compra utilizada), CU10 (reseñas del organizador), extra Favoritos
- **Iteración:** It2
- **Depende de:** spec 05 (`EventoResumen`, puntaje promedio R6), spec 06/06b (compra UTILIZADA, `acciones.puedeReseniar`)

## Contexto
Cuando el organizador marca la entrada como utilizada, el comprador puede puntuar y comentar su experiencia. Esas reseñas forman la reputación del organizador (puntaje promedio, ya calculado en la spec 05) y se muestran en el detalle del evento. Además, el comprador puede guardar eventos como favoritos y verlos en su pestaña Favoritos. Es la base de las pantallas Reseñar, DetalleEvento (reseñas y botón favorito) y Favoritos (It4).

## Historias
- Como comprador, quiero puntuar de 1 a 5 y comentar una compra utilizada para contar mi experiencia (CU9).
- Como comprador, quiero ver las reseñas del organizador de un evento antes de comprar (CU10).
- Como comprador, quiero guardar eventos como favoritos y verlos en una lista (extra).

## Reglas de negocio
Aplican R5 y R6 de `planes/02-dominio.md`.

### Reseñas
- **RF1** `POST /compras/:id/resenia` usa `autenticar` + `autorizar(COMPRADOR)`: sin token → 401; organizador → 403 "No tenés permiso para realizar esta acción".
- **RF2** Body `.strict()`: `puntuacion` entero de 1 a 5, `detalle` string de 1 a 500 caracteres (sin espacios de los costados). Cualquier otra cosa → 400 (por ejemplo 0, 6 o 3.5).
- **RF3** Orden de chequeos (R5):
  1. id inválido → 400;
  2. compra inexistente → 404 "No existe la compra";
  3. la compra no es del comprador → 403;
  4. ya tiene reseña → 409 "Ya reseñaste esta compra";
  5. la compra no está UTILIZADA → 422 "Solo podés reseñar una compra utilizada" (de `Resenia.crear`).
- **RF4** La reseña toma `fecha = ahora`. Responde 201 con `Resenia`: `{ id, compraId, puntuacion, detalle, fecha, evento: { id, nombre }, comprador: { nombre } }`. Después de reseñar, la compra muestra `resenia` y `acciones.puedeReseniar: false` (ya implementado en la spec 06).
- **RF5** `GET /organizadores/:id/resenias` es público (🔓):
  - id inválido → 400; si el usuario no existe o no es ORGANIZADOR → 404 "No existe el organizador".
  - Query `.strict()`: `page`, `limit`.
  - Respuesta `{ organizador: { id, nombre, puntajePromedio, cantidadResenias }, resenias: [Resenia], total, page, totalPages }`.
  - Las reseñas van de la más nueva a la más vieja (`fecha` desc y después `id` desc).
  - Sin reseñas: `resenias: []`, `puntajePromedio: null`, `cantidadResenias: 0`.
  - `puntajePromedio` y `cantidadResenias` son sobre todas las reseñas, no sobre la página.

### Favoritos
- **RF6** Los tres endpoints usan `autenticar` + `autorizar(COMPRADOR)`: sin token → 401; organizador → 403.
- **RF7** `GET /usuarios/yo/favoritos` → 200 `[EventoResumen]`, sin paginar:
  - van todos los favoritos, incluidos los eventos que ya ocurrieron;
  - ordenados por fecha del evento asc y después por id asc;
  - `esFavorito: true` y `organizador.puntajePromedio` calculado una vez por request (R6).
- **RF8** `PUT /usuarios/yo/favoritos/:eventoId`:
  - eventoId inválido → 400; evento inexistente → 404 "No existe el evento".
  - Si no, `usuario.agregarFavorito(eventoId)` y 204. Es idempotente y se permite un evento pasado.
- **RF9** `DELETE /usuarios/yo/favoritos/:eventoId`:
  - eventoId inválido → 400;
  - si no, `usuario.quitarFavorito(eventoId)` y 204, aunque no fuera favorito o el evento no exista (idempotente).

## Contrato de API (completa `planes/03`)
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/compras/:id/resenia` | 🅒 dueño | `{ puntuacion, detalle }` | 201 `Resenia` | 400, 401, 403, 404, 409, 422 |
| GET | `/organizadores/:id/resenias` | 🔓 | `page, limit` | 200 `{ organizador, resenias, total, page, totalPages }` | 400, 404 |
| GET | `/usuarios/yo/favoritos` | 🅒 | — | 200 `[EventoResumen]` | 401, 403 |
| PUT | `/usuarios/yo/favoritos/:eventoId` | 🅒 | — | 204 | 400, 401, 403, 404 |
| DELETE | `/usuarios/yo/favoritos/:eventoId` | 🅒 | — | 204 | 400, 401, 403 |

Cambios en `planes/03`:
- se define la forma de `Resenia` y el orden de las reseñas;
- se define el orden de los favoritos y que incluyen pasados;
- se completan los errores.

Diseño:
- `ReseniaService`:
  - `crear(compraId, body, usuario)` usa `compraRepository` y `reseniaRepository`;
  - `listarDelOrganizador(organizadorId, query)` usa `usuarioRepository` y `reseniaRepository.findByOrganizador`;
  - `toResponse(resenia)`.
- `FavoritoService`:
  - `listar(usuario)`, `agregar(eventoId, usuario)` y `quitar(eventoId, usuario)`, con `usuarioRepository` y `eventoRepository`;
  - para armar los `EventoResumen` reutiliza `EventoService` (se extrae `resumenes(eventos, usuario)` de `buscar`, que calcula los puntajes una vez).
- Rutas:
  - `POST /compras/:id/resenia` en `CompraRoutes` (controller `ReseniaController`);
  - `GET /organizadores/:id/resenias` en `OrganizadorRoutes`;
  - `UsuarioRoutes` nuevo, montado en `/usuarios`.
- `MENSAJE_ORGANIZADOR_INEXISTENTE` y `MENSAJE_COMPRA_RESENIADA` en `src/errors/mensajes.js`.

## Pantallas
Ninguna en esta iteración (Reseñar, Favoritos y las reseñas de DetalleEvento son de It4).

## Criterios de aceptación
```gherkin
Escenario: reseñar una compra utilizada
  Dado que estoy logueada como Ana
  Cuando hago POST /compras/<id de su compra UTILIZADA a "Impro Total">/resenia con { puntuacion: 5, detalle: "Genial" }
  Entonces responde 201 con puntuacion 5, evento "Impro Total" y comprador "Ana Pérez"
  Y GET /compras/<esa compra> trae resenia { puntuacion: 5, detalle: "Genial" } y puedeReseniar false
  Y GET /organizadores/<id de Konex>/resenias trae cantidadResenias 3 y puntajePromedio 4

Escenario: no se puede reseñar
  Cuando Ana reseña su compra de "Rock en el Parque" (ya reseñada) → 409 "Ya reseñaste esta compra"
  Y Ana reseña su compra CONFIRMADA de "Festival Primavera Sonora" → 422 "Solo podés reseñar una compra utilizada"
  Y Bruno reseña la compra de Ana a "Impro Total" → 403
  Y Fénix → 403, sin token → 401, compra inexistente → 404

Escenario: body inválido de la reseña
  Cuando Ana reseña con puntuacion 0, 6 o 3.5, sin detalle, con 501 caracteres o con un campo de más → 400

Escenario: reseñas de un organizador
  Dado que no estoy logueado
  Cuando hago GET /organizadores/<id de Fénix>/resenias
  Entonces trae organizador { nombre: "Fénix Producciones", puntajePromedio: 4.5, cantidadResenias: 2 }
  Y las 2 reseñas de "Rock en el Parque", de la más nueva a la más vieja
  Y con limit=1 trae 1 reseña, total 2 y totalPages 2

Escenario: errores de reseñas de un organizador
  Cuando pido las reseñas del id de Ana (compradora) o de un id inexistente → 404 "No existe el organizador"
  Y con un id inválido o limit=51 → 400

Escenario: favoritos
  Dado que estoy logueada como Ana
  Cuando hago GET /usuarios/yo/favoritos
  Entonces trae "Hamlet" y "Fiesta Electrónica al Aire Libre", en ese orden, con esFavorito true
  Cuando hago PUT /usuarios/yo/favoritos/<id de "Los Piojos en River"> dos veces → 204 las dos veces
  Entonces la lista trae Los Piojos primero y una sola vez
  Cuando hago PUT del id de "Rock en el Parque" (ya ocurrió) → 204 y aparece primera en la lista (es la fecha más vieja)
  Cuando hago DELETE de Hamlet → 204, y otra vez → 204
  Entonces Hamlet ya no está en la lista y GET /eventos/<id de Hamlet> trae esFavorito false

Escenario: errores de favoritos
  Cuando Ana hace PUT de un evento inexistente → 404 "No existe el evento"
  Y PUT o DELETE con un id inválido → 400
  Y Fénix → 403 en los tres endpoints, sin token → 401
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit dominio | ya cubierto: `Resenia.crear` (solo UTILIZADA), `Resenia.promedio`, `Usuario.agregarFavorito`/`quitarFavorito` (idempotencia). Agregar `quitarFavorito` de un id que no está, si falta |
| Unit service | `ReseniaService.crear`: 404, 403, 409 antes que 422, 422 propagado, guarda con `fecha = ahora`, forma de la respuesta. `listarDelOrganizador`: 404 (inexistente y comprador), orden fecha desc e id desc, paginado, promedio y cantidad sobre el total, vacío con null. `FavoritoService`: listar en orden con pasados y esFavorito true, agregar (404, idempotente, guarda el usuario), quitar (idempotente, sin validar el evento) |
| Unit controller | `ReseniaController.crear` (201) y `listarDelOrganizador`; `FavoritoController` listar (200), agregar y quitar (204, `send()` sin cuerpo); id inválido → 400 a `next`; errores a `next` |
| Unit validación | body de la reseña: `.strict()`, entero 1-5, detalle 1-500 con trim |
| Integración | los 7 escenarios contra la app con el seed |

## Fuera de alcance
- Editar o borrar una reseña.
- Reseñas por evento (`GET /eventos/:id/resenias`): DetalleEvento usa las del organizador (CU10).
- Notificar por socket una reseña nueva.
- Pantallas Reseñar y Favoritos (It4).

## Notas de IA
- El usuario eligió:
  - que el 201 devuelva la reseña (la misma forma que en el listado) y no la compra;
  - reseñas del organizador de la más nueva a la más vieja, con 404 si el id no es de un organizador;
  - favoritos por fecha del evento asc, incluidos los pasados;
  - PUT y DELETE de favoritos permisivos.
- La IA agregó sin preguntar (revisable):
  - el orden de los chequeos de la reseña (409 antes que 422);
  - el mensaje 409 "Ya reseñaste esta compra";
  - que `puntajePromedio` y `cantidadResenias` se calculan sobre todas las reseñas y no sobre la página;
  - `FavoritoService` reutiliza `EventoService` para armar los `EventoResumen`;
  - `UsuarioRoutes` nuevo en `/usuarios`.
