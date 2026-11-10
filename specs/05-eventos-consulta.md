# Spec 05 — Consulta de eventos (categorías, búsqueda, orden y detalle)

- **Estado:** aprobada
- **Rama:** `feature/eventos-consulta`
- **Casos de uso:** CU3, CU11, CU10 (parcial: puntaje del organizador en el listado y el detalle)
- **Iteración:** It2

## Contexto
El comprador necesita descubrir eventos: buscarlos por texto, filtrarlos por categoría y precio, ordenarlos y ver el detalle con la disponibilidad de cada tipo de entrada. Es la base de las pantallas Explorar y DetalleEvento (It4) y del flujo de compra (spec 06). La creación de eventos y "mis eventos" del organizador van en la spec 05b.

## Historias
- Como comprador, quiero buscar eventos por texto o explorarlos por categoría para encontrar lo que me interesa (CU3).
- Como comprador, quiero ordenar los resultados por fecha, precio o puntaje del organizador (CU11).
- Como comprador, quiero ver el detalle de un evento con sus tipos de entrada, lo que queda disponible y el puntaje del organizador antes de comprar (CU10).

## Reglas de negocio
Aplican R6 (puntaje del organizador) y R10 (por defecto, solo eventos no ocurridos) de `planes/02-dominio.md`.

- **E1** `GET /categorias` devuelve todas las categorías ordenadas por `id`: `[{ id, nombre, descripcion }]`.
- **E2** Filtros de `GET /eventos`, combinados con Y:
  - `q` (se recorta; si queda vacío se ignora): `evento.coincideCon(q)`, por nombre o descripción, sin mayúsculas ni acentos.
  - `categoria`: id de categoría. Si no existe → 200 con lista vacía.
  - `precioMin` / `precioMax`: `evento.tuPrecioEstaEntre(min, max)`, es decir, algún tipo con precio en el rango (bordes incluidos). Se puede mandar uno solo.
  - `incluirPasados` (`"true"` | `"false"`, por defecto `false`): sin él, se excluyen los eventos con `yaOcurrio(ahora)` (R10).
- **E3** Orden:
  - `ordenarPor=fecha` (por defecto) → por `fecha`; `precio` → por `precioMinimo()`; `puntaje` → por el `puntajePromedio` del organizador.
  - `orden` por defecto `asc` (y `desc` si `ordenarPor=puntaje`).
  - Con `puntaje`, los organizadores sin reseñas van **siempre al final**, cualquiera sea el `orden`.
  - Desempate estable: `fecha` asc y después `id` asc.
- **E4** Paginado: `page` ≥ 1 (por defecto 1), `limit` 1-50 (por defecto 20). Respuesta `{ eventos, total, page, totalPages }` con `totalPages = Math.ceil(total / limit)` (0 si no hay resultados). Una página más allá de la última → 200 con `eventos: []`.
- **E5** Query inválida → 400 "Parámetros de consulta inválidos" con `details`. Por ejemplo: `limit` > 50, `ordenarPor`/`orden` fuera de los valores, `incluirPasados` que no es `true`/`false`, precios negativos, `q` de más de 100 caracteres, o `precioMin > precioMax` (detalle en el campo `precioMin`: "precioMin no puede ser mayor que precioMax"). Los parámetros desconocidos también dan 400 (`.strict()`).
- **E6** Puntaje (R6): el service arma un `Map organizadorId → promedio` **una sola vez por request** a partir de las reseñas (`Resenia.promedio`, 1 decimal, `null` si no tiene).
- **E7** `EventoResumen` (planes/03): `precioDesde = precioMinimo()`, `imagen = multimedia[0] ?? null`, `organizador = { id, nombre: nombreCompleto(), puntajePromedio }`, y `esFavorito` es `true` solo si hay sesión de COMPRADOR y el evento está en sus favoritos (si no, `false`).
- **E8** `GET /eventos/:id` devuelve `EventoDetalle` aunque el evento ya haya ocurrido (R10 aplica solo a la búsqueda). `tiposEntrada: [{ id, nombre, descripcion, precio, cupo, disponibles }]`. Si no existe → 404 "No existe el evento"; si el id no es un entero positivo → 400 "El id debe ser un entero positivo".
- **E9** Los dos endpoints de eventos usan `autenticarOpcional`: un token inválido o vencido no da 401, sigue como anónimo (A4).

## Contrato de API (ya está en `planes/03`)
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| GET | `/categorias` | 🔓 | — | 200 `[{ id, nombre, descripcion }]` | |
| GET | `/eventos` | 🔓 (opcional) | `q, categoria, precioMin, precioMax, ordenarPor, orden, incluirPasados, page, limit` | 200 `{ eventos: [EventoResumen], total, page, totalPages }` | 400 |
| GET | `/eventos/:id` | 🔓 (opcional) | — | 200 EventoDetalle | 400, 404 |

Diseño: el filtrado vive en `EventoRepository.buscar(filtros, ahora)`. El orden y el paginado van en `EventoService`, porque el orden por puntaje necesita las reseñas. La validación es `eventosQueryValidation` (zod, `.strict()`, `z.coerce` para los números, `superRefine` para el rango de precios).

## Pantallas
Ninguna en esta iteración (Explorar y DetalleEvento son de It4).

## Criterios de aceptación
```gherkin
Escenario: categorías
  Cuando hago GET /categorias
  Entonces responde 200 con las 6 categorías sembradas ordenadas por id

Escenario: búsqueda por texto sin acentos ni mayúsculas, combinada con categoría
  Cuando hago GET /eventos?q=PIOJOS&categoria=<id de Recitales>
  Entonces responde 200 y solo vienen eventos de Recitales cuyo nombre o descripción contiene "piojos"
  Y con ?categoria=999 responde 200 con eventos [] y total 0

Escenario: eventos pasados
  Cuando hago GET /eventos sin incluirPasados
  Entonces no viene ningún evento con fecha <= ahora
  Y con incluirPasados=true sí vienen

Escenario: filtro y orden por precio
  Cuando hago GET /eventos?precioMin=10000&precioMax=20000&ordenarPor=precio&orden=desc
  Entonces cada evento tiene algún tipo con precio en [10000, 20000] y vienen ordenados por precioDesde de mayor a menor

Escenario: orden por puntaje
  Cuando hago GET /eventos?ordenarPor=puntaje&incluirPasados=true
  Entonces vienen de mayor a menor puntajePromedio y los de organizadores sin reseñas al final
  Y con orden=asc los sin reseñas siguen al final

Escenario: paginado y query inválida
  Cuando hago GET /eventos?limit=2&page=2
  Entonces vienen 2 eventos, page 2, y total y totalPages coherentes con el seed
  Y con limit=51, ordenarPor=nombre, incluirPasados=si, precioMin=-1, precioMin=500&precioMax=100 o un parámetro desconocido responde 400 "Parámetros de consulta inválidos"

Escenario: favoritos con sesión
  Dado que Ana tiene un evento en favoritos
  Cuando lo busca con su token
  Entonces ese evento viene con esFavorito true y el resto false
  Y sin token, o con un token inválido, responde 200 con esFavorito false en todos

Escenario: detalle
  Cuando hago GET /eventos/<id> de un evento pasado
  Entonces responde 200 con descripcion, multimedia, tiposEntrada con disponibles = cupo - vendidas y el puntajePromedio del organizador
  Y con un id inexistente responde 404 "No existe el evento", y con "abc" responde 400
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit repo | `EventoRepository.buscar`: texto, categoría, rango de precio (un borde, los dos), pasados sí/no, combinados |
| Unit validación | `eventosQueryValidation`: defaults, coerción, `incluirPasados` "true"/"false"/otro, `limit` 51, `orden` inválido, precioMin > precioMax, parámetro desconocido |
| Unit service | `EventoService.buscar`: orden por fecha/precio/puntaje asc/desc, sin reseñas al final en los dos órdenes, desempate, paginado (página fuera de rango, total 0), las reseñas se piden una vez por request, `esFavorito` con comprador/organizador/anónimo; `obtener`: detalle con disponibles, 404; `toResumen`/`toDetalle` (imagen null sin multimedia) |
| Unit controller | parsea query e id, delega y responde 200; errores a `next` |
| Integración | los 8 escenarios contra la app con el seed |

## Fuera de alcance
- `POST /eventos` y `GET /organizadores/yo/eventos` (spec 05b).
- Reseñas listadas en el detalle y `GET /organizadores/:id/resenias` (spec 07).
- Favoritos (agregar/quitar): spec 07. Acá solo se lee `esFavorito`.
- Swagger: `docs/swagger` al cierre de It2.

## Notas de IA
- La IA propuso partir la spec 05 en dos (consulta y organizador) porque pasaba de 8 escenarios, y el usuario aceptó.
- El usuario eligió que `precioMin > precioMax` dé 400 y que una categoría inexistente en el filtro devuelva una lista vacía (en `POST /eventos` es 422, spec 05b). En los dos casos eligió la opción que recomendó la IA.
- La IA señaló que `z.coerce.boolean()` convierte `"false"` en `true`; por eso `incluirPasados` se valida como enum `"true"`/`"false"`.
- Decisiones tomadas por la IA sin preguntar (revisables): desempate por fecha e id, `totalPages = 0` sin resultados, y página fuera de rango → lista vacía.
