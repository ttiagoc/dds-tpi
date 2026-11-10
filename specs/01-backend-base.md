# Spec 01 — Backend base

- **Estado:** implementada
- **Rama:** `chore/backend-base`
- **Casos de uso:** — (infraestructura que usan todos los CU)
- **Iteración:** It1

## Contexto
Base técnica del backend sobre la que se montan dominio, repos, auth y endpoints: app Express 5 testeable, manejo uniforme de errores, validación, reloj inyectable, contenedor de dependencias y Jest ESM funcionando.

## Historias
- Como desarrollador, quiero armar la app con `crearApp(contenedor)` para testear por HTTP con repos limpios.
- Como cliente de la API (app Expo), quiero errores con forma fija `{ status, message, details?, timestamp }` para mostrarlos sin casos especiales.

## Reglas
Sin reglas de negocio. Decisiones técnicas (planes/01 + ADR-008):

- **B1** `crearApp(contenedor)` arma express con: `cors()` abierto, `express.json()`, `GET /healthcheck`, `router` (vacío por ahora), `notFoundHandler`, `errorLogger`, `errorHandler`.
- **B2** `server.js`: `dotenv`, `leerEntorno()`, `crearContenedor()` (una vez), `http.createServer(app)`, `listen(PORT, "0.0.0.0")`. Socket.io se agrega en It3.
- **B3** `config/entorno.js` → `leerEntorno(env = process.env)` devuelve `{ port, jwtSecret, jwtExpiresIn, nodeEnv }`. Sin `JWT_SECRET` y `NODE_ENV !== "test"` → `Error("Falta la variable de entorno JWT_SECRET")`. En test usa un secret fijo. Defaults: `PORT=3000`, `JWT_EXPIRES_IN=8h`, `NODE_ENV=development`.
- **B4** `config/reloj.js` → `relojSistema = { ahora: () => new Date() }`.
- **B5** `contenedor.js` → `crearContenedor(overrides)` devuelve `{ reloj, repos, servicios, resetear }`. En esta rama, `repos`/`servicios` quedan vacíos; `resetear()` es async y no hace nada hasta `feature/repos-y-seed`.
- **B6** `AppError(message, statusCode, details)` con `status = statusCode >= 500 ? "error" : "fail"` y `timestamp` ISO. Subclases `BadRequestError 400`, `UnauthorizedError 401`, `ForbiddenError 403`, `NotFoundError 404`, `ConflictError 409`, `UnprocessableEntityError 422`.
- **B7** `errorHandler`:
  - `AppError` → su status y `{ status, message, details?, timestamp }` (`details` solo si existe).
  - JSON mal formado (`err.type === "entity.parse.failed"`) → 400 "El cuerpo de la solicitud no es un JSON válido".
  - Cualquier otro → 500 "Error interno del servidor" (sin stack en la respuesta).
- **B8** `notFoundHandler` → 404 "No existe la ruta `<MÉTODO> <path>`".
- **B9** `errorLogger`: 5xx → `console.error` con stack; 4xx → una línea; nada si `NODE_ENV=test`.
- **B10** `validate(schema)`: valida `req.body` con zod; si pasa, reemplaza `req.body` por el valor parseado. Si falla → `BadRequestError("Datos inválidos", [{ campo, mensaje }])`, con `campo = issue.path.join(".")`.
- **B11** `BaseController`: `parsearId(valor)` → entero positivo o `BadRequestError("El id debe ser un entero positivo")`; `extraerYValidarQuery(query, schema)` → devuelve el objeto parseado (no reasigna `req.query`, que es de solo lectura en Express 5) o `BadRequestError("Parámetros de consulta inválidos", details)`.
- **B12** `validations/paginacionValidation.js`: `page` (int ≥ 1, default 1), `limit` (int 1-50, default 20), `z.coerce`.

## Contrato de API
| Método | Ruta | Auth | Respuesta |
|---|---|---|---|
| GET | `/healthcheck` | 🔓 | 200 `{ status: "ok" }` |

Cualquier otra ruta → 404 según B8. Ya está en `planes/03`.

## Pantallas
Ninguna.

## Criterios de aceptación
```gherkin
Escenario: healthcheck
  Cuando hago GET /healthcheck
  Entonces responde 200 con { status: "ok" }

Escenario: ruta inexistente
  Cuando hago GET /nada
  Entonces responde 404 con status "fail", message "No existe la ruta GET /nada" y timestamp ISO

Escenario: JSON mal formado
  Cuando hago POST con Content-Type application/json y cuerpo "{malo"
  Entonces responde 400 con message "El cuerpo de la solicitud no es un JSON válido"

Escenario: AppError de negocio
  Dado un handler que lanza UnprocessableEntityError("No hay cupo suficiente para VIP")
  Entonces responde 422 con { status: "fail", message: "No hay cupo suficiente para VIP", timestamp }

Escenario: error inesperado
  Dado un handler que lanza Error("boom")
  Entonces responde 500 con { status: "error", message: "Error interno del servidor" } y sin stack

Escenario: validación de body
  Dado validate(schema) con un campo nombre requerido
  Cuando envío {}
  Entonces responde 400 "Datos inválidos" con details [{ campo: "nombre", mensaje }]

Escenario: falta JWT_SECRET
  Dado NODE_ENV "development" y sin JWT_SECRET
  Cuando llamo leerEntorno()
  Entonces lanza "Falta la variable de entorno JWT_SECRET"
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit | `AppError`: status fail/error según código; cada subclase con su código; `details` opcional |
| Unit | `leerEntorno`: falta secret fuera de test → error; en test usa el fijo; defaults |
| Unit | `BaseController.parsearId`: "7" → 7; "0", "-1", "abc", "1.5" → 400 |
| Unit | `extraerYValidarQuery` + paginación: defaults 1/20; limit 51 → 400; coerción de strings |
| Unit (middleware) | `validate`: ok reemplaza body; error → `next(BadRequestError)` con details campo/mensaje |
| Unit (middleware) | `errorLogger` silencioso en test; loguea 5xx con stack |
| Integración | healthcheck 200; 404 con mensaje; JSON mal formado 400; 422 y 500 vía app de prueba con rutas que lanzan |
| Unit | `crearContenedor` devuelve reloj por default y respeta override; `resetear` es async |

## Fuera de alcance
- Swagger (`/api-docs`): en It2 (`docs/swagger`).
- Socket.io: It3.
- Dockerfile: It5.
- Repos, seed, `/test/reset`, auth: ramas siguientes de It1.
- Rate limiting, helmet.

## Notas de IA
- La IA propuso los textos de los errores genéricos, la forma de `details` (campo + mensaje), CORS abierto y logging solo de 5xx con stack. El usuario aceptó las cuatro propuestas.
- `extraerYValidarQuery` no reasigna `req.query` porque en Express 5 es un getter: si se reasigna, tira error.
