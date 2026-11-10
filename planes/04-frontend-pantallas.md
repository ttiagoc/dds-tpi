# 04 — Frontend: navegación y pantallas

Expo + expo-router + React Native Paper (MD3). Mobile first (360-414 px de ancho); en web se centra con ancho máximo 480 para Cypress.

## Navegación

```
src/app/index.jsx ─ sin sesión ──▶ (auth)/login
               ── COMPRADOR ───▶ (comprador) Tabs
               ── ORGANIZADOR ─▶ (organizador) Tabs

(comprador) Tabs:  Explorar | Mis compras | Favoritos | Perfil
(organizador) Tabs: Mis eventos | Perfil

Stack compartido (encima de los tabs):
  eventos/[id]            DetalleEvento
  eventos/[id]/comprar    Comprar
  eventos/nuevo           CrearEvento            (organizador)
  eventos/[id]/compras    ComprasDelEvento       (organizador)
  compras/[id]            DetalleCompra          (ambos roles, acciones según `acciones`)
  compras/[id]/chat       Chat
  compras/[id]/resenia    Reseñar
```

## Pantallas

| Pantalla | CU | Contenido | Endpoints | testIDs clave |
|---|---|---|---|---|
| Login | — | email, password (con ojo), botón Ingresar, error de credenciales, chips de usuarios demo (solo dev). Detalle en `specs/09-front-base.md` | `POST /auth/login` | `login-email`, `login-password`, `login-ingresar`, `login-error` |
| Explorar | CU3, CU11 | `Searchbar` (debounce 300 ms), chips horizontales de categorías, menú de orden (fecha/precio/puntaje + asc/desc), lista de `TarjetaEvento`, scroll infinito o "cargar más", pull-to-refresh | `GET /categorias`, `GET /eventos` | `buscador`, `chip-categoria-<id>`, `orden-menu`, `tarjeta-evento-<id>` |
| DetalleEvento | CU10, CU12 | imagen, nombre, fecha, lugar, categoría, descripción, organizador + estrellas, lista de tipos con precio y disponibles, botón favorito, botón Comprar, últimas reseñas del organizador | `GET /eventos/:id`, `GET /organizadores/:id/resenias`, favoritos | `evento-comprar`, `evento-favorito` |
| Comprar | CU12 | `RadioButton` de tipos (deshabilitado si 0 disponibles), `SelectorCantidad` con tope = disponibles, total calculado, Confirmar; éxito → DetalleCompra | `POST /compras` | `tipo-<id>`, `cantidad-mas`, `cantidad-menos`, `comprar-confirmar` |
| MisCompras | CU1 | filtros por estado (`SegmentedButtons` o chips), lista con `ChipEstado` coloreado, "Faltan N días" si CONFIRMADA | `GET /compras` | `compra-<id>`, `dias-restantes-<id>` |
| DetalleCompra | CU1, CU7-9 | estado grande, datos del evento, total, timeline del historial, botones según `acciones` (Pagar, Cancelar con diálogo de confirmación, Marcar utilizada, Reseñar), botón Chat | `GET /compras/:id`, acciones | `compra-pagar`, `compra-cancelar`, `confirmar-cancelacion`, `compra-utilizada`, `compra-resenar`, `compra-chat` |
| Chat | CU5, CU6 | lista de burbujas (propias a la derecha), input + enviar, recibe en vivo por socket, indicador de conexión | `GET/POST /compras/:id/mensajes` + socket | `chat-input`, `chat-enviar`, `mensaje-<id>` |
| Reseñar | CU9 | `Estrellas` (1-5 tocables), comentario multilínea, Enviar | `POST /compras/:id/resenia` | `estrella-<n>`, `resenia-detalle`, `resenia-enviar` |
| Favoritos | extra | lista de `TarjetaEvento` | `GET /usuarios/yo/favoritos` | |
| Perfil | — | nombre, email, rol, cerrar sesión. Ruta `(comprador)/perfil` y `(organizador)/cuenta` (dos `/perfil` en grupos distintos chocan); el tab es `tab-perfil` en los dos roles | `GET /auth/yo` (al arrancar) | `perfil-nombre`, `perfil-email`, `perfil-rol`, `cerrar-sesion` |
| MisEventos | CU2 | lista de eventos propios con vendidas/cupo, FAB "Nuevo evento" | `GET /organizadores/yo/eventos` | `fab-nuevo-evento` |
| CrearEvento | CU4 | nombre, descripción, categoría (`Menu`), fecha y hora, lugar, URL de imagen, sección dinámica de tipos (agregar/quitar: nombre, precio, cupo), validación local + errores del back | `GET /categorias`, `POST /eventos` | `evento-nombre`, `tipo-agregar`, `evento-guardar` |
| ComprasDelEvento | CU2 | tarjetas de disponibilidad por tipo (`ProgressBar` vendidas/cupo + "quedan N"), filtro por estado, lista de compras con `ChipEstado` | `GET /eventos/:id/compras` | `disponibilidad-<tipoId>` |

## Componentes compartidos (`src/components/`)

| Componente | Uso |
|---|---|
| `ChipEstado` | color e ícono por `EstadoCompra` desde el tema |
| `TarjetaEvento` | imagen, nombre, fecha, precio desde, puntaje organizador |
| `SelectorCantidad` | − / n / + con min/max |
| `Estrellas` | lectura y edición |
| `EstadoVacio` | ícono + texto + acción opcional |
| `ErrorCarga` | `HelperText`/`Banner` + Reintentar |
| `Cargando` | `ActivityIndicator` centrado |
| `LineaDeTiempo` | historial de estados |
| `Pantalla` | `SafeAreaView` (bordes configurables) + scroll + ancho máximo en web |

## Estados obligatorios por pantalla

| Estado | Cómo |
|---|---|
| Cargando | `Cargando` / skeleton |
| Error | `ErrorCarga` con mensaje del back (`mensajeDeError`) y Reintentar |
| Vacío | `EstadoVacio` con texto claro |
| Enviando | botón `loading` + `disabled` |
| Éxito | `Snackbar` o navegación |
| 403/404 | mensaje específico, botón volver |

## Colores de estado (tokens en `src/tema/tema.js`)

| Estado | Rol de color |
|---|---|
| PENDIENTE | ámbar |
| CONFIRMADA | verde |
| UTILIZADA | azul/gris |
| CANCELADA | rojo |
| REEMBOLSADA | violeta |

Contraste AA en claro y oscuro. Además del color, cada chip lleva ícono + texto (no depender solo del color).
