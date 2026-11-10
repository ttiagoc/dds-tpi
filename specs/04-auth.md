# Spec 04 — Autenticación JWT

- **Estado:** implementada
- **Rama:** `feature/auth`
- **Casos de uso:** — (precondición de todos; ADR-004)
- **Iteración:** It1

## Contexto
Los usuarios sembrados inician sesión con email y contraseña y reciben un JWT. Las rutas protegidas lo exigen, y los permisos por rol se chequean antes del controller. Los permisos sobre recursos (ser dueño de la compra, etc.) quedan para los services de It2.

## Historias
- Como comprador u organizador, quiero iniciar sesión con mi email y contraseña para usar la app según mi rol.
- Como app, quiero `GET /auth/yo` para recuperar la sesión guardada al abrir.

## Reglas / decisiones
- **A1** Login: busca por email sin distinguir mayúsculas y compara con `bcrypt.compare`. Si el email no existe o la contraseña no coincide → 401 "Email o contraseña incorrectos" (mismo mensaje para no revelar qué emails existen). Si el email no existe, igual compara contra un hash fijo para que el tiempo de respuesta tampoco lo revele.
- **A2** Token: HS256, `sub = String(id)`, payload `{ rol }`, `expiresIn = JWT_EXPIRES_IN` (8 h por defecto). Al verificar se aceptan solo HS256. `iat`/`exp` usan el reloj del sistema, no el reloj inyectable (decisión: los tests de vencimiento firman con `expiresIn` negativo).
- **A3** `autenticar`:
  - sin header `Authorization` o sin el prefijo `Bearer ` → 401 "Necesitás iniciar sesión";
  - token inválido, vencido, o de un usuario que ya no existe en el repo → 401 "Tu sesión expiró o no es válida. Iniciá sesión de nuevo";
  - si todo está bien, `req.usuario = { id, rol }` con los datos del repo, no los del token.
- **A4** `autenticarOpcional`: sin token, o con un token que falla → sigue como anónimo (`req.usuario` sin definir). Nunca responde 401. Un error que no es de autenticación (p. ej. del repo) sí se propaga.
- **A5** `autorizar(...roles)`: sin `req.usuario` → 401 "Necesitás iniciar sesión"; si el rol no está en la lista → 403 "No tenés permiso para realizar esta acción".
- **A6** Validación del login con zod `.strict()`: `email` con formato de email y `password` no vacío. Si falla → 400 "Datos inválidos" con `details`. Mensajes propios: "El email no es válido" y "La contraseña es obligatoria"; el resto sale del locale `es`.
- **A7** Usuario en las respuestas (`AuthService.toResponse`): `{ id, nombre, apellido, email, rol }`. Nunca incluye `passwordHash`. `GET /auth/yo` usa `AuthService.perfil(id)`, que vuelve a buscar al usuario en el repo (doble consulta aceptada, porque `req.usuario` solo lleva `{ id, rol }`); si no existe → 401 de sesión inválida.
- **A8** Mensajes de zod en castellano: `validations/zod.js` exporta `z` con `z.config(z.locales.es())` y todos los schemas lo importan de ahí. Afecta los `details` de cualquier 400.
- **A9** El contenedor recibe `entorno` (por defecto `leerEntorno()`), crea `authService` con `usuarioRepository`, `jwtSecret` y `jwtExpiresIn`, y lo expone en `servicios`. El router arma `autenticar` y `autenticarOpcional` una sola vez y se los pasa a las rutas.

## Contrato de API (ya está en `planes/03`)
| Método | Ruta | Auth | Body | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/auth/login` | 🔓 | `{ email, password }` | 200 `{ token, usuario }` | 400, 401 |
| GET | `/auth/yo` | 🔐 | — | 200 usuario | 401 |

## Pantallas
Ninguna (la pantalla de login es de It4).

## Criterios de aceptación
```gherkin
Escenario: login correcto
  Cuando hago POST /auth/login con ana@aiticket.com y Demo1234!
  Entonces responde 200 con token y usuario { id, nombre, apellido, email, rol: COMPRADOR } sin passwordHash

Escenario: email con mayúsculas
  Cuando hago login con ANA@AITICKET.COM
  Entonces responde 200

Escenario: contraseña incorrecta o email inexistente
  Entonces responde 401 "Email o contraseña incorrectos"

Escenario: body inválido
  Cuando hago login con { email: "ana" } o con campos de más
  Entonces responde 400 "Datos inválidos" con details en castellano

Escenario: recuperar la sesión
  Dado el token del login
  Cuando hago GET /auth/yo con Bearer token
  Entonces responde 200 con el mismo usuario

Escenario: sin token
  Cuando hago GET /auth/yo sin Authorization, o con "Token abc"
  Entonces responde 401 "Necesitás iniciar sesión"

Escenario: token vencido, adulterado o de un usuario borrado
  Entonces responde 401 "Tu sesión expiró o no es válida. Iniciá sesión de nuevo"

Escenario: rol incorrecto
  Dado autorizar(ORGANIZADOR) y una sesión de comprador
  Entonces pasa ForbiddenError "No tenés permiso para realizar esta acción"
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit service | `login` correcto (el token decodifica `sub` y `rol`, `exp` según `expiresIn`), email en mayúsculas, contraseña mala, email inexistente (compara igual contra el hash fijo); `usuarioDesdeToken` con token válido, vencido, firmado con otro secret, con otro algoritmo, de un usuario inexistente; `perfil` con id existente e inexistente; `toResponse` sin `passwordHash` |
| Unit middleware | `autenticar`: sin header, sin `Bearer`, token inválido, válido (`req.usuario`); `autenticarOpcional`: sin token, inválido, válido y error no de auth (se propaga); `autorizar`: sin usuario, rol permitido, rol no permitido, varios roles |
| Unit validación | `loginValidation`: válido, email mal formado, password vacío, campos de más; mensajes en castellano |
| Integración | los 8 escenarios de arriba contra la app con el seed |

## Fuera de alcance
- Registro de usuarios y cambio de contraseña (no figuran en los casos de uso).
- Refresh tokens y revocación de tokens.
- Swagger de `/auth`: va en `docs/swagger` (It2).
- Auth del handshake de Socket.io: It3.

## Notas de IA
- El usuario eligió mensajes distintos para "falta iniciar sesión" y "sesión expirada", que `autenticar` consulte el repo en cada request, y 400 para un email mal formado. Las tres eran las opciones que recomendó la IA.
- La IA detectó que los `details` de zod salían en inglés, en contra de AGENTS.md, y propuso el locale `es` de zod (A8).
