# Spec 03 — Repositorios en memoria, seed y reset

- **Estado:** aprobada
- **Rama:** `feature/repos-y-seed`
- **Casos de uso:** — (soporte de todos; datos para la demo y los e2e)
- **Iteración:** It1

## Contexto
Persistencia en memoria (ADR-003) con API async, datos de demostración que se cargan al arrancar y un reset para Cypress. El seed tiene que dejar recorribles todos los CU sin preparar nada a mano.

## Reglas / decisiones
- **S1** `InMemoryRepository`: un `Map` y un `nextId`. `findAll()` devuelve una copia del arreglo con las mismas instancias. `findById(id)` convierte el id con `Number` y devuelve `null` si no existe. `save(e)` asigna id si es `null`; si trae un id ≥ `nextId`, corre el contador. `delete(id)` devuelve un booleano. `clear()` vacía el `Map` y vuelve el contador a 1. Todos los métodos son async.
- **S2** Repos concretos, con búsquedas propias:
  - `UsuarioRepository.findByEmail(email)` (sin distinguir mayúsculas)
  - `CategoriaRepository`
  - `EventoRepository.findByOrganizador(id)`
  - `CompraRepository.findByComprador(id)` y `findByEvento(id)`
  - `ReseniaRepository.findByCompraId(id)`, `findByEvento(id)` y `findByOrganizador(id)`
  - Los filtros, el orden y la paginación de `GET /eventos` van en el service en It2.
- **S3** `crearContenedor` crea los 5 repos una sola vez. `resetear()` = `clear()` de cada repo + `sembrar(repos, reloj)`. `server.js` llama a `resetear()` antes de `listen`.
- **S4** `POST /test/reset` → 204. El router de test se monta solo si `nodeEnv === "test"`; en cualquier otro entorno esa ruta da 404.
- **S5** Las fechas del seed son relativas a `reloj.ahora()` (por ejemplo, `ahora + 12 días`), así la demo no envejece.
- **S6** Las `vendidas` de cada tipo de entrada se derivan de las compras: cada compra PENDIENTE, CONFIRMADA o UTILIZADA hace `reservar(cantidad)`. El historial de cada compra se arma con fechas coherentes (compra → pago → uso/cancelación).
- **S7** Integración y Cypress usan el mismo seed (`seeds/datos.js`).
- **S8** Las contraseñas se hashean con bcryptjs (costo 10). El hash de `Demo1234!` se calcula una vez por proceso y se reutiliza en cada reset.

## Contenido del seed (`seeds/datos.js`)
- **Usuarios** (contraseña `Demo1234!`):
  - Ana Pérez y Bruno Gómez (COMPRADOR)
  - Fénix Producciones y Ciudad Cultural Konex (ORGANIZADOR, sin apellido)
- **Categorías:** las 6 de `planes/02`.
- **12 eventos:**
  - 9 futuros y 3 pasados, con todas las categorías cubiertas y los dos organizadores con eventos pasados.
  - Uno a menos de 1 día, para mostrar "Falta 1 día".
  - Uno con un tipo casi agotado: VIP con cupo 20 y 18 vendidas por Bruno.
  - Precios variados para probar el orden por precio.
- **Compras de Ana:** todos los estados están presentes.
  - PENDIENTE y CONFIRMADA en eventos futuros (una de ellas en el evento de menos de 1 día).
  - CANCELADA y REEMBOLSADA.
  - 2 UTILIZADA en eventos pasados: una con reseña y otra sin reseña, para poder reseñar en la demo.
  - Una UTILIZADA en un evento futuro (R4), para mostrar el flujo de reseña.
- **Compras de Bruno:** UTILIZADA con reseñas en eventos de los dos organizadores, para que exista el puntaje de ambos y difieran (ordenar por puntaje), más la compra del VIP casi agotado.
- **Chat:** la compra CONFIRMADA de Ana trae 2 mensajes, uno de Ana y uno del organizador.
- **Favoritos:** Ana tiene 2 eventos favoritos.

## Contrato de API
| Método | Ruta | Auth | Respuesta |
|---|---|---|---|
| POST | `/test/reset` | 🔓 solo `NODE_ENV=test` | 204 |

Ya está en `planes/03`.

## Criterios de aceptación
```gherkin
Escenario: guardar asigna ids
  Dado un repo vacío
  Cuando guardo dos entidades sin id
  Entonces quedan con id 1 y 2 y findById("2") devuelve la segunda

Escenario: el seed deja todos los estados para Ana
  Cuando siembro con ahora fijo
  Entonces Ana tiene compras PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA y REEMBOLSADA

Escenario: vendidas consistentes
  Entonces para cada tipo, vendidas = suma de cantidades de sus compras PENDIENTE, CONFIRMADA y UTILIZADA

Escenario: puntajes de organizadores
  Entonces Fénix y Konex tienen promedio de reseñas no nulo y distinto

Escenario: reset en test
  Dado el back con NODE_ENV=test y una compra borrada del repo
  Cuando hago POST /test/reset
  Entonces responde 204 y el seed vuelve a estar completo, con ids desde 1

Escenario: reset fuera de test
  Dado NODE_ENV=development
  Cuando hago POST /test/reset
  Entonces responde 404
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit repo | `InMemoryRepository`: ids, `findById` con string, null, copia en `findAll`, `delete`, `clear` reinicia el contador, id explícito corre el contador |
| Unit repo | cada búsqueda de S2 (incluye email en mayúsculas) |
| Unit seed | cantidades; estados de Ana; reseñas solo sobre UTILIZADA y una por compra; vendidas derivadas; eventos futuros/pasados según `ahora`; el evento a < 1 día; el VIP casi agotado; contraseñas verificables con bcrypt; cada categoría con al menos un evento; promedios de Fénix y Konex distintos; favoritos de Ana |
| Unit contenedor | `resetear` dos veces da los mismos ids y cantidades; los services futuros comparten las instancias de repo |
| Integración | `POST /test/reset` da 204 en test y 404 en development; el reset restaura los datos |

## Fuera de alcance
- Services, endpoints de negocio y auth (`feature/auth` y It2).
- Persistencia real (Mongo): solo se deja la API async lista.

## Notas de IA
- El usuario eligió fechas relativas, un solo seed y vendidas derivadas de las compras; las tres eran las opciones que recomendó la IA.
- `planes/05` mencionaba `sembrarMinimo()`. Se reemplazó por el seed único y `planes/05` ya está actualizado.
