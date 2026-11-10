# Spec 10 — Explorar eventos y detalle del evento

- **Estado:** aprobada
- **Rama:** `feature/explorar-eventos`
- **Casos de uso:** CU3, CU10, CU11 (ver `planes/00-indice.md`)
- **Iteración:** It4
- **Depende de:** spec 05 (`GET /categorias`, `GET /eventos`, `GET /eventos/:id`), spec 07 (reseñas del organizador, favoritos), spec 09 (base del front)

## Contexto

El comprador hoy entra a un tab "Próximamente". Esta spec arma la puerta de entrada de la app: buscar eventos por texto o categoría, ordenarlos y abrir el detalle de uno para ver los tipos de entrada, la reputación del organizador y marcarlo como favorito. Es la primera de cuatro specs del comprador:

| Spec   | Rama                        | Alcance                                                                        |
| ------ | --------------------------- | ------------------------------------------------------------------------------ |
| **10** | `feature/explorar-eventos`  | Explorar + DetalleEvento (incluye el botón favorito)                           |
| 10b    | `feature/comprar`           | Comprar (CU12) + `SelectorCantidad`                                            |
| 10c    | `feature/mis-compras`       | MisCompras (CU1) + DetalleCompra + pagar/cancelar (CU7, CU8) + `LineaDeTiempo` |
| 10d    | `feature/resenar-favoritos` | Reseñar (CU9) con `Estrellas` editables + tab Favoritos                        |

## Historias

- Como comprador, quiero buscar eventos por texto o explorarlos por categoría (CU3).
- Como comprador, quiero ordenar los eventos por fecha, precio o puntaje del organizador (CU11).
- Como comprador, quiero ver en el evento las reseñas de eventos anteriores del organizador antes de comprar (CU10).
- Como comprador, quiero marcar un evento como favorito desde su detalle.

## Reglas (front)

Sin reglas de negocio nuevas: el front usa lo que calcula el back (`disponibles`, `puntajePromedio`, `esFavorito`).

- **RE1 Búsqueda.** `Searchbar` con debounce de 300 ms; el texto se manda como `q` (con `trim`; vacío → sin `q`). Borrar el texto vuelve a la lista completa.
- **RE2 Categorías.** Chips horizontales desde `GET /categorias`, con un chip "Todas" primero (seleccionado por defecto). Selección única: tocar una categoría la filtra (`categoria=<id>`); tocar la seleccionada o "Todas" quita el filtro. Si `GET /categorias` falla, la lista de eventos se muestra igual, sin chips.
- **RE3 Orden.** Botón `orden-menu` que abre un `Menu` con 6 opciones; el botón muestra la opción activa:

  | Opción                        | `ordenarPor` | `orden` |
  | ----------------------------- | ------------ | ------- |
  | Fecha: más próximos (default) | `fecha`      | `asc`   |
  | Fecha: más lejanos            | `fecha`      | `desc`  |
  | Precio: menor a mayor         | `precio`     | `asc`   |
  | Precio: mayor a menor         | `precio`     | `desc`  |
  | Puntaje: mejor primero        | `puntaje`    | `desc`  |
  | Puntaje: peor primero         | `puntaje`    | `asc`   |

- **RE4 Paginado.** `limit=10`. Debajo de la lista, botón "Cargar más" (`cargar-mas`) mientras `page < totalPages`; agrega la página siguiente al final y queda `loading` mientras carga. Si falla, la lista ya cargada queda y se muestra el error con Reintentar debajo.
- **RE5 Cambio de criterio.** Cambiar texto, categoría u orden vuelve a la página 1 y reemplaza la lista. Una respuesta de un criterio viejo que llega tarde se descarta.
- **RE6 Pull-to-refresh** recarga la página 1 con el criterio actual.
- **RE7 Estados de Explorar.** Cargando inicial con `Cargando`; error con `ErrorCarga` (mensaje del back) y Reintentar; vacío con `EstadoVacio` "No encontramos eventos con esos filtros" (con acción "Limpiar filtros" si hay texto o categoría).
- **RE8 Tarjeta.** `TarjetaEvento`: imagen 16:9 (`imagen`; sin imagen → placeholder con ícono), nombre, fecha (`formatearFecha`), lugar, "Desde $X" (`formatearPrecio(precioDesde)`), nombre del organizador con `Estrellas` de solo lectura y su puntaje (sin puntaje: "Sin reseñas"). Tocar → `eventos/<id>`.
- **RE9 Detalle.** `eventos/[id]` muestra imagen, nombre, fecha, lugar, categoría, descripción, organizador con estrellas y lista de tipos de entrada: nombre, descripción, precio y "Quedan N" (con 0: chip "Agotado").
- **RE10 Reseñas en el detalle.** `GET /organizadores/<organizador.id>/resenias?limit=3`: encabezado con promedio y cantidad total ("4,5 · 12 reseñas"), y las 3 más nuevas (estrellas, detalle, nombre del comprador, fecha). Sin reseñas: "Este organizador todavía no tiene reseñas". Si falla, solo esa sección muestra el error con Reintentar; el resto del detalle se ve igual.
- **RE11 Favorito.** Solo para COMPRADOR. `IconButton` corazón (`evento-favorito`, `accessibilityLabel` "Agregar a favoritos" / "Quitar de favoritos"), inicializado con `esFavorito`. Optimista: cambia al tocar y llama `PUT` o `DELETE /usuarios/yo/favoritos/:id`; si falla, vuelve al estado anterior y muestra un `Snackbar` con el mensaje del back. Mientras viaja un request, el botón no acepta otro toque.
- **RE12 Comprar.** Solo para COMPRADOR. Botón `evento-comprar` (`contained`); si todos los tipos tienen `disponibles: 0` queda deshabilitado con el texto "Agotado". Por ahora lleva a `eventos/<id>/comprar`, que muestra "Próximamente" hasta la spec 10b.
- **RE13 Estados del detalle.** Cargando; 404 → `EstadoVacio` "No existe el evento" con acción "Volver"; otro error → `ErrorCarga` con Reintentar.
- **RE14 Navegación.** `eventos/[id]` y `eventos/[id]/comprar` van en el Stack raíz, protegidas para cualquier usuario logueado (el organizador puede ver el detalle, sin favorito ni Comprar). Con header y botón atrás; título "Evento".

## Contrato de API

Sin cambios. Usa tal cual `planes/03`:

| Función (`src/api/`)                                                  | Endpoint                                          |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| `categoriasApi.listar()`                                              | `GET /categorias`                                 |
| `eventosApi.buscar({ q, categoria, ordenarPor, orden, page, limit })` | `GET /eventos` (omite parámetros vacíos)          |
| `eventosApi.obtener(id)`                                              | `GET /eventos/:id`                                |
| `organizadoresApi.resenias(id, { page, limit })`                      | `GET /organizadores/:id/resenias`                 |
| `favoritosApi.agregar(eventoId)` / `favoritosApi.quitar(eventoId)`    | `PUT` / `DELETE /usuarios/yo/favoritos/:eventoId` |

Mensajes del back que se muestran: "No existe el evento", "No existe el organizador", y "No pudimos conectar con el servidor" (de `mensajeDeError`).

## Pantallas

- **Explorar** (`(comprador)/explorar`, en `src/pantallas/explorar/`): `buscador`, `chip-categoria-todas`, `chip-categoria-<id>`, `orden-menu`, `orden-<ordenarPor>-<orden>`, `tarjeta-evento-<id>`, `cargar-mas`.
- **DetalleEvento** (`eventos/[id]`, en `src/pantallas/detalle-evento/`): `evento-favorito`, `evento-comprar`, `tipo-entrada-<id>`, `resenias-organizador`, `resenia-<id>`.
- **Comprar provisorio** (`eventos/[id]/comprar`): reutiliza `Proximamente`.

Componentes compartidos nuevos (`src/components/`, se agregan al catálogo de `sistema-diseno`):

- `TarjetaEvento({ evento, onPress })` — la reusa Favoritos (10d).
- `Estrellas({ valor, tamanio? })` — solo lectura en esta spec (estrellas llenas, medias y vacías; `accessibilityLabel` "Puntaje N de 5"; sin valor → no se renderiza). La edición (`onCambiar`) llega con 10d.

Hook nuevo: `useDebounce(valor, ms)`. La lista paginada de Explorar maneja su propio estado (no usa `useCargar`, que no acumula páginas).

## Criterios de aceptación

```gherkin
Escenario: ver los próximos eventos
  Dado que estoy logueada como Ana
  Cuando abro Explorar
  Entonces veo las tarjetas de los próximos eventos ordenadas por fecha más próxima
  Y cada tarjeta muestra nombre, fecha, lugar, "Desde $X" y el puntaje del organizador

Escenario: buscar por texto
  Cuando escribo "piojos" en el buscador
  Entonces, 300 ms después de dejar de escribir, se pide GET /eventos?q=piojos una sola vez
  Y veo solo los eventos que coinciden

Escenario: filtrar por categoría y quitar el filtro
  Cuando toco el chip "Recitales"
  Entonces veo solo eventos de Recitales
  Cuando toco "Todas"
  Entonces vuelvo a ver todos

Escenario: ordenar por precio
  Cuando elijo "Precio: menor a mayor" en el menú de orden
  Entonces se pide la página 1 con ordenarPor=precio&orden=asc y el botón muestra esa opción

Escenario: cargar más
  Dado que hay más de 10 eventos
  Cuando toco "Cargar más"
  Entonces la página 2 se agrega debajo
  Y en la última página el botón desaparece

Escenario: sin resultados
  Cuando busco "zzzz"
  Entonces veo "No encontramos eventos con esos filtros" y la acción "Limpiar filtros"

Escenario: error al cargar
  Dado que el back no responde
  Cuando abro Explorar
  Entonces veo "No pudimos conectar con el servidor" y Reintentar vuelve a pedir

Escenario: ver el detalle con reseñas
  Cuando toco la tarjeta de un evento de Konex
  Entonces veo descripción, categoría, tipos de entrada con precio y "Quedan N"
  Y el promedio del organizador con la cantidad de reseñas y las 3 más nuevas

Escenario: organizador sin reseñas
  Cuando abro un evento de un organizador sin reseñas
  Entonces veo "Este organizador todavía no tiene reseñas"

Escenario: marcar y desmarcar favorito
  Dado un evento que no es favorito de Ana
  Cuando toco el corazón
  Entonces se ve lleno al instante y se hace PUT /usuarios/yo/favoritos/<id>
  Cuando lo toco de nuevo
  Entonces se ve vacío y se hace DELETE

Escenario: falla el favorito
  Dado que PUT /usuarios/yo/favoritos/<id> falla
  Cuando toco el corazón
  Entonces vuelve a verse vacío y aparece un Snackbar con el mensaje del error

Escenario: evento agotado
  Dado un evento con todos sus tipos en 0 disponibles
  Entonces cada tipo muestra "Agotado" y el botón Comprar está deshabilitado con el texto "Agotado"

Escenario: evento inexistente
  Cuando abro eventos/9999
  Entonces veo "No existe el evento" y el botón Volver

Escenario: organizador mirando un evento
  Dado que estoy logueado como Fénix
  Cuando abro el detalle de un evento
  Entonces no veo el corazón ni el botón Comprar
```

## Plan de tests

| Nivel                    | Caso                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Front unit               | `eventosApi.buscar` omite parámetros vacíos; `useDebounce` (con timers falsos)                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Front componentes (RNTL) | `TarjetaEvento`: datos formateados, placeholder sin imagen, "Sin reseñas" sin puntaje, `onPress`. `Estrellas`: label "Puntaje 4,5 de 5", llenas/medias/vacías, sin valor no renderiza                                                                                                                                                                                                                                                                                                                             |
| Front pantallas (RNTL)   | Explorar: carga inicial con el orden default, debounce (un solo pedido), chip de categoría y "Todas", menú de orden, cargar más agrega y desaparece en la última, cambio de criterio vuelve a página 1, vacío con limpiar filtros, error con reintentar, navega al detalle. DetalleEvento: datos y tipos con "Quedan N"/"Agotado", reseñas (3, vacío, error aislado), favorito optimista (PUT, DELETE, rollback + Snackbar), Comprar deshabilitado si agotado, 404 con Volver, organizador sin corazón ni Comprar |
| Back                     | sin cambios (ya cubierto por specs 05 y 07)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Manual                   | Expo Go y web: buscar, filtrar, ordenar, cargar más, pull-to-refresh, detalle, favorito                                                                                                                                                                                                                                                                                                                                                                                                                           |
| E2E                      | spec temporal de Cypress contra el back real al cerrar la rama (se borra); los flujos definitivos van en `chore/e2e-cypress` (It5)                                                                                                                                                                                                                                                                                                                                                                                |

## Fuera de alcance

- Filtro por rango de precio (`precioMin`/`precioMax`) e `incluirPasados` en la UI.
- Pantalla "ver todas las reseñas" del organizador.
- Pantalla Comprar real (10b), tab Favoritos (10d), `Estrellas` editables (10d).
- Scroll infinito automático (se usa "Cargar más").
- Galería de `multimedia` (se muestra solo la primera imagen).

## Notas de IA

- La IA propuso partir la spec del comprador en 10, 10b, 10c y 10d; el usuario lo pidió así.
- El usuario eligió: menú de orden con 6 opciones, últimas 3 reseñas sin "ver todas", favorito optimista con rollback, Comprar deshabilitado "Agotado" si no hay disponibles.
- La IA agregó sin preguntar (revisable):
  - `limit=10` y chip "Todas";
  - descartar respuestas de criterios viejos;
  - Explorar se muestra sin chips si falla `GET /categorias`, y el error de reseñas queda aislado en su sección;
  - el organizador puede abrir el detalle (sin favorito ni Comprar);
  - testIDs `chip-categoria-todas`, `orden-<ordenarPor>-<orden>`, `cargar-mas`, `tipo-entrada-<id>`, `resenias-organizador`, `resenia-<id>`;
  - hook `useDebounce`; la lista paginada no usa `useCargar`.
- Antes de codear: leer la doc de Expo SDK 58 de expo-router (Stack con header en rutas dinámicas, `useLocalSearchParams`) y de `Image` de React Native / expo-image.
- Cambios en la implementación:
  - las funciones de `src/api/` siguen el estilo de `authApi.js` (exports con nombre): `buscarEventos`, `obtenerEvento`, `listarCategorias`, `obtenerReseniasDeOrganizador`, `agregarFavorito`, `quitarFavorito`;
  - `useCargar` expone `codigoError` (status HTTP o `null`) para distinguir el 404 del detalle;
  - componentes extra `ImagenEvento` y `PuntajeOrganizador` (los usan la tarjeta y el detalle), token de tema `colors.estrella` y `formatearDia`/`formatearPuntaje` en `formato.js`;
  - las rutas del detalle son `eventos/[id]/index` y `eventos/[id]/comprar`; con un deep link en frío, mientras se restaura la sesión el guard cae a `index` y el usuario termina en sus tabs (mismo comportamiento que el resto de las rutas protegidas).
