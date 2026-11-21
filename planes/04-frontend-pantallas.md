# 04 — Frontend: navegación y pantallas

Expo + expo-router + React Native Paper (MD3). Mobile first (360-414 px de ancho); en web se centra con ancho máximo 480 para Cypress. Identidad visual "Minimal cálido" (Manrope, neutros cálidos, acento `#BF4316`): `specs/19-identidad-visual.md` y ADR-012.

## Navegación

```
src/app/index.jsx ─ sin sesión ──▶ (auth)/login
               ── COMPRADOR ───▶ (comprador) Tabs
               ── ORGANIZADOR ─▶ (organizador) Tabs

(comprador) Tabs:  Explorar | Entradas | Mensajes | Favoritos | Perfil
(organizador) Tabs: Mis eventos | Mensajes | Perfil
(Mensajes muestra badge con los no leídos; spec 20)

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
| Explorar | CU3, CU11 | `Searchbar` (debounce 300 ms), chips horizontales de categorías (paginados, chevron "Ver más filtros", spec 26), menú de orden (6 opciones: fecha/precio/puntaje × asc/desc), lista de `TarjetaEvento`, "cargar más" (6 por página, spec 26), pull-to-refresh. Detalle en `specs/10-explorar-eventos.md` | `GET /categorias`, `GET /eventos` | `buscador`, `chip-categoria-todas`, `chip-categoria-<id>`, `orden-menu`, `orden-<ordenarPor>-<orden>`, `tarjeta-evento-<id>`, `cargar-mas` |
| DetalleEvento | CU10, CU12 | imagen, nombre, fecha, lugar, dirección con botón "Cómo llegar" a Google Maps (`evento-como-llegar`, spec 28), categoría, descripción, organizador + estrellas, lista de tipos con precio y disponibles, botón favorito (optimista, solo comprador), botón Comprar ("Agotado" si no hay disponibles, solo comprador), últimas 3 reseñas del organizador. Detalle en `specs/10-explorar-eventos.md` | `GET /eventos/:id`, `GET /organizadores/:id/resenias`, favoritos | `evento-comprar`, `evento-favorito`, `tipo-entrada-<id>`, `resenias-organizador`, `resenia-<id>` |
| Comprar | CU12 | solo comprador. `RadioButton` de tipos (deshabilitado si 0 disponibles, preselecciona el primero disponible), `SelectorCantidad` con tope = min(disponibles, 10), total calculado, Confirmar sin diálogo; éxito → `router.replace` a DetalleCompra; 422 → mensaje + recarga del evento. Detalle en `specs/10b-comprar.md` | `GET /eventos/:id`, `POST /compras` | `tipo-<id>`, `cantidad-mas`, `cantidad-menos`, `cantidad-valor`, `comprar-total`, `comprar-confirmar`, `comprar-error` |
| MisCompras | CU1 | chips de filtro (Todas + 5 estados), lista paginada de `TarjetaCompra` con `ChipEstado`, "Faltan N días" / "Falta 1 día" / "Es hoy" si CONFIRMADA, cargar más, pull-to-refresh, refresco al recuperar el foco. Detalle en `specs/10c-mis-compras.md` | `GET /compras` | `filtro-estado-todas`, `filtro-estado-<ESTADO>`, `lista-compras`, `compra-<id>`, `dias-restantes-<id>`, `cargar-mas` |
| DetalleCompra | CU1, CU7-9 | estado grande, datos del evento, total, timeline del historial (lectura en `specs/10c-mis-compras.md`); botones según `acciones`, cada uno con su spec: Pagar (directo + Snackbar) y Cancelar con diálogo de confirmación en `specs/10c2-acciones-compra.md`, Reseñar (`compra-resenar`) y la sección "Tu reseña" (`compra-resenia`) en `specs/10d-resenar-favoritos.md`, Marcar utilizada con diálogo (`confirmar-utilizada`) en `specs/11-pantallas-organizador.md`, Chat (`compra-chat`, siempre visible) y recarga por `compra:estado` en `specs/12-chat-front.md` | `GET /compras/:id`, acciones | `compra-pagar`, `compra-cancelar`, `confirmar-cancelacion`, `compra-accion-error`, `compra-aviso`, `compra-utilizada`, `confirmar-utilizada`, `compra-resenar`, `compra-resenia`, `compra-chat` |
| Chat | CU5, CU6 | ambos roles, entra desde DetalleCompra (`compra-chat`, siempre visible). Burbujas propias a la derecha sin nombre y ajenas a la izquierda con nombre, fecha y hora cortas; input con contador 500 y Enviar deshabilitado si vacío; el mensaje propio aparece con el 201 (dedupe por `id` con `mensaje:nuevo`); aviso "Sin conexión en vivo" con Actualizar y recarga al reconectar. DetalleCompra recarga si llega `compra:estado` distinto. Encabezado propio fijo con botón Volver (`chat-volver`; la ruta no usa el encabezado nativo, spec 29) fuera de la lista; lista invertida que carga la página anterior al llegar al tope, con "Ver mensajes anteriores" (`chat-ver-anteriores`) como respaldo (specs 18 y 27); al abrir y al recibir mensajes marca leído (spec 20). Detalle en `specs/12-chat-front.md` | `GET /compras/:id`, `GET/POST /compras/:id/mensajes`, `PUT /compras/:id/mensajes/leidos` + socket | `lista-mensajes`, `mensaje-<id>`, `chat-vacio`, `chat-carga-error`, `chat-input`, `chat-contador`, `chat-enviar`, `chat-error`, `chat-sin-conexion`, `chat-actualizar` |
| Reseñar | CU9 | solo comprador. Carga la compra (si no `puedeReseniar`, estado vacío con Volver); `Estrellas` (1-5 tocables), comentario multilínea con contador, Enviar deshabilitado hasta completar; éxito → vuelve a DetalleCompra con Snackbar; errores con el texto del back. Detalle en `specs/10d-resenar-favoritos.md` | `GET /compras/:id`, `POST /compras/:id/resenia` | `estrella-<n>`, `resenia-detalle`, `resenia-enviar`, `resenia-error`, `resenia-no-disponible` |
| Favoritos | extra | lista paginada de `TarjetaEvento` con cargar más, recarga al volver, vacío con "Explorar eventos". Detalle en `specs/10d-resenar-favoritos.md` y `specs/18-paginacion-favoritos-chat.md` | `GET /usuarios/yo/favoritos` | `lista-favoritos`, `sin-favoritos`, `ir-a-explorar` |
| Perfil | — | nombre, email, rol, apariencia Claro / Oscuro / Automático (por defecto Claro, guardada en el dispositivo, spec 30), cerrar sesión. Ruta `(comprador)/perfil` y `(organizador)/cuenta` (dos `/perfil` en grupos distintos chocan); el tab es `tab-perfil` en los dos roles | `GET /auth/yo` (al arrancar) | `perfil-nombre`, `perfil-email`, `perfil-rol`, `cerrar-sesion` |
| MisEventos | CU2 | resumen de recaudado y vendidas de todos sus eventos (`resumen-recaudado`, `resumen-vendidas`, spec 22); lista de eventos propios con vendidas/cupo, recaudado y chip "Finalizado"; abre ComprasDelEvento; recarga al volver (`specs/11-pantallas-organizador.md`). FAB "Nuevo evento" y aviso "Evento publicado" en `specs/11b-crear-evento.md` | `GET /organizadores/yo/eventos` | `lista-mis-eventos`, `evento-propio-<id>`, `sin-eventos-propios`, `fab-nuevo-evento` |
| CrearEvento | CU4 | nombre, descripción, categoría (buscador con debounce y lista paginada, spec 25), fecha y hora (`react-native-paper-dates`, sin días pasados), lugar, dirección en campos (calle, número, localidad o barrio, provincia) con "Ver en el mapa" y confirmación "Sí, es acá" (specs 28 y 31), foto de portada opcional desde la galería (`SelectorImagen`, sube con `POST /imagenes`, `specs/21-subir-imagen-evento.md`), de 1 a 10 tipos (agregar/quitar: nombre, precio, cupo, descripción opcional); "Publicar" siempre habilitado: al tocarlo valida en el front (R8, R13), marca cada campo con su error, enfoca el primero y lo anuncia; los `details` de 400/422 del back se muestran en su campo (spec 23); teclado numérico con "Listo" y contenido que sube con el teclado (spec 24); éxito → Mis eventos con aviso "Evento publicado". Detalle en `specs/11b-crear-evento.md` | `GET /categorias`, `POST /imagenes`, `POST /eventos` | `evento-nombre`, `evento-categoria`, `evento-fecha`, `evento-hora`, `tipo-<i>-nombre`, `tipo-agregar`, `evento-guardar`, `evento-error` |
| Mensajes | CU5, CU6 | ambos roles (pestaña; rutas `(comprador)/mensajes` y `(organizador)/bandeja`). Conversaciones paginadas, primero la más reciente: foto del evento con iniciales de la contraparte, contraparte, evento y número de compra, vista previa del último mensaje, hora relativa y badge de no leídos (negrita si hay). Abre el Chat; recarga al volver y con `conversacion:actualizada`. Detalle en `specs/20-bandeja-mensajes.md` | `GET /usuarios/yo/conversaciones` + socket | `lista-conversaciones`, `conversacion-<compraId>`, `sin-conversaciones`, `tab-mensajes` |
| ComprasDelEvento | CU2 | tarjetas de disponibilidad por tipo (`ProgressBar` vendidas/cupo + "Quedan N" o "Agotado"), filtro por estado, lista de `TarjetaCompra` con el nombre del comprador; abre DetalleCompra. Detalle en `specs/11-pantallas-organizador.md` | `GET /eventos/:id/compras` | `disponibilidad-<tipoId>`, `filtro-estado-<ESTADO>`, `lista-compras-evento` |

## Componentes compartidos (`src/components/`)

| Componente | Uso |
|---|---|
| `ChipEstado` | color e ícono por `EstadoCompra` desde el tema |
| `TarjetaEvento` | imagen, nombre, fecha, precio desde, puntaje organizador |
| `ImagenEvento` | imagen 16:9 o placeholder con ícono |
| `PuntajeOrganizador` | nombre + `Estrellas` + puntaje, o "Sin reseñas" |
| `SelectorCantidad` | − / n / + con min/max (`<prefijo>-menos`, `<prefijo>-valor`, `<prefijo>-mas`) |
| `Estrellas` | lectura y edición |
| `EstadoVacio` | ícono + texto + acción opcional |
| `ErrorCarga` | `HelperText`/`Banner` + Reintentar |
| `Cargando` | `ActivityIndicator` centrado |
| `TarjetaCompra` | evento, tipo × cantidad, total, `ChipEstado`, días restantes |
| `LineaDeTiempo` | historial de estados |
| `Pantalla` | `SafeAreaView` (bordes configurables) + scroll que se adapta al teclado (spec 24) + ancho máximo en web |
| `ChipsFiltro` | fila horizontal de chips con flechas a la izquierda y a la derecha, rellenas con tinta, si queda contenido de ese lado (specs 26 y 29) |
| `CampoNumero` | `TextInput` numérico con tecla de confirmar: `numbers-and-punctuation` en iOS (spec 29) |

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
