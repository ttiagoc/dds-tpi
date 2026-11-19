# AGENTS.md — backend

API de AI Ticket It: Node + Express 5, ESM, JavaScript, persistencia en memoria. Las reglas generales están en `../AGENTS.md`; acá solo lo propio del back.

## Estructura `src/`

| Carpeta         | Contenido                                                                                                                                                             | Archivo ejemplo                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `domain/`       | Clases con comportamiento; validan en constructor y tiran `UnprocessableEntityError`. Enums `Object.freeze` en archivo propio.                                        | `Compra.js`, `EstadoCompra.js` |
| `repositories/` | En memoria, **API async** (devuelven Promise) para que se puedan cambiar por Mongo. Base `InMemoryRepository` (Map + nextId).                                         | `CompraRepository.js`          |
| `services/`     | Lógica de aplicación. DI por constructor con default. `toResponse(entidad)` es el DTO.                                                                                | `CompraService.js`             |
| `controllers/`  | `extends BaseController` (`parsearId`, `extraerYValidarQuery`). `try { … } catch (e) { next(e) }`.                                                                    | `CompraController.js`          |
| `routes/`       | `XRoutes.js`, `router.js` monta todo.                                                                                                                                 | `CompraRoutes.js`              |
| `validations/`  | Zod `.strict()`; middleware `validate(schema)`.                                                                                                                       | `compraValidation.js`          |
| `middlewares/`  | `errorHandler`, `errorLogger`, `notFoundHandler`, `autenticar`, `autenticarOpcional`, `autorizar`, `validate`.                                                        |                                |
| `errors/`       | `AppError` + `BadRequest 400`, `Unauthorized 401`, `Forbidden 403`, `NotFound 404`, `Conflict 409`, `UnprocessableEntity 422`. Mensajes compartidos en `mensajes.js`. | `AppError.js`                  |
| `docs/openapi/` | Swagger modular a mano: `<modulo>.js` exporta `{ tags, paths, schemas }`; `comun.js` helpers.                                                                         |                                |
| `sockets/`      | Servidor Socket.io (auth JWT en handshake, rooms `compra:<id>`), notificador.                                                                                         |                                |
| `seeds/`        | `datos.js` + `sembrar.js`. Se siembra al arrancar.                                                                                                                    |                                |
| `config/`       | `reloj.js` (`ahora()` inyectable para tests de fechas), `entorno.js`.                                                                                                 |                                |
| `contenedor.js` | `crearContenedor(overrides)`: repos únicos inyectados explícitamente en los services, `resetear()`.                                                                   |                                |
| `servidor.js`   | `crearServidor({ entorno, reloj })`: HTTP + Socket.io; lo usan `server.js` y los tests.                                                                               |                                |

## Convenciones

- Archivos de clase en PascalCase; schemas, validaciones y middlewares en camelCase. Imports con extensión `.js`.
- Métodos CRUD en inglés (`findById`, `save`, `getById`, `create`); dominio y helpers en castellano (`cancelar()`, `hayCupoPara()`, `parsearId`).
- Las reglas de negocio viven en las entidades de `domain/`, no en services ni controllers.
- Endpoints: sustantivos en plural, camelCase, sin prefijo `/api`. Acciones como sub-recurso con POST (`/compras/:id/cancelacion`).
- Respuestas sin wrapper. Listas paginadas: `{ eventos: [...], total, page, totalPages }`. Errores: `{ status: "fail" | "error", message, details?, timestamp }`.
- Status: 200 GET/acciones, 201 creación, 204 delete sin cuerpo, 400 input inválido, 401 sin token, 403 sin permiso, 404, 409 conflicto, 422 regla de negocio.
- Fechas en ISO 8601 UTC en el JSON; en el código, siempre desde el reloj inyectado.
- Endpoint nuevo: actualizar Swagger (`docs/openapi/`) y la lista de operaciones de `test/integration/swagger.test.js`.

## Tests

- Unit en `test/{domain,services,controllers}`, integración en `test/integration`.
- Helpers en `test/helpers/`: `domainFactories.js` (entidades y bodies), `appDePrueba.js` (`loginComo`, `conToken`, `pedirComo`, usuarios del seed), `comprasFake.js`, `http.js`, `socketDePrueba.js`.
- Fuera de `NODE_ENV=test` el back exige `JWT_SECRET` (ver `.env.example`).

## Comandos

```bash
npm run dev    # API en :3000 + seed
npm test       # unit + integración
```
