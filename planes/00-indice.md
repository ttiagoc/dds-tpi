# 00 — Índice de planes y trazabilidad

## Planes

| # | Plan | Para qué |
|---|---|---|
| 01 | [Arquitectura y convenciones](01-arquitectura-y-convenciones.md) | Capas, carpetas, naming, formatos |
| 02 | [Dominio](02-dominio.md) | Clases, reglas de negocio, estados de compra |
| 03 | [Contratos de API](03-api-contratos.md) | Endpoints, payloads, errores, eventos de socket |
| 04 | [Pantallas](04-frontend-pantallas.md) | Navegación, pantallas, componentes |
| 05 | [Testing](05-testing.md) | Unit, integración, front, e2e |
| 06 | [Roadmap](06-roadmap-iteraciones.md) | Iteraciones y criterios de aceptación |
| 07 | [IA, skills y evidencia](07-ia-skills-y-evidencia.md) | Cómo se usa la IA y cómo se documenta |

## Estado

- [x] It0 — Setup, planes, skills, ADRs
- [x] It1 — Backend base, dominio, auth
- [x] It2 — API completa + Swagger
- [x] It3 — Chat Socket.io (back)
- [x] It4 — App Expo
- [x] It5 — E2E, Docker, pulido
- [ ] It6 — Video

## Trazabilidad casos de uso → implementación

| # | Caso de uso (consigna) | Endpoint(s) | Pantalla(s) | Tests clave |
|---|---|---|---|---|
| CU1 | Comprador ve sus compras, estado claro y días restantes si CONFIRMADA | `GET /compras` | MisCompras | `Compra.diasRestantes`, integración `GET /compras`, RNTL MisCompras |
| CU2 | Organizador ve compras de un evento, estados y disponibles por tipo | `GET /eventos/:id/compras` | ComprasDelEvento | service resumen, permisos 403 |
| CU3 | Comprador busca eventos por texto o categoría | `GET /eventos?q=&categoria=`, `GET /categorias` | Explorar | repo/service búsqueda, e2e buscar+comprar |
| CU4 | Organizador crea evento con tipos de entrada (precio + cupo) | `POST /eventos` | CrearEvento | dominio `Evento`/`TipoEntrada`, validación zod |
| CU5 | Comprador envía mensajes en el chat de la compra | `POST /compras/:id/mensajes` + socket | Chat | service mensajes, socket |
| CU6 | Organizador responde mensajes en el chat | ídem | Chat | permisos chat |
| CU7 | Comprador cancela para obtener reembolso | `POST /compras/:id/cancelacion` | DetalleCompra | transiciones, libera cupo, integración `compras.test.js`, RNTL `AccionesCompra.test.jsx` |
| CU8 | Cancelación solo si no UTILIZADA y evento no realizado | ídem (422) | DetalleCompra (botón oculto/deshabilitado) | `Compra.puedeCancelarse` |
| CU9 | Con entrada utilizada, comprador puntúa y comenta | `POST /compras/:id/uso`, `POST /compras/:id/resenia` | DetalleCompra, Reseñar | reglas de reseña |
| CU10 | Reseñas del organizador visibles en sus eventos | `GET /organizadores/:id/resenias`, `GET /eventos/:id` | DetalleEvento | promedio organizador |
| CU11 | Ordenar eventos por precio, fecha, puntaje organizador | `GET /eventos?ordenarPor=&orden=` | Explorar | service ordenamiento |
| CU12 | Comprar eligiendo tipo y cantidad sin superar cupo | `POST /compras` | Comprar | `TipoEntrada.hayCupoPara`, 422 sin cupo |
| Extra | Favoritos | `/usuarios/yo/favoritos` | DetalleEvento, Favoritos | |
| Extra | Historial de estados | `GET /compras/:id` (`historial`) | DetalleCompra (timeline) | `CambioEstadoCompra` |
