# Spec 07b — Swagger (OpenAPI modular)

- **Estado:** implementada
- **Rama:** `docs/swagger`
- **Casos de uso:** transversal (documenta los endpoints de CU1-CU12 ya implementados)
- **Iteración:** It2 (último ítem antes del cierre)
- **Depende de:** specs 04 a 07 (endpoints implementados)

## Contexto
La aceptación de It2 pide que Swagger muestre todos los endpoints de `planes/03`. Además, es parte de la demo del video (`planes/08`, bloque Back-end). El contrato vive en `planes/03`. Swagger se escribe a mano desde ahí, siguiendo el formato modular del TP grupal: `<modulo>.js` exporta `{ tags, paths, schemas }` y `comun.js` tiene los helpers.

## Historias
- Como desarrollador o evaluador, quiero ver y probar la API desde `/api-docs`, con login y token, sin leer el código.

## Reglas
- **SW1** `GET /api-docs` sirve Swagger UI y `GET /api-docs.json`, el documento OpenAPI 3.0.3. Los dos son públicos y están en cualquier entorno.
- **SW2** Hay un módulo por recurso en `backend/src/docs/openapi/`:
  - `sistema` (healthcheck);
  - `auth`;
  - `categorias`;
  - `eventos` (incluye `GET /eventos/:id/compras`);
  - `organizadores` (mis eventos y reseñas);
  - `compras` (incluye pago, cancelación, uso y reseña);
  - `favoritos`.

  `index.js` los une y falla si un path o schema se define dos veces.
- **SW3** Se documentan solo los endpoints implementados. Quedan afuera:
  - el chat (`/compras/:id/mensajes`), que es de la spec 08 y se documenta con ella;
  - `/test/reset`, que solo existe con `NODE_ENV=test`.
- **SW4** La auth se marca en cada operación con un helper, `conAuth(rol)` para 🅒, 🅞 y 🔐 y `conAuthOpcional` para `GET /eventos` y `GET /eventos/:id`. El helper agrega:
  - `security: bearerAuth`;
  - el 401;
  - el 403 cuando hay rol o dueño.

  No se infiere por prefijo de ruta como en el TP grupal, porque acá la auth depende del rol y no del método.
- **SW5** Los schemas siguen las formas de `planes/03`, con ejemplos tomados del seed:
  - `EventoResumen`, `EventoDetalle`;
  - `CompraResumen`, `CompraDetalle`;
  - `Resenia`, `Error`;
  - los bodies con `additionalProperties: false`, como el `.strict()` de zod;
  - los listados paginados con `{ <clave>, total, page, totalPages }`.
- **SW6** Cada operación lista sus errores con las respuestas comunes (`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `UnprocessableEntity`) y una `description` con las reglas de negocio que la explican (por ejemplo, el orden de los chequeos de la reseña). Los textos van en castellano rioplatense.
- **SW7** La descripción general explica cómo probar la API:
  1. llamar a `POST /auth/login` con un usuario del seed (clave `Demo1234!`);
  2. pegar el token en **Authorize**.

## Contrato de API
No cambia. `GET /api-docs` ya está en `planes/03`. Se agrega `GET /api-docs.json` a la tabla Sistema.

## Pantallas
Ninguna.

## Criterios de aceptación
```gherkin
Escenario: Swagger disponible
  Cuando hago GET /api-docs
  Entonces responde 200 con la página de Swagger UI
  Y GET /api-docs.json responde el documento con openapi "3.0.3"

Escenario: Swagger documenta todos los endpoints implementados
  Dado la lista de operaciones de planes/03 implementadas (método + ruta)
  Entonces cada una está en paths del documento, y no hay ninguna de más

Escenario: el documento es consistente
  Entonces cada $ref apunta a un schema o respuesta que existe
  Y cada operación con auth tiene security bearerAuth y una respuesta 401
  Y cada operación con path param {id} o {eventoId} lo declara y tiene 400
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit | `index.js`: unir falla con un path o schema duplicado. Helpers `conAuth` y `conAuthOpcional` agregan security y respuestas |
| Integración | `/api-docs` (200 HTML) y `/api-docs.json` (3.0.3). La lista esperada de operaciones (método + ruta, escrita a mano desde `planes/03`) es igual a la de `paths`. Todos los `$ref` resuelven. Auth y path params consistentes |

Un test que compare contra la lista de rutas de Express descartaría la lista a mano, pero Express 5 no expone las rutas de los routers anidados de forma estable. Por eso la lista vive en el test y se actualiza con cada endpoint nuevo, igual que `planes/03`.

## Fuera de alcance
- Generar Swagger desde los schemas de zod (zod-to-openapi): se descartó para seguir el formato a mano del TP grupal y no sumar una dependencia.
- Validar el documento con una librería externa (swagger-parser): los chequeos de consistencia de los tests alcanzan.
- Chat y sockets: spec 08.

## Notas de IA
- Propuesta completa de la IA, revisable:
  - módulos por recurso;
  - auth marcada por operación con helpers;
  - lista de operaciones a mano en el test;
  - sin dependencias nuevas, porque `swagger-ui-express` ya está instalado;
  - `/test/reset` y el chat fuera del documento.
