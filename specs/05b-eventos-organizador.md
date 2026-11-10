# Spec 05b — Eventos del organizador (crear evento y mis eventos)

- **Estado:** borrador
- **Rama:** `feature/eventos-organizador`
- **Casos de uso:** CU4 (crear evento con tipos de entrada), CU2 (parcial: listado de eventos propios con ventas; el detalle de compras por evento es de la spec 06)
- **Iteración:** It2

## Contexto
El organizador publica sus eventos con distintos tipos de entrada (precio y cupo) y necesita ver un resumen de sus eventos con lo vendido y lo recaudado. Es la base de las pantallas CrearEvento y MisEventos (It4). Reutiliza el armado de `EventoResumen`/`EventoDetalle` de la spec 05.

## Historias
- Como organizador, quiero crear un evento con distintos tipos de entrada, cada uno con su precio y cupo, para adaptarme a distintos públicos y presupuestos (CU4).
- Como organizador, quiero ver mis eventos con las entradas vendidas, el cupo y lo recaudado para seguir mis ventas (CU2, parcial).

## Reglas de negocio
Aplican R6 (puntaje del organizador) y R8 (crear evento) de `planes/02-dominio.md`.

- **O1** Los dos endpoints usan `autenticar` + `autorizar(ORGANIZADOR)`: sin token → 401 "Necesitás iniciar sesión"; con rol COMPRADOR → 403 "No tenés permiso para realizar esta acción".
- **O2** Validación del body de `POST /eventos` (`crearEventoValidation`, zod `.strict()`): solo forma y tipos → 400 "Datos inválidos" con `details`.
  - `nombre`, `lugar`: texto. `descripcion`: texto de hasta 2000 caracteres.
  - `categoriaId`: entero positivo.
  - `fecha`: fecha y hora ISO 8601 con zona (`2026-12-05T22:00:00.000Z` o con offset).
  - `multimedia` (opcional, por defecto `[]`): hasta 5 URLs `http`/`https`.
  - `tiposEntrada`: de 1 a 10 objetos `.strict()` `{ nombre: texto, descripcion?: texto ≤ 200, precio: número, cupo: entero }`.
  - Campos de más (por ejemplo `organizadorId` o `vendidas`) → 400.
- **O3** Los rangos y las reglas de R8 los valida el dominio (`Evento.crear(datos, ahora)` y `TipoEntrada`) → 422 con el mensaje del dominio: fecha no futura ("La fecha del evento tiene que ser futura"), precio negativo ("El precio no puede ser negativo"), cupo < 1 ("El cupo tiene que ser un entero mayor a 0"), tipos con el mismo nombre sin distinguir mayúsculas ("Ya hay un tipo de entrada llamado <nombre>"), nombre de 3 a 100 caracteres y textos vacíos. Ninguna de estas reglas se repite en zod.
- **O4** `categoriaId` que no existe → 422 "La categoría no existe" (lo chequea el service antes de crear el evento).
- **O5** El organizador del evento es siempre el usuario del token. `POST /eventos` responde 201 con `EventoDetalle` (spec 05, E7/E8): `disponibles = cupo` en cada tipo, `puntajePromedio` del organizador (R6) y `esFavorito: false`.
- **O6** `GET /organizadores/yo/eventos` devuelve **todos** los eventos del organizador, incluso los pasados, ordenados por `fecha` asc y después por `id` asc. La query solo acepta `page` y `limit` (mismos límites que E4, `.strict()`; vacíos se ignoran). Respuesta `{ eventos, total, page, totalPages }` con el mismo paginado que la spec 05 (E4).
- **O7** Cada ítem es `EventoResumen` + `vendidas`, `cupo` y `recaudado`:
  - `vendidas` = `evento.totalVendidas()` (cupo ocupado; incluye las compras PENDIENTE, que reservan cupo).
  - `cupo` = suma de los cupos de los tipos (método de dominio nuevo `evento.cupoTotal()`).
  - `recaudado` = suma de `total` de las compras CONFIRMADA y UTILIZADA del evento (método de dominio nuevo `compra.sumaAlRecaudado()`); 0 si no hay.
  - Las compras del organizador se piden **una sola vez por request** y se agrupan en un `Map eventoId → recaudado` (igual criterio que R6).

## Contrato de API (cambia `planes/03`)
| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/eventos` | 🅞 | body de `planes/03` | 201 EventoDetalle | 400, 401, 403, 422 (incluye "La categoría no existe") |
| GET | `/organizadores/yo/eventos` | 🅞 | `page, limit` | 200 `{ eventos: [EventoResumen + vendidas, cupo, recaudado], total, page, totalPages }` | 400, 401, 403 |

Cambio en `planes/03`: se agrega `cupo` al ítem de `GET /organizadores/yo/eventos` (la pantalla MisEventos muestra vendidas/cupo), y se fija el orden y que incluye los pasados.

Diseño: `EventoService.crear(datos, usuario)` (busca la categoría y el organizador, `Evento.crear`, guarda, `toDetalle`) y `EventoService.listarDelOrganizador(usuario, paginacion)`. `CompraRepository.findByOrganizador(id)` nuevo. `OrganizadorRoutes` monta `/organizadores/yo/eventos`. La función `paginar` de `EventoService` pasa a un módulo compartido (`services/paginacion.js`) porque este es su segundo uso (hallazgo 7 de la revisión de la spec 05).

## Pantallas
Ninguna en esta iteración (CrearEvento y MisEventos son de It4).

## Criterios de aceptación
```gherkin
Escenario: crear evento
  Dado que estoy logueado como Fénix
  Cuando hago POST /eventos con un body válido de 2 tipos de entrada y fecha futura
  Entonces responde 201 con el EventoDetalle, organizador Fénix, disponibles = cupo en cada tipo y esFavorito false
  Y después GET /eventos/<id> devuelve el mismo evento

Escenario: permisos
  Cuando hago POST /eventos o GET /organizadores/yo/eventos sin token
  Entonces responde 401 "Necesitás iniciar sesión"
  Y con el token de Ana responde 403 "No tenés permiso para realizar esta acción"

Escenario: body inválido
  Cuando hago POST /eventos sin tiposEntrada, con 11 tipos, con una URL ftp://, con fecha "mañana", con cupo 1.5 o con organizadorId
  Entonces responde 400 "Datos inválidos" con details

Escenario: reglas de dominio
  Cuando hago POST /eventos con fecha pasada, con un precio negativo, con cupo 0 o con dos tipos "General" y "general"
  Entonces responde 422 con el mensaje del dominio

Escenario: categoría inexistente
  Cuando hago POST /eventos con categoriaId 999
  Entonces responde 422 "La categoría no existe"

Escenario: mis eventos
  Dado que estoy logueado como Fénix
  Cuando hago GET /organizadores/yo/eventos
  Entonces vienen sus 6 eventos (incluido el pasado "Rock en el Parque") ordenados por fecha asc
  Y "Festival Primavera Sonora" trae vendidas 20, cupo 3020 y recaudado 2820000
  Y "Los Piojos en River" trae vendidas 2 (compra PENDIENTE) y recaudado 0
  Y "Clásico de Básquet" trae recaudado 0 (compra REEMBOLSADA)

Escenario: paginado de mis eventos
  Cuando hago GET /organizadores/yo/eventos?limit=4&page=2
  Entonces vienen 2 eventos, total 6 y totalPages 2
  Y con limit=51 o un parámetro desconocido responde 400 "Parámetros de consulta inválidos"
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit dominio | `Evento.cupoTotal()`; `Compra.sumaAlRecaudado()` por cada estado |
| Unit repo | `CompraRepository.findByOrganizador` |
| Unit validación | `crearEventoValidation`: body válido, multimedia por defecto, URL no http(s), más de 5 URLs, 0 y 11 tipos, descripción larga, fecha sin formato ISO, cupo no entero, campos de más en el evento y en el tipo; `organizadorEventosQueryValidation` |
| Unit service | `crear`: categoría inexistente → 422, organizador del token, guarda y devuelve el detalle, errores de dominio propagados, usa el reloj; `listarDelOrganizador`: orden, incluye pasados, vendidas/cupo/recaudado, compras pedidas una vez, paginado |
| Unit controller | `crear` responde 201 y valida el body; `listarDelOrganizador` valida la query y responde 200; errores a `next` |
| Integración | los 7 escenarios contra la app con el seed |

## Fuera de alcance
- `GET /eventos/:id/compras` (detalle de compras y disponibilidad por evento, CU2): spec 06.
- Editar o borrar eventos: no está en la consigna.
- Subir imágenes: `multimedia` son URLs.
- Swagger: `docs/swagger` al cierre de It2.

## Notas de IA
- El usuario eligió las opciones que recomendó la IA en las cuatro preguntas:
  - Zod valida solo forma y tipos (400), y el dominio valida los rangos y las reglas de R8 (422), así cada regla está en un solo lugar.
  - Mis eventos incluye los pasados, ordenados por fecha asc.
  - Se agrega `cupo` al contrato y `vendidas` cuenta el cupo ocupado, incluidas las PENDIENTE. `recaudado` cuenta solo CONFIRMADA y UTILIZADA.
  - Límites: hasta 5 URLs http(s), de 1 a 10 tipos, descripción de hasta 2000 caracteres y descripción de tipo de hasta 200.
- La IA agregó sin preguntar (revisable): desempate por `id`, `esFavorito: false` en la respuesta del organizador y mover `paginar` a un módulo compartido.
