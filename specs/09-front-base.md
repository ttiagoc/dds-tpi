# Spec 09 — Base del front: sesión, navegación por rol y login

- **Estado:** aprobada
- **Rama:** `chore/front-base` (absorbe `feature/login`)
- **Casos de uso:** ninguno directo; habilita todos los de It4. Login es requisito de la consigna ("usuarios ya registrados").
- **Iteración:** It4
- **Depende de:** spec 04 (`POST /auth/login`, `GET /auth/yo`), ADR-001 (Expo Go), ADR-002 (Paper), ADR-004 (JWT)

## Contexto
El back está completo; el front es un esqueleto con una sola pantalla. Esta spec arma la base sobre la que se construyen todas las pantallas de It4: tema, cliente HTTP, sesión persistida, navegación según rol, componentes transversales y helpers de test. Incluye la pantalla Login porque sin ella no se puede probar la sesión de punta a punta.

## Historias
- Como usuario registrado, quiero iniciar sesión con email y contraseña para usar la app según mi rol.
- Como usuario, quiero que la app recuerde mi sesión al volver a abrirla, y que me pida login si venció.
- Como usuario, quiero cerrar sesión desde Perfil.

## Reglas (front)
- **RB1 Arranque.** `index` muestra `Cargando` mientras restaura la sesión:
  - sin sesión guardada → `(auth)/login`;
  - con sesión guardada → `GET /auth/yo` con el token. 200 → tabs del rol (con el usuario que devuelve el back). 401 → borra la sesión y va a login. Error de red → mantiene la sesión guardada y entra a los tabs (las pantallas muestran su propio error).
- **RB2 Sesión.** `{ token, usuario }` se guarda bajo la clave `sesion`: `expo-secure-store` en nativo y `localStorage` en web (`src/auth/sesion.js`: `leerSesion`, `guardarSesion`, `borrarSesion`).
- **RB3 Cliente HTTP** (`src/api/cliente.js`):
  - `baseURL = EXPO_PUBLIC_API_URL`;
  - agrega `Authorization: Bearer <token>` si hay sesión;
  - ante un 401 de cualquier request (salvo `POST /auth/login`) cierra la sesión y vuelve a login;
  - `mensajeDeError(error)` devuelve `error.response.data.message` o "No pudimos conectar con el servidor".
- **RB4 Login:**
  - campos email y contraseña (con botón para mostrarla); Ingresar deshabilitado si alguno está vacío;
  - mientras envía, Ingresar con `loading` y deshabilitado;
  - error del back (401 "Email o contraseña incorrectos", 400 "El email no es válido") en un `HelperText` de error; se conserva lo escrito;
  - éxito → guarda la sesión y reemplaza la ruta por los tabs del rol (no se puede volver a login con "atrás");
  - en desarrollo (`__DEV__`) muestra chips con los 4 usuarios del seed que completan email y contraseña.
- **RB5 Navegación por rol:**
  - COMPRADOR → tabs Explorar, Mis compras, Favoritos, Perfil;
  - ORGANIZADOR → tabs Mis eventos, Perfil;
  - un usuario no puede entrar al grupo del otro rol (el layout del grupo redirige a `index`);
  - las rutas de los grupos exigen sesión (sin sesión → login).
- **RB6 Tabs provisorios.** Cada tab muestra `EstadoVacio` "Próximamente" hasta que llegue su feature. Perfil es real: nombre completo, email, rol y "Cerrar sesión" (borra la sesión y va a login).
- **RB7 Tema.** Paper MD3 claro/oscuro según el sistema, primario violeta "escenario", tokens de estado de compra (`theme.estados`) con color + ícono, espaciado y radios en `src/tema/`. Ningún hex fuera de `tema.js`.

## Contrato de API
Sin cambios. Usa `POST /auth/login` y `GET /auth/yo` tal cual están en `planes/03`.

## Pantallas
- **Login** (`(auth)/login`): `login-email`, `login-password`, `login-ver-password`, `login-ingresar`, `login-error`, `login-demo-<email>`.
- **Perfil** (`(comprador)/perfil`, `(organizador)/perfil`, una sola pantalla en `src/pantallas/perfil/`): `perfil-nombre`, `perfil-rol`, `cerrar-sesion`.
- **Tabs provisorios**: `EstadoVacio` con `testID="proximamente"`.

Componentes transversales (`src/components/`): `Pantalla`, `Cargando`, `ErrorCarga`, `EstadoVacio`, `ChipEstado`. Hook `useCargar(fn, deps)` → `{ datos, cargando, error, recargar }`. Utils `formatearFecha` y `formatearPrecio` (`es-AR`, ARS).

## Criterios de aceptación
```gherkin
Escenario: abrir la app sin sesión
  Dado que no hay sesión guardada
  Cuando abro la app
  Entonces veo la pantalla de login

Escenario: login de un comprador y de un organizador
  Dado que estoy en login
  Cuando ingreso ana@aiticket.com / Demo1234! y toco Ingresar
  Entonces veo los tabs Explorar, Mis compras, Favoritos y Perfil
  Y la sesión queda guardada
  Cuando lo mismo con fenix@aiticket.com
  Entonces veo los tabs Mis eventos y Perfil

Escenario: credenciales incorrectas
  Cuando ingreso ana@aiticket.com con la contraseña "mal"
  Entonces veo "Email o contraseña incorrectos", sigo en login y el email sigue escrito
  Y con un campo vacío el botón Ingresar está deshabilitado

Escenario: servidor caído
  Dado que el back no responde
  Cuando intento ingresar
  Entonces veo "No pudimos conectar con el servidor"

Escenario: restaurar una sesión válida
  Dado una sesión guardada con un token válido
  Cuando abro la app
  Entonces entro directo a los tabs de mi rol, con el usuario que devuelve GET /auth/yo

Escenario: sesión vencida
  Dado una sesión guardada con un token vencido
  Cuando abro la app (o cualquier request responde 401)
  Entonces la sesión se borra y veo login

Escenario: cerrar sesión
  Dado que estoy logueada como Ana
  Cuando toco Cerrar sesión en Perfil
  Entonces veo login y no queda sesión guardada

Escenario: un rol no entra a las rutas del otro
  Dado que estoy logueada como Ana (COMPRADOR)
  Cuando navego a una ruta del grupo (organizador)
  Entonces vuelvo a los tabs del comprador
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Front unit | `sesion.js` (nativo y web con mocks de secure-store / localStorage); `cliente.js`: header Bearer, 401 dispara cierre, `mensajeDeError` con y sin respuesta; `useCargar`: cargando → datos, error, recargar; `formatearFecha`/`formatearPrecio` |
| Front componentes (RNTL) | `ChipEstado` muestra texto + ícono de cada estado; `ErrorCarga` llama a Reintentar; `EstadoVacio`; `Pantalla` renderiza hijos |
| Front pantallas (RNTL) | Login: botón deshabilitado con vacíos, llama a `login` con email y password, muestra el error del back, guarda sesión y navega según rol, chips demo completan los campos. Perfil: muestra datos y cierra sesión. `AuthContext`: restaura con `/auth/yo`, borra con 401, mantiene con error de red |
| Helper | `renderConProviders(ui, { usuario })` con `PaperProvider` + `AuthProvider` sembrado (`planes/05`) |
| Manual | login, restaurar y cerrar sesión en Expo Go (celular) y en web |
| E2E | fuera de esta rama (`chore/e2e-cypress`, It5) |

## Fuera de alcance
- Registro de usuarios, recuperar contraseña, refresh token.
- Pantallas reales de Explorar, Mis compras, Favoritos y Mis eventos (sus features).
- `TarjetaEvento`, `SelectorCantidad`, `Estrellas`, `LineaDeTiempo`, `Precio` como componente: nacen con la feature que los usa.
- Socket en el front (`feature/chat-front`).

## Notas de IA
- El usuario eligió:
  - restaurar validando con `GET /auth/yo`, y que un 401 en cualquier request cierre la sesión;
  - incluir Login en esta rama (absorbe `feature/login`);
  - solo componentes transversales;
  - tabs provisorios con `EstadoVacio` y Perfil real.
- La IA agregó sin preguntar (revisable):
  - con error de red al restaurar, mantener la sesión guardada en vez de expulsar al usuario;
  - chips de usuarios demo solo con `__DEV__`;
  - redirección cuando un rol entra al grupo del otro;
  - clave de storage `sesion` y testIDs `login-ver-password`, `login-error`, `login-demo-<email>`, `perfil-*`, `proximamente`.
- Antes de codear: leer la documentación de Expo SDK 58 (expo-router tabs y redirects, secure-store), como pide `frontend/AGENTS.md`.
