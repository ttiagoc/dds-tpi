# Spec 25 — Categoría con búsqueda y paginación

- **Estado:** aprobada
- **Rama:** `feature/selector-categoria`
- **Casos de uso:** CU3, CU4 (ver `planes/00-indice.md`)
- **Iteración:** It5c
- **Depende de:** spec 23

## Contexto
En Nuevo evento, la categoría se elige de un `Menu` que trae todas las categorías de una vez y no permite escribir. El usuario quiere poder escribir para filtrar (con debounce) y una lista que cargue más categorías al llegar al final. `GET /categorias` hoy devuelve un arreglo sin paginar.

## Historias
- Como organizador, quiero escribir parte del nombre de la categoría y ver solo las que coinciden.
- Como organizador, quiero que la lista cargue más categorías a medida que bajo.

## Reglas de negocio
Las categorías siguen sin ABM (`planes/02`). Escribir **solo filtra**: no se crean categorías (decisión del usuario).

- **RC1** La búsqueda `q` coincide con el nombre sin distinguir mayúsculas ni acentos ("conf" encuentra "Conferencias").
- **RC2** El orden es por nombre ascendente y, a igual nombre, por id.

## Contrato de API
| Método | Ruta | Auth | Query | Respuesta | Errores |
|---|---|---|---|---|---|
| GET | `/categorias` | 🔓 | `q?` (≤ 50), `page` (1), `limit` (20, máx. 50) | 200 `{ categorias: [{ id, nombre, descripcion }], total, page, totalPages }` | 400 "Parámetros de consulta inválidos" |

**Cambio que rompe el contrato**: antes devolvía un arreglo. Los dos consumidores (los chips de Explorar y el selector) se adaptan en la misma rama.

El seed pasa de 6 a 15 categorías: se suman Danza, Cine, Infantiles, Ferias, Exposiciones, Gastronomía, Electrónica, Jazz y Tango.

## Pantallas
- **SelectorCategoria** (CrearEvento): `TextInput` "Categoría" (`evento-categoria`) con un ícono de búsqueda. Al enfocarlo se abre debajo una lista (`categorias-lista`), con un alto máximo y su propio scroll, que pide `GET /categorias?q&page&limit=10`. El texto se busca con debounce de 300 ms (`useDebounce`). Al llegar al final de la lista carga más (`onEndReached`) y muestra un spinner.
  - Tocar una opción (`categoria-<id>`) la elige, pone su nombre en el campo y cierra la lista.
  - Si después se edita el texto, se pierde la categoría elegida.
  - Sin coincidencias, muestra "No hay categorías con ese nombre" (`categorias-vacio`). Si falla la carga, muestra un error con reintento (`categorias-error`).
  - Accesibilidad: el campo tiene etiqueta "Categoría" y su error (spec 23); cada opción es un botón con su nombre.
- **ChipsCategorias** (Explorar): `FlatList` horizontal que pide de a 10 y carga más al llegar al final de la fila.

## Criterios de aceptación
```gherkin
Escenario: filtrar por texto
  Dado que estoy en Nuevo evento
  Cuando escribo "conf" en Categoría
  Entonces la lista muestra solo "Conferencias"

Escenario: paginar la lista
  Dado que hay 15 categorías y abro la lista sin escribir
  Cuando llego al final
  Entonces se cargan las 5 restantes

Escenario: sin coincidencias
  Cuando escribo "zzz"
  Entonces veo "No hay categorías con ese nombre"

Escenario: elegir y después editar
  Dado que elegí "Teatro"
  Cuando borro una letra
  Entonces la categoría queda sin elegir y al publicar veo "Elegí una categoría"

Escenario: API paginada
  Cuando pido GET /categorias?q=teatro
  Entonces responde 200 { categorias: [Teatro], total: 1, page: 1, totalPages: 1 }
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit validación | `categoriasQueryValidation`: defaults, `q` largo, `limit` fuera de rango |
| Unit service | `CategoriaService.listar`: orden por nombre, filtro sin acentos, páginas, página fuera de rango |
| Integración | 200 paginado, filtro `q`, 400 query inválida |
| Front (RNTL) | selector: escribe y espera el debounce, carga más, elige, editar limpia la elección, vacío, error con reintento; ChipsCategorias carga más al final |
| Swagger | `GET /categorias` con los parámetros nuevos (`swagger.test.js`) |

## Fuera de alcance
- Crear, editar o borrar categorías.

## Notas de IA
La IA propuso que escribir pudiera crear una categoría nueva; el usuario prefirió que solo filtre.
