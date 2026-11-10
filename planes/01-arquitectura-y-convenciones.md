# 01 — Arquitectura y convenciones

Basado en el repo de cátedra (`ejercicio-megasuper-2026`, ramas `clase12-DockerYDeploy` y `clase11-integracion-front-back`) y en el TP grupal (`2026-2c-lu-sa-grupo-11`, `develop`). Donde difieren, se toma el grupal (más reciente y más completo) salvo la persistencia, que acá es en memoria como en clase12.

## Vista general

```
 Expo Go (celular) / Expo Web (Cypress)
        │  HTTP (axios, Bearer JWT)        │  WebSocket (socket.io-client, JWT en handshake)
        ▼                                   ▼
 Express 5 ── routes ── middlewares (autenticar, autorizar, validate)
                │
           controllers  (parseo de params/query, status codes)
                │
            services    (casos de uso, permisos de recurso, toResponse)
                │            └── emite eventos de socket después de persistir
           repositories (en memoria, API async)
                │
             domain     (reglas de negocio puras, sin Express)
```

## Backend

### Carpetas

```
backend/
  package.json            "type": "module"
  .env.example            PORT, JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV
  Dockerfile  .dockerignore
  src/
    app.js                crearApp({ servicios }) → express app (testeable)
    server.js             dotenv, sembrar, http.createServer(app), socket.io, listen 0.0.0.0
    config/reloj.js       export const reloj = { ahora: () => new Date() }
    domain/               Usuario, Evento, Categoria, TipoEntrada, Compra, CambioEstadoCompra, Mensaje, Resenia, EstadoCompra, Rol
    repositories/         InMemoryRepository + uno por agregado
    services/             AuthService, EventoService, CompraService, ReseniaService, FavoritoService, CategoriaService
    controllers/          BaseController + uno por recurso
    routes/               router.js + XRoutes.js
    validations/          zod por recurso + paginacionValidation + idValidation
    middlewares/          errorHandler, errorLogger, notFoundHandler, autenticar, autorizar, validate
    errors/AppError.js
    sockets/              chatSocket.js (registrarChat(io, servicios))
    docs/openapi/         index.js, comun.js, <modulo>.js
    seeds/                datos.js, sembrar.js
  test/
    domain/  services/  controllers/  integration/  helpers/domainFactories.js
```

### Composición (DI)

Igual que cátedra/grupal: constructor con defaults.

```js
export class CompraService {
  constructor({
    compraRepository = new CompraRepository(),
    eventoRepository = new EventoRepository(),
    reloj = relojSistema,
    notificador = notificadorNulo,
  } = {}) { ... }
}
```

`app.js` exporta `crearApp(dependencias)` para que los tests de integración armen la app con repos limpios. Un único `contenedor.js` arma las instancias compartidas (los repos en memoria deben ser **singletons** por proceso, si no cada service ve datos distintos).

### Repositorio en memoria

```js
export class InMemoryRepository {
  constructor() { this.items = new Map(); this.nextId = 1; }
  async findAll() { return [...this.items.values()]; }
  async findById(id) { return this.items.get(Number(id)) ?? null; }
  async save(entidad) {
    if (entidad.id == null) entidad.id = this.nextId++;
    this.items.set(entidad.id, entidad);
    return entidad;
  }
  async delete(id) { return this.items.delete(Number(id)); }
  async clear() { this.items.clear(); this.nextId = 1; }
}
```

- IDs numéricos autoincrementales (`idValidation` = entero positivo con `z.coerce`).
- Se guardan **instancias de dominio**, no objetos planos.
- API async aunque sea memoria: permite migrar a Mongo sin tocar services (justificado en ADR-003).

### Errores

`AppError(message, statusCode, details)` → `status = statusCode >= 500 ? "error" : "fail"`, `timestamp`. Subclases 400/401/403/404/409/422. `errorHandler` responde `{ status, message, details?, timestamp }`; JSON malformado → 400; resto → 500 "Error interno del servidor".

Criterio 400 vs 422: 400 = forma inválida (zod); 422 = forma válida pero viola regla de negocio (sin cupo, compra utilizada).

### Validación

- Body: `router.post("/", validate(crearEventoValidation), ...)`; schemas `.strict()`.
- Query: `extraerYValidarQuery(req.query, schema)` en el controller; paginación `page` (default 1), `limit` (default 20, máx 50).
- Params: `parsearId(req.params.id)`.

### Auth

- `POST /auth/login` → `{ token, usuario }`. JWT HS256, `sub = id`, payload `{ rol }`, expira según `JWT_EXPIRES_IN` (default `8h`, comodidad para la demo).
- `autenticar` lee `Authorization: Bearer`, setea `req.usuario = { id, rol }`.
- `autorizar(...roles)` → 403 si el rol no coincide.
- Permisos de recurso (ser dueño de la compra / organizador del evento) se chequean en el **service**, que es el que conoce las entidades.
- Todas las rutas requieren login salvo `POST /auth/login`, `GET /healthcheck`, `GET /categorias`, `GET /eventos`, `GET /eventos/:id`, `GET /organizadores/:id/resenias`, `/api-docs`.

### Respuestas

- Sin wrapper. Entidad: el objeto. Lista paginada: `{ eventos, total, page, totalPages }`.
- `toResponse` en el service decide la forma (nunca se expone `passwordHash`).
- Referencias embebidas como resumen: `organizador: { id, nombre, puntajePromedio }`.

### Naming

| Qué | Convención | Ejemplo |
|---|---|---|
| Clases y sus archivos | PascalCase | `CompraService.js` |
| Validaciones, middlewares, sockets | camelCase | `compraValidation.js` |
| Constantes | UPPER_SNAKE | `TRANSICIONES` |
| Enums | `Object.freeze` | `EstadoCompra.PENDIENTE` |
| Endpoints | plural camelCase | `/compras/:id/mensajes` |
| Mensajes | castellano, voseo | "No podés cancelar una compra utilizada" |

## Frontend

### Stack

Expo SDK estable más reciente (template `blank`, JavaScript) + `expo-router`, `react-native-paper`, `react-native-safe-area-context`, `axios`, `socket.io-client`, `expo-secure-store` (nativo) / `localStorage` (web), `@expo/vector-icons`.

### Carpetas

```
frontend/
  app/
    _layout.jsx              PaperProvider + AuthProvider + Stack
    index.jsx                redirige según sesión y rol
    (auth)/login.jsx
    (comprador)/_layout.jsx  Tabs: explorar, mis-compras, favoritos, perfil
    (organizador)/_layout.jsx Tabs: mis-eventos, perfil
    eventos/[id].jsx  eventos/[id]/comprar.jsx  eventos/[id]/compras.jsx  eventos/nuevo.jsx
    compras/[id].jsx  compras/[id]/chat.jsx  compras/[id]/resenia.jsx
  src/pantallas/<nombre>/  UI + lógica de cada pantalla (+ test); los archivos de app/ solo la importan
  src/api/      cliente.js, authApi.js, eventosApi.js, comprasApi.js, ..., socket.js
  src/auth/     AuthContext.jsx, sesion.js
  src/components/
  src/hooks/
  src/tema/     tema.js (MD3 + colores de estado), espaciado.js
```

### Cliente HTTP

```js
const cliente = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL });
cliente.interceptors.request.use(async (config) => { /* Bearer desde sesion */ });
export function mensajeDeError(error) {
  return error.response?.data?.message ?? "No pudimos conectar con el servidor";
}
```

Cada `<recurso>Api.js` exporta funciones que devuelven `data` (`obtenerEventos(filtros)`, `crearCompra(body)`).

### Estado

Sin librería global. `AuthContext` para sesión; datos de pantalla con hooks locales (`useCargar(fn, deps)` → `{ datos, cargando, error, recargar }`). Si aparece cache compartido real, evaluar TanStack Query con ADR.

## Formato y lint

- Prettier en la raíz (`.prettierrc.json`: 2 espacios, `;`, comillas dobles).
- ESLint flat config (pendiente de instalar en It1): `js/recommended` para back, `eslint-plugin-react` + `react-hooks` para front.
